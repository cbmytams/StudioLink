import { chromium } from 'playwright';

const BASE_URL = 'https://studiolink-paris.vercel.app';
const PASSWORD = 'StudioLink!123';
const stamp = Date.now().toString(36);
const studioEmail = `studiolink.qa.${stamp}@gmail.com`;
const proEmail = `studiolink.pro.${stamp}@gmail.com`;
const studioName = `Studio QA ${stamp}`;
const proName = `Pro QA ${stamp}`;
const missionTitle = `Mission QA ${stamp}`;
const studioMessage = `Bonjour ${proName}, message test ${stamp}`;
const proMessage = `Réponse pro ${stamp}`;

const report = [];

function addStep(step, ok, details) {
  report.push({ step, ok, details });
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${step} — ${details}`);
}

async function safeScreenshot(page, name) {
  try {
    await page.screenshot({ path: `output/playwright/${name}.png`, fullPage: true });
  } catch {
    // Best effort only.
  }
}

async function waitForUrlContains(page, values, timeoutMs = 25_000) {
  const expected = Array.isArray(values) ? values : [values];
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const current = page.url();
    if (expected.some((value) => current.includes(value))) {
      return current;
    }
    await page.waitForTimeout(250);
  }
  throw new Error(`URL attendue non atteinte. URL actuelle: ${page.url()}`);
}

async function fillOnboardingIfNeeded(page, fullName, expectedType) {
  if (!page.url().includes('/onboarding')) return;

  await page.locator('#onboarding-full-name').waitFor({ timeout: 20_000 });
  await page.fill('#onboarding-full-name', fullName);

  const typePickerVisible = await page.getByText('Type de compte').first().isVisible().catch(() => false);
  if (typePickerVisible) {
    const typeLabel = expectedType === 'studio' ? 'Studio' : 'Pro';
    const typeButton = page.getByRole('button', { name: new RegExp(`^${typeLabel}$`, 'i') });
    if (await typeButton.count()) {
      await typeButton.first().click();
    }
  }

  await page.getByRole('button', { name: /Terminer|Validation/i }).first().click();
  await waitForUrlContains(page, expectedType === 'studio' ? '/studio/dashboard' : '/pro/dashboard', 25_000);
}

async function runInviteSignupFlow(page, code, email, fullName, expectedType) {
  await page.goto(`${BASE_URL}/invite/${code}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);

  const invalidState = await page.getByText(/Lien invalide|Invitation expirée|déjà utilisée/i).first().isVisible().catch(() => false);
  if (invalidState) {
    throw new Error(`Invitation ${code} invalide/expirée/déjà utilisée`);
  }

  await page.getByRole('button', { name: /Créer mon compte/i }).first().click();
  await waitForUrlContains(page, '/login', 20_000);

  await page.fill('#login-email', email);
  await page.fill('#login-password', PASSWORD);
  await page.getByPlaceholder('Confirmer le mot de passe').fill(PASSWORD);
  await page.getByRole('button', { name: /Créer mon compte/i }).first().click();

  let currentUrl = page.url();
  const start = Date.now();
  while (Date.now() - start < 25_000) {
    currentUrl = page.url();
    if (
      currentUrl.includes('/onboarding')
      || currentUrl.includes('/studio/dashboard')
      || currentUrl.includes('/pro/dashboard')
    ) {
      break;
    }

    const successRequiresEmail = await page.getByText(/Vérifie ta boîte mail/i).isVisible().catch(() => false);
    if (successRequiresEmail) {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await page.fill('#login-email', email);
      await page.fill('#login-password', PASSWORD);
      await page.getByRole('button', { name: /Se connecter/i }).first().click();
    }

    const errorVisible = await page.locator('text=/Erreur|impossible|invalid|invalide/i').first().isVisible().catch(() => false);
    if (errorVisible) {
      const body = await page.locator('body').innerText();
      throw new Error(`Erreur inscription: ${body.slice(0, 400)}`);
    }

    await page.waitForTimeout(400);
  }

  await fillOnboardingIfNeeded(page, fullName, expectedType);
  await waitForUrlContains(page, expectedType === 'studio' ? '/studio/dashboard' : '/pro/dashboard', 25_000);
}

async function createMission(page) {
  await page.goto(`${BASE_URL}/studio/missions/new`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.locator('#mission-title').waitFor({ timeout: 20_000 });
  await page.fill('#mission-title', missionTitle);
  await page.fill('#mission-description', `Description QA ${stamp}`);
  await page.fill('#mission-city', 'Paris');
  await page.fill('#mission-rate', '450');
  await page.fill('#mission-skills-input', 'montage');
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /Publier la mission|Enregistrer les modifications/i }).first().click();

  await waitForUrlContains(page, '/studio/missions', 20_000);
  await page.getByText(missionTitle).first().waitFor({ timeout: 20_000 });
}

