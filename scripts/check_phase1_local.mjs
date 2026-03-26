import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4174';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const missionTitle = `Mission phase1 ${Date.now().toString(36)}`;

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
  const studioContext = await browser.newContext();
  const proContext = await browser.newContext();
  const studioPage = await studioContext.newPage();
  const proPage = await proContext.newPage();

  try {
    await login(studioPage, studioEmail, '/studio/dashboard');
    await studioPage.waitForTimeout(3000);
    const studioBody = await studioPage.locator('body').innerText();
    const emptyDashboardVisible = studioBody.includes("Aucune mission publiée pour l'instant.");
    pushResult('TEST 1 studio dashboard vide', emptyDashboardVisible, {
      finalUrl: studioPage.url(),
      emptyDashboardVisible,
    });
    if (!emptyDashboardVisible) throw new Error('Studio dashboard non vide avant création');

    await studioPage.getByRole('button', { name: /\+ Créer une mission/i }).click();
    await studioPage.waitForURL('**/studio/create-mission', { timeout: 15000 });
    await studioPage.waitForTimeout(2000);
    const createFormVisible = await studioPage.locator('#mission-title').isVisible();
    pushResult('TEST 2 formulaire création mission visible', createFormVisible, {
      finalUrl: studioPage.url(),
    });
    if (!createFormVisible) throw new Error('Formulaire création mission invisible');

    await studioPage.locator('#mission-title').fill(missionTitle);
    await studioPage.locator('#mission-description').fill('Mission de validation phase 1 pour tester le flow studio complet.');
    await studioPage.locator('#mission-category').selectOption('Photo');
    await studioPage.locator('#mission-location').fill('Paris 11e');
    await studioPage.locator('#mission-city').fill('Paris');
    await studioPage.locator('#mission-date').fill('2026-03-30');
    await studioPage.locator('#mission-rate').fill('450');
    await studioPage.locator('#mission-skills-input').fill('Lumière');
    await studioPage.locator('#mission-skills-input').press('Enter');
    await studioPage.getByRole('button', { name: /Publier la mission/i }).click();
    await studioPage.waitForURL('**/studio/dashboard', { timeout: 20000 });
    await studioPage.getByText(missionTitle).waitFor({ timeout: 15000 });
    pushResult('TEST 3 création mission visible sur dashboard studio', true, {
      finalUrl: studioPage.url(),
      missionTitle,
    });

    await login(proPage, proEmail, '/pro/dashboard');
    await proPage.goto(`${base}/pro/missions`, { waitUntil: 'domcontentloaded' });
    await proPage.getByText(missionTitle).waitFor({ timeout: 20000 });
    pushResult('TEST 4 mission visible dans /pro/missions', true, {
      finalUrl: proPage.url(),
      missionTitle,
    });

    await proPage.locator('button').filter({ hasText: missionTitle }).first().click();
    await proPage.waitForURL(/\/(pro\/offer|missions)\//, { timeout: 20000 });
    await proPage.getByRole('button', { name: /^Candidater$/i }).waitFor({ timeout: 15000 });
    pushResult('TEST 5 détail mission visible avec bouton Candidater', true, {
      finalUrl: proPage.url(),
    });

    await proPage.getByRole('button', { name: /^Candidater$/i }).click();
    await proPage.getByText(/Candidature envoyée/i).waitFor({ timeout: 15000 });

    await studioPage.goto(`${base}/studio/dashboard`, { waitUntil: 'domcontentloaded' });
    await studioPage.getByText(/1 candidature disponible/i).waitFor({ timeout: 20000 });
    pushResult('TEST 6 dashboard studio affiche 1 candidature disponible', true, {
      finalUrl: studioPage.url(),
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
  pushResult('PHASE 1 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
