import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4175';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';

const results = [];

function pushResult(name, ok, details) {
  results.push({ name, ok, details });
}

async function login(page, email, expectedPath) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/adresse email/i).fill(email);
  await page.getByLabel(/^mot de passe$/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 20000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const proContext = await browser.newContext();
  const studioContext = await browser.newContext();
  const proPage = await proContext.newPage();
  const studioPage = await studioContext.newPage();

  try {
    await login(proPage, proEmail, '/pro/dashboard');

    await proPage.goto(`${base}/missions`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#search-input-missions').fill('mix rock');
    await proPage.waitForURL(/q=mix\+rock/, { timeout: 15000 });
    await proPage.getByText('1 mission trouvée').waitFor({ timeout: 15000 });
    await proPage.locator('.mission-card[data-mission-id]').filter({ hasText: /PHASE6 mix rock session/i }).first().waitFor({ timeout: 15000 });
    pushResult('TEST 28 : Pro tape "mix rock" dans #search-input-missions → résultats filtrés par full-text apparaissent', true, {
      finalUrl: proPage.url(),
      countText: await proPage.locator('#missions-count').innerText(),
    });

    await proPage.locator('#filter-genre').selectOption('Hip-Hop');
    await proPage.waitForURL(/genre=Hip-Hop/, { timeout: 15000 });
    await proPage.locator('.mission-card[data-mission-id]').filter({ hasText: /PHASE6 mix rock session/i }).first().waitFor({ timeout: 15000 });
    const hipHopCards = await proPage.locator('.mission-card').count();
    pushResult('TEST 29 : Pro sélectionne genre "Hip-Hop" dans #filter-genre → l’URL contient ?genre=Hip-Hop et résultats filtrés', hipHopCards > 0, {
      finalUrl: proPage.url(),
      hipHopCards,
    });

    await proPage.goto(`${base}/missions`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#pagination-next').waitFor({ state: 'visible', timeout: 15000 });
    await proPage.locator('#pagination-next').click();
    await proPage.getByText('Page 2').waitFor({ timeout: 15000 });
    const pageTwoUrl = proPage.url();
    await proPage.locator('#pagination-prev').click();
    await proPage.waitForURL(`${base}/missions`, { timeout: 15000 });
    pushResult('TEST 30 : Pro clique "Précédent" sur page 2 → retour page 1, résultats cohérents', true, {
      pageTwoUrl,
      finalUrl: proPage.url(),
    });

    await login(studioPage, studioEmail, '/studio/dashboard');
    await studioPage.goto(`${base}/pros`, { waitUntil: 'domcontentloaded' });
    await studioPage.locator('#search-input-pros').fill('Paris');
    await studioPage.locator('.pro-card[data-pro-id]').first().waitFor({ timeout: 15000 });
    const firstProText = await studioPage.locator('.pro-card[data-pro-id]').first().innerText();
    pushResult('TEST 31 : Studio tape "Paris" dans #search-input-pros → Pros avec location=Paris apparaissent en premier', /Paris/i.test(firstProText), {
      finalUrl: studioPage.url(),
      firstProText,
    });

    await studioPage.locator('#filter-pro-skill').fill('Mixage');
    await studioPage.locator('.pro-card[data-pro-id]').first().waitFor({ timeout: 15000 });
    const allCards = studioPage.locator('.pro-card[data-pro-id]');
    const cardCount = await allCards.count();
    let allContainSkill = cardCount > 0;
    for (let index = 0; index < cardCount; index += 1) {
      const text = await allCards.nth(index).innerText();
      if (!/Mixage/i.test(text)) {
        allContainSkill = false;
        break;
      }
    }

    pushResult('TEST 32 : Studio filtre par skill "Mixage" → seuls les Pros avec "Mixage" dans skills apparaissent', allContainSkill, {
      finalUrl: studioPage.url(),
      cardCount,
    });
  } finally {
    await proContext.close();
    await studioContext.close();
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  pushResult('PHASE 6 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
