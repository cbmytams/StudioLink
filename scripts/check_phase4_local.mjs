import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4175';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const missionTitle = `Mission phase4 ${Date.now().toString(36)}`;
const referenceFileName = `reference-${Date.now().toString(36)}.mp3`;
const deliveryFileName = `delivery-${Date.now().toString(36)}.wav`;

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

async function createMissionDraftAndUploadReference(page) {
  await page.goto(`${base}/studio/create-mission`, { waitUntil: 'domcontentloaded' });
  await page.locator('#mission-title').fill(missionTitle);
  await page.locator('#mission-description').fill('Mission de validation phase 4 avec fichiers de référence et livraisons.');
  await page.locator('#mission-category').selectOption('Son');
  await page.locator('#mission-location').fill('Paris 9e');
  await page.locator('#mission-city').fill('Paris');
  await page.locator('#mission-date').fill('2026-04-05');
  await page.locator('#mission-rate').fill('620');
  await page.locator('#mission-skills-input').fill('Mixage');
  await page.locator('#mission-skills-input').press('Enter');
  await page.getByRole('button', { name: /créer la mission/i }).click();
  await page.waitForURL('**/studio/missions/*/edit', { timeout: 20000 });

  const missionId = page.url().split('/').filter(Boolean).at(-2) ?? '';

  const chooserPromise = page.waitForEvent('filechooser', { timeout: 15000 });
  await page.locator('#file-dropzone').click();
  const chooser = await chooserPromise;
  await chooser.setFiles({
    name: referenceFileName,
    mimeType: 'audio/mpeg',
    buffer: Buffer.from('ID3 phase4 reference'),
  });
  await page.locator('.file-item-name').getByText(referenceFileName).waitFor({ timeout: 20000 });

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
    const missionId = await createMissionDraftAndUploadReference(studioPage);
    pushResult('TEST 17 : Studio crée une mission → upload un fichier MP3 de référence → fichier visible dans la liste', true, {
      finalUrl: studioPage.url(),
      missionId,
      fileName: referenceFileName,
    });

    await login(proPage, proEmail, '/pro/dashboard');
    await proPage.goto(`${base}/missions/${missionId}`, { waitUntil: 'domcontentloaded' });
    const hiddenBeforeApply = await proPage.getByText(referenceFileName).count();
    pushResult('TEST 19 : Pro non candidat → MissionDetail.tsx → fichier de référence NON visible (RLS)', hiddenBeforeApply === 0, {
      finalUrl: proPage.url(),
      hiddenBeforeApply,
    });

    await proPage.locator('#btn-apply').click();
    await proPage.locator('#apply-modal').waitFor({ state: 'visible', timeout: 10000 });
    await proPage.locator('#cover-letter-input').fill('Je postule pour valider la visibilité des fichiers de référence.');
    await proPage.locator('#btn-submit-apply').click();
    await proPage.locator('#apply-status-badge').waitFor({ state: 'visible', timeout: 10000 });
    await proPage.getByText(referenceFileName).waitFor({ timeout: 15000 });
    const referencePopupPromise = proPage.waitForEvent('popup', { timeout: 15000 });
    await proPage.getByRole('button', { name: /télécharger/i }).first().click();
    const referencePopup = await referencePopupPromise;
    pushResult('TEST 18 : Pro candidat → MissionDetail.tsx → fichier de référence visible + téléchargeable', true, {
      finalUrl: proPage.url(),
      downloadUrl: referencePopup.url(),
    });
    await referencePopup.close().catch(() => undefined);

    await studioPage.goto(`${base}/studio/missions/${missionId}/applications`, { waitUntil: 'domcontentloaded' });
    const applicationItem = studioPage.locator('.application-item').first();
    await applicationItem.waitFor({ state: 'visible', timeout: 15000 });
    const applicationId = (await applicationItem.getAttribute('data-application-id')) ?? '';
    await studioPage.locator(`#btn-accept-${applicationId}`).click();
    await studioPage.waitForURL('**/chat/*', { timeout: 20000 });
    const sessionId = studioPage.url().split('/').filter(Boolean).at(-1) ?? '';

    await proPage.goto(`${base}/chat/${sessionId}`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#delivery-panel').waitFor({ state: 'visible', timeout: 15000 });
    const deliveryChooserPromise = proPage.waitForEvent('filechooser', { timeout: 15000 });
    await proPage.locator('#btn-attach').click();
    const deliveryChooser = await deliveryChooserPromise;
    await deliveryChooser.setFiles({
      name: deliveryFileName,
      mimeType: 'audio/wav',
      buffer: Buffer.from('RIFF phase4 delivery'),
    });
    await proPage.locator('.delivery-file-item').getByText(deliveryFileName).waitFor({ timeout: 20000 });
    pushResult('TEST 20 : Pro → Chat.tsx → clique #btn-attach → upload WAV → fichier visible dans #delivery-panel', true, {
      finalUrl: proPage.url(),
      fileName: deliveryFileName,
      sessionId,
    });

    await studioPage.locator('#delivery-panel').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('.delivery-file-item').getByText(deliveryFileName).waitFor({ timeout: 20000 });
    const deliveryPopupPromise = studioPage.waitForEvent('popup', { timeout: 15000 });
    await studioPage.locator('[id^="btn-download-"]').first().click();
    const deliveryPopup = await deliveryPopupPromise;
    pushResult('TEST 21 : Studio → même Chat → fichier de livraison visible + bouton #btn-download-[id] fonctionnel', true, {
      finalUrl: studioPage.url(),
      downloadUrl: deliveryPopup.url(),
    });
    await deliveryPopup.close().catch(() => undefined);
  } finally {
    await studioContext.close();
    await proContext.close();
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  pushResult('PHASE 4 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
