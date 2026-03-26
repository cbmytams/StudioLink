import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4175';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const missionTitle = `Mission phase3 ${Date.now().toString(36)}`;
const studioMessage = `Message studio ${Date.now().toString(36)}`;
const proMessage = `Réponse pro ${Date.now().toString(36)}`;

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
  await page.locator('#mission-description').fill('Mission de validation phase 3 pour tester le chat temps réel.');
  await page.locator('#mission-category').selectOption('Vidéo');
  await page.locator('#mission-location').fill('Paris 11e');
  await page.locator('#mission-city').fill('Paris');
  await page.locator('#mission-date').fill('2026-04-03');
  await page.locator('#mission-rate').fill('540');
  await page.locator('#mission-skills-input').fill('Mixage');
  await page.locator('#mission-skills-input').press('Enter');
  await page.getByRole('button', { name: /créer la mission|publier la mission/i }).click();
  await page.waitForURL('**/studio/missions/*/edit', { timeout: 20000 });
  const missionId = page.url().split('/').filter(Boolean).at(-2) ?? '';
  await page.goto(`${base}/studio/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.getByText(missionTitle).waitFor({ timeout: 15000 });
  return missionId;
}

async function applyToMission(page, missionId) {
  await page.goto(`${base}/missions/${missionId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#btn-apply').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#btn-apply').click();
  await page.locator('#apply-modal').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#cover-letter-input').fill('Disponible et prêt pour la mission. Phase 3 chat.');
  await page.locator('#btn-submit-apply').click();
  await page.locator('#apply-status-badge').waitFor({ state: 'visible', timeout: 10000 });
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
    await applyToMission(proPage, missionId);

    await studioPage.goto(`${base}/studio/missions/${missionId}/applications`, { waitUntil: 'domcontentloaded' });
    const applicationItem = studioPage.locator('.application-item').first();
    await applicationItem.waitFor({ state: 'visible', timeout: 15000 });
    const applicationId = (await applicationItem.getAttribute('data-application-id')) ?? '';
    const acceptResponsePromise = studioPage.waitForResponse(
      (response) => response.url().includes('/rpc/accept_application') && response.request().method() === 'POST',
      { timeout: 15000 },
    );
    await studioPage.locator(`#btn-accept-${applicationId}`).click();
    const acceptResponse = await acceptResponsePromise;
    const acceptPayload = await acceptResponse.text();
    try {
      await studioPage.waitForURL('**/chat/*', { timeout: 20000 });
    } catch (error) {
      pushResult('TEST 13 : Studio accepte une candidature → redirect automatique vers /chat/:sessionId', false, {
        finalUrl: studioPage.url(),
        acceptStatus: acceptResponse.status(),
        acceptPayload,
        selectedBadgeVisible: await studioPage.locator('#selected-pro-badge').isVisible().catch(() => false),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    const sessionId = studioPage.url().split('/').filter(Boolean).at(-1) ?? '';
    await studioPage.locator('#chat-container[data-chat-mode=\"session\"]').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('#chat-input').waitFor({ state: 'visible', timeout: 15000 });

    pushResult('TEST 13 : Studio accepte une candidature → redirect automatique vers /chat/:sessionId', true, {
      finalUrl: studioPage.url(),
      sessionId,
      acceptStatus: acceptResponse.status(),
      acceptPayload,
    });

    await proPage.goto(`${base}/chat/${sessionId}`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#chat-container[data-chat-mode=\"session\"]').waitFor({ state: 'visible', timeout: 15000 });
    await proPage.locator('#chat-input').waitFor({ state: 'visible', timeout: 15000 });

    await studioPage.locator('#chat-input').fill(studioMessage);
    await studioPage.locator('#btn-send').click();
    await studioPage.locator('#messages-list .message-bubble--own').filter({ hasText: studioMessage }).waitFor({ timeout: 15000 });
    pushResult('TEST 14 : Studio envoie un message (#btn-send) → message apparaît dans #messages-list', true, {
      finalUrl: studioPage.url(),
      message: studioMessage,
    });

    try {
      await proPage.locator('#messages-list .message-bubble').filter({ hasText: studioMessage }).waitFor({ timeout: 15000 });
    } catch (error) {
      const beforeReloadText = await proPage.locator('#messages-list').innerText().catch(() => '');
      await proPage.reload({ waitUntil: 'domcontentloaded' });
      await proPage.locator('#chat-container[data-chat-mode=\"session\"]').waitFor({ state: 'visible', timeout: 15000 });
      const visibleAfterReload = await proPage.locator('#messages-list .message-bubble').filter({ hasText: studioMessage }).count();
      pushResult('TEST 15 : Pro ouvre le même chat → message du Studio visible sans refresh (Realtime)', false, {
        finalUrl: proPage.url(),
        beforeReloadText,
        visibleAfterReload,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
    pushResult('TEST 15 : Pro ouvre le même chat → message du Studio visible sans refresh (Realtime)', true, {
      finalUrl: proPage.url(),
      message: studioMessage,
    });

    await proPage.locator('#chat-input').fill(proMessage);
    await proPage.locator('#btn-send').click();
    await studioPage.locator('#messages-list .message-bubble').filter({ hasText: proMessage }).waitFor({ timeout: 15000 });
    pushResult('TEST 16 : Pro répond → bulle visible côté Studio sans refresh', true, {
      finalUrl: studioPage.url(),
      message: proMessage,
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
  pushResult('PHASE 3 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