async function applyAsPro(page) {
  await page.goto(`${BASE_URL}/pro/feed`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(1200);

  const missionCard = page.getByText(missionTitle).first();
  if (!(await missionCard.isVisible().catch(() => false))) {
    const refreshButton = page.getByRole('button', { name: /Actualiser/i }).first();
    if (await refreshButton.isVisible().catch(() => false)) {
      await refreshButton.click();
    }
  }

  await missionCard.waitFor({ timeout: 25_000 });
  await missionCard.click();

  await waitForUrlContains(page, ['/pro/offer/', '/mission/'], 20_000);

  const alreadyApplied = await page.getByText(/déjà postulé|Candidature envoyée/i).first().isVisible().catch(() => false);
  if (!alreadyApplied) {
    await page.getByRole('button', { name: /Postuler à cette mission/i }).first().click();
    await page.getByText(/Candidature envoyée|En attente/i).first().waitFor({ timeout: 20_000 });
  }
}

async function acceptAndStartConversation(studioPage) {
  await studioPage.goto(`${BASE_URL}/studio/dashboard`, { waitUntil: 'domcontentloaded', timeout: 60_000 });

  const missionCard = studioPage
    .locator('div.app-card-soft')
    .filter({ hasText: missionTitle })
    .first();
  await missionCard.waitFor({ timeout: 25_000 });
  await missionCard.getByRole('button', { name: /Voir les candidatures/i }).click();

  await waitForUrlContains(studioPage, '/studio/applications/', 20_000);

  const profileLink = studioPage.getByRole('button', { name: /Voir le profil complet/i }).first();
  await profileLink.waitFor({ timeout: 20_000 });

  const acceptButton = studioPage.getByRole('button', { name: /Accepter/i }).first();
  const acceptDisabled = await acceptButton.isDisabled().catch(() => false);
  if (!acceptDisabled) {
    await acceptButton.click();
    await studioPage.getByText(/Acceptée/i).first().waitFor({ timeout: 20_000 });
  }

  await profileLink.click();
  await waitForUrlContains(studioPage, '/pro/public/', 20_000);
  await studioPage.getByRole('button', { name: /Contacter ce pro/i }).first().click();

  await waitForUrlContains(studioPage, '/chat/', 25_000);
  await studioPage.getByPlaceholder('Écrire un message...').fill(studioMessage);
  await studioPage.getByRole('button', { name: '→' }).first().click();
  await studioPage.getByText(studioMessage).first().waitFor({ timeout: 20_000 });
}

async function checkProNotificationAndReply(proPage, studioPage) {
  await proPage.goto(`${BASE_URL}/notifications`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await proPage.waitForTimeout(1500);

  const hasUnreadConversation = await proPage.getByText(/non lue|non lu|Nouveau message/i).first().isVisible().catch(() => false)
    || await proPage.locator('span', { hasText: /\d+/ }).first().isVisible().catch(() => false);
  addStep('Pro /notifications', hasUnreadConversation, hasUnreadConversation ? 'Notification/activité visible' : 'Pas de badge explicite visible');

  await proPage.goto(`${BASE_URL}/pro/conversations`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const firstConversation = proPage.locator('div.app-card-soft').first();
  await firstConversation.waitFor({ timeout: 25_000 });
  await firstConversation.click();

  await waitForUrlContains(proPage, '/chat/', 20_000);
  await proPage.getByText(studioMessage).first().waitFor({ timeout: 25_000 });
  await proPage.getByPlaceholder('Écrire un message...').fill(proMessage);
  await proPage.getByRole('button', { name: '→' }).first().click();
  await proPage.getByText(proMessage).first().waitFor({ timeout: 20_000 });

  await studioPage.getByText(proMessage).first().waitFor({ timeout: 25_000 });
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const studioContext = await browser.newContext();
  const proContext = await browser.newContext();
  const studioPage = await studioContext.newPage();
  const proPage = await proContext.newPage();

  try {
    await runInviteSignupFlow(studioPage, 'STUDIO2024', studioEmail, studioName, 'studio');
    addStep('Studio signup+onboarding', true, `Connecté en ${studioEmail}`);
  } catch (error) {
    await safeScreenshot(studioPage, 'studio-signup-failure');
    addStep('Studio signup+onboarding', false, error instanceof Error ? error.message : String(error));
    throw error;
  }

  try {
    await createMission(studioPage);
    addStep('Studio create mission', true, `Mission créée: ${missionTitle}`);
  } catch (error) {
    await safeScreenshot(studioPage, 'studio-create-mission-failure');
    addStep('Studio create mission', false, error instanceof Error ? error.message : String(error));
    throw error;
  }

  try {
    await runInviteSignupFlow(proPage, 'PRO2024', proEmail, proName, 'pro');
    addStep('Pro signup+onboarding', true, `Connecté en ${proEmail}`);
  } catch (error) {
    await safeScreenshot(proPage, 'pro-signup-failure');
    addStep('Pro signup+onboarding', false, error instanceof Error ? error.message : String(error));
    throw error;
  }

  try {
    await applyAsPro(proPage);
    addStep('Pro apply mission', true, 'Candidature envoyée');
  } catch (error) {
    await safeScreenshot(proPage, 'pro-apply-failure');
    addStep('Pro apply mission', false, error instanceof Error ? error.message : String(error));
    throw error;
  }

  try {
    await acceptAndStartConversation(studioPage);
    addStep('Studio accept + start chat', true, 'Candidature acceptée et message envoyé');
  } catch (error) {
    await safeScreenshot(studioPage, 'studio-accept-chat-failure');
    addStep('Studio accept + start chat', false, error instanceof Error ? error.message : String(error));
    throw error;
  }

  try {
    await checkProNotificationAndReply(proPage, studioPage);
    addStep('Pro notifications + reply', true, 'Notification vérifiée et réponse envoyée');
  } catch (error) {
    await safeScreenshot(proPage, 'pro-notification-reply-failure');
    addStep('Pro notifications + reply', false, error instanceof Error ? error.message : String(error));
    throw error;
  }

  await studioContext.close();
  await proContext.close();
  await browser.close();

  console.log('\n=== REPORT JSON ===');
  console.log(JSON.stringify({
    studioEmail,
    proEmail,
    missionTitle,
    report,
  }, null, 2));
}

main().catch(async (error) => {
  console.error('\n=== FLOW FAILED ===');
  console.error(error instanceof Error ? error.stack : error);
  console.log('\n=== PARTIAL REPORT JSON ===');
  console.log(JSON.stringify({
    studioEmail,
    proEmail,
    missionTitle,
    report,
  }, null, 2));
  process.exitCode = 1;
});
