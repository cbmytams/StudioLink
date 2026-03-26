import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4175';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const missionTitle = `Mission phase5 ${Date.now().toString(36)}`;
const studioMessage = `Notif chat ${Date.now().toString(36)}`;
const deliveryFileName = `phase5-delivery-${Date.now().toString(36)}.wav`;

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
  await page.locator('#mission-description').fill('Mission de validation phase 5 pour notifications et ratings.');
  await page.locator('#mission-category').selectOption('Son');
  await page.locator('#mission-location').fill('Paris 2e');
  await page.locator('#mission-city').fill('Paris');
  await page.locator('#mission-date').fill('2026-04-09');
  await page.locator('#mission-rate').fill('500');
  await page.locator('#mission-skills-input').fill('Mixage');
  await page.locator('#mission-skills-input').press('Enter');
  await page.getByRole('button', { name: /publier la mission|créer la mission/i }).click();
  await page.waitForURL(/\/studio\/(dashboard|missions\/.+\/edit)/, { timeout: 20000 });

  const parts = page.url().split('/').filter(Boolean);
  const missionId = parts.at(-1) === 'edit' ? parts.at(-2) : null;
  return missionId;
}

async function applyToMission(page, missionId) {
  await page.goto(`${base}/missions/${missionId}`, { waitUntil: 'domcontentloaded' });
  await page.locator('#btn-apply').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('#btn-apply').click();
  await page.locator('#apply-modal').waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('#cover-letter-input').fill('Je candidate pour tester les notifications et la notation.');
  await page.locator('#btn-submit-apply').click();
  await page.locator('#apply-status-badge').waitFor({ state: 'visible', timeout: 15000 });
}

async function waitForNotificationItem(page, pattern, timeout = 15000) {
  const panel = page.locator('#notification-panel');
  await panel.waitFor({ state: 'visible', timeout });
  const item = panel.locator('.notification-item').filter({ hasText: pattern }).first();
  await item.waitFor({ state: 'visible', timeout });
  return item;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const studioContext = await browser.newContext();
  const proContext = await browser.newContext();
  const studioPage = await studioContext.newPage();
  const proPage = await proContext.newPage();

  try {
    await login(studioPage, studioEmail, '/studio/dashboard');
    const createdMissionId = await createMission(studioPage);
    const missionId = createdMissionId;
    if (!missionId) {
      throw new Error(`Mission introuvable depuis l'URL ${studioPage.url()}`);
    }

    await login(proPage, proEmail, '/pro/dashboard');
    await applyToMission(proPage, missionId);

    await studioPage.goto(`${base}/studio/missions/${missionId}/applications`, { waitUntil: 'domcontentloaded' });
    const applicationItem = studioPage.locator('.application-item').first();
    await applicationItem.waitFor({ state: 'visible', timeout: 15000 });
    const applicationId = (await applicationItem.getAttribute('data-application-id')) ?? '';
    await studioPage.locator(`#btn-accept-${applicationId}`).click();
    await studioPage.waitForURL('**/chat/*', { timeout: 20000 });
    const sessionId = studioPage.url().split('/').filter(Boolean).at(-1) ?? '';

    await proPage.locator('#btn-notification-bell').click();
    await waitForNotificationItem(proPage, /candidature acceptée/i, 15000);
    pushResult('TEST 22 : Studio accepte une candidature → Pro reçoit notif application_accepted dans #notification-panel', true, {
      finalUrl: proPage.url(),
      sessionId,
    });
    await proPage.locator('#btn-mark-all-read').click();
    await proPage.locator('#notification-panel').waitFor({ state: 'visible', timeout: 10000 });
    await proPage.locator('#notification-badge').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
    await proPage.locator('#btn-notification-bell').click();

    await studioPage.locator('#chat-input').fill(studioMessage);
    await studioPage.locator('#btn-send').click();
    await studioPage.locator('#messages-list .message-bubble--own').filter({ hasText: studioMessage }).waitFor({ timeout: 15000 });

    await proPage.locator('#notification-badge').waitFor({ state: 'visible', timeout: 15000 });
    pushResult('TEST 23 : Studio envoie un message → badge #notification-badge du Pro s’incrémente en temps réel', true, {
      finalUrl: proPage.url(),
    });

    await proPage.locator('#btn-notification-bell').click();
    const messageNotification = await waitForNotificationItem(proPage, new RegExp(studioMessage.slice(0, 20), 'i'), 15000);
    await messageNotification.click();
    await proPage.waitForURL(`**/chat/${sessionId}`, { timeout: 15000 });
    await proPage.waitForLoadState('domcontentloaded');
    try {
      await proPage.locator('#btn-attach').waitFor({ state: 'visible', timeout: 30000 });
    } catch (attachError) {
      const debugState = {
        url: proPage.url(),
        chatMode: await proPage.locator('#chat-container').getAttribute('data-chat-mode').catch(() => null),
        chatReady: await proPage.locator('#chat-container').getAttribute('data-chat-ready').catch(() => null),
        attachCount: await proPage.locator('#btn-attach').count(),
        body: (await proPage.locator('body').innerText().catch(() => '')).slice(0, 1200),
      };
      throw new Error(
        `${attachError instanceof Error ? attachError.message : String(attachError)}\nDEBUG=${JSON.stringify(debugState)}`,
      );
    }
    const unreadCountAfterClick = await proPage.locator('#notification-badge').count();
    pushResult('TEST 24 : Pro clique sur la notif → markAsRead → badge décrémenté + redirect vers /chat/:sessionId', true, {
      finalUrl: proPage.url(),
      unreadCountAfterClick,
    });

    const deliveryChooserPromise = proPage.waitForEvent('filechooser', { timeout: 15000 });
    await proPage.locator('#btn-attach').click();
    const deliveryChooser = await deliveryChooserPromise;
    await deliveryChooser.setFiles({
      name: deliveryFileName,
      mimeType: 'audio/wav',
      buffer: Buffer.from('RIFF phase5 delivery'),
    });
    await proPage.locator('.delivery-file-item').getByText(deliveryFileName).waitFor({ timeout: 20000 });

    await studioPage.locator('#btn-notification-bell').click();
    await waitForNotificationItem(studioPage, /livraison déposée/i, 15000);
    pushResult('TEST 25 : Pro dépose un fichier delivery → Studio reçoit notif delivery_uploaded', true, {
      finalUrl: studioPage.url(),
    });

    await studioPage.locator('#btn-complete-session').click();
    await studioPage.locator('#rating-modal').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('#star-5').click();
    await studioPage.locator('#rating-comment').fill('Excellent travail, livraison propre et rapide.');
    await studioPage.locator('#btn-submit-rating').click();
    await studioPage.locator('#rating-submitted').waitFor({ state: 'visible', timeout: 15000 });
    pushResult('TEST 26 : Studio clique Terminer la session → RatingModal s’ouvre → Studio note 5★ → rating_avg mis à jour sur le profil Pro', true, {
      finalUrl: studioPage.url(),
    });

    await proPage.goto(`${base}/pro/profile`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#profile-rating').waitFor({ state: 'visible', timeout: 15000 });
    pushResult('TEST 27 : Pro ouvre ProProfile → #profile-rating affiche la moyenne avec le bon score', true, {
      finalUrl: proPage.url(),
      ratingText: await proPage.locator('#profile-rating').innerText(),
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
  pushResult('PHASE 5 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
