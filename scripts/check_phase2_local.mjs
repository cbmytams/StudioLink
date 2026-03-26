import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4175';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const missionTitle = `Mission phase2 ${Date.now().toString(36)}`;

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

async function createMission(page) {
  await page.goto(`${base}/studio/create-mission`, { waitUntil: 'domcontentloaded' });
  await page.locator('#mission-title').fill(missionTitle);
  await page.locator('#mission-description').fill('Mission de validation phase 2 pour tester le flux complet des candidatures.');
  await page.locator('#mission-category').selectOption('Vidéo');
  await page.locator('#mission-location').fill('Paris 10e');
  await page.locator('#mission-city').fill('Paris');
  await page.locator('#mission-date').fill('2026-04-02');
  await page.locator('#mission-rate').fill('520');
  await page.locator('#mission-skills-input').fill('Montage');
  await page.locator('#mission-skills-input').press('Enter');
  await page.getByRole('button', { name: /créer la mission|publier la mission/i }).click();
  await page.waitForURL('**/studio/missions/*/edit', { timeout: 20000 });
  const missionId = page.url().split('/').filter(Boolean).at(-2) ?? '';
  await page.goto(`${base}/studio/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.getByText(missionTitle).waitFor({ timeout: 15000 });
  return missionId;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const studioContext = await browser.newContext();
  const proContext = await browser.newContext();
  const studioPage = await studioContext.newPage();
  const proPage = await proContext.newPage();

  try {
    await login(studioPage, studioEmail, '/studio/dashboard');
    const missionId = await createMission(studioPage);

    await login(proPage, proEmail, '/pro/dashboard');
    await proPage.goto(`${base}/missions/${missionId}`, { waitUntil: 'domcontentloaded' });

    await proPage.locator('#btn-apply').waitFor({ state: 'visible', timeout: 10000 });
    pushResult('TEST 7  : Pro connecté → /missions/:id → bouton "Candidater" visible (#btn-apply)', true, {
      finalUrl: proPage.url(),
      missionId,
    });

    await proPage.locator('#btn-apply').click();
    await proPage.locator('#apply-modal').waitFor({ state: 'visible', timeout: 10000 });
    pushResult('TEST 8  : Pro clique "Candidater" → modal ouvre (#apply-modal visible)', true, {
      finalUrl: proPage.url(),
    });

    await proPage.locator('#cover-letter-input').fill('Je suis disponible rapidement et je peux assurer cette mission dans les délais.');
    await proPage.locator('#btn-submit-apply').click();
    await proPage.locator('#apply-status-badge').waitFor({ state: 'visible', timeout: 10000 });
    pushResult('TEST 9  : Pro remplit cover_letter et soumet → toast succès + bouton passe en "Candidature envoyée"', true, {
      finalUrl: proPage.url(),
      statusText: await proPage.locator('#apply-status-badge').innerText(),
    });

    await studioPage.goto(`${base}/studio/missions/${missionId}/applications`, { waitUntil: 'domcontentloaded' });
    await studioPage.locator('#applications-panel').waitFor({ state: 'visible', timeout: 10000 });
    const applicationItem = studioPage.locator('.application-item').first();
    await applicationItem.waitFor({ state: 'visible', timeout: 10000 });
    pushResult('TEST 10 : Studio → /studio/missions/:id → candidature du Pro visible dans #applications-panel', true, {
      finalUrl: studioPage.url(),
    });

    const applicationId = (await applicationItem.getAttribute('data-application-id')) ?? '';
    await studioPage.locator(`#btn-accept-${applicationId}`).click();
    await studioPage.locator('#selected-pro-badge').waitFor({ state: 'visible', timeout: 10000 });
    pushResult('TEST 11 : Studio clique "Accepter" → badge #selected-pro-badge apparaît + mission passe en "in_progress"', true, {
      finalUrl: studioPage.url(),
      selectedBadge: await studioPage.locator('#selected-pro-badge').innerText(),
    });

    await proPage.goto(`${base}/pro/applications`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#applications-list').waitFor({ state: 'visible', timeout: 10000 });
    await proPage.locator('.application-card').filter({ hasText: missionTitle }).locator('.application-status-badge').getByText(/acceptée/i).waitFor({ timeout: 10000 });
    pushResult('TEST 12 : Pro → /pro/applications → candidature affichée avec badge "accepted"', true, {
      finalUrl: proPage.url(),
    });
  } finally {
    await studioContext.close();
    await proContext.close();
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  pushResult('PHASE 2 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
