import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'https://studiolink-paris.vercel.app';
const email = process.env.TEST_EMAIL ?? `phase0.pro.debug.${Date.now().toString(36)}@example.com`;
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on('console', (msg) => console.log('console', msg.type(), msg.text()));
page.on('pageerror', (error) => console.log('pageerror', error.message));
page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('supabase.co') && response.status() >= 400) {
    console.log('response', response.status(), url);
    try {
      console.log('body', await response.text());
    } catch {
      // ignore body extraction failures
    }
  }
});

try {
  console.log('email', email);
  await page.goto(`${base}/invite/PRO2024`, { waitUntil: 'networkidle' });
  console.log('invite url', page.url());

  await page.getByRole('button', { name: /créer mon compte/i }).click();
  await page.waitForURL('**/login?mode=signup', { timeout: 15000 });
  console.log('signup url', page.url());

  await page.getByLabel(/adresse email/i).fill(email);
  await page.getByLabel(/^mot de passe$/i).fill(password);
  await page.getByPlaceholder(/confirmer le mot de passe/i).fill(password);
  await page.getByRole('button', { name: /créer mon compte/i }).click();

  await page.waitForURL('**/onboarding', { timeout: 20000 });
  console.log('onboarding url', page.url());

  await page.getByLabel(/nom complet/i).fill('Pro Debug');
  await page.getByRole('button', { name: /terminer/i }).click();
  await page.waitForTimeout(8000);

  console.log('final url', page.url());
  console.log('body', JSON.stringify(await page.locator('body').innerText()));
  await page.screenshot({ path: 'output/playwright/pro-signup-debug-prod.png', fullPage: true });
} finally {
  await browser.close();
}
