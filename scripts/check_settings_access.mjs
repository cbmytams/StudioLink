import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const email = process.env.TEST_EMAIL;
const password = process.env.TEST_PASSWORD;

if (!email || !password) {
  console.error('Missing TEST_EMAIL or TEST_PASSWORD');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const visitedUrls = [];

page.on('framenavigated', (frame) => {
  if (frame === page.mainFrame()) {
    visitedUrls.push(frame.url());
  }
});

try {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(/\/(pro|studio)\/dashboard$/, { timeout: 30000 });

  await page.goto(`${baseUrl}/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  const hasSettingsHeading = await page.getByRole('heading', { name: 'Paramètres' }).count();
  const bouncedToOnboarding = visitedUrls.some((url) => url.endsWith('/onboarding'));

  if (!finalUrl.endsWith('/settings') || hasSettingsHeading === 0 || bouncedToOnboarding) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          finalUrl,
          hasSettingsHeading,
          bouncedToOnboarding,
          visitedUrls,
        },
        null,
        2,
      ),
    );
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        finalUrl,
        visitedUrls,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
