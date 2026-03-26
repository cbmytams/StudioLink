import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'https://studiolink-paris.vercel.app';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const suffix = Date.now().toString(36);
const proEmail = `phase0.pro.${suffix}@example.com`;
const studioEmail = `phase0.studio.${suffix}@example.com`;
const existingProEmail = process.env.EXISTING_PRO_EMAIL ?? 'phase0.pro.mn5vv2is@gmail.com';
const existingStudioEmail = process.env.EXISTING_STUDIO_EMAIL ?? 'phase0.studio.mn5vv2is@gmail.com';

const results = [];

async function runTest(name, fn) {
  try {
    const details = await fn();
    results.push({ name, ok: true, details });
  } catch (error) {
    results.push({
      name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

async function fillSignupForm(page, email) {
  await page.getByLabel(/adresse email/i).fill(email);
  await page.getByLabel(/^mot de passe$/i).fill(password);
  await page.getByPlaceholder(/confirmer le mot de passe/i).fill(password);
  await page.getByRole('button', { name: /créer mon compte/i }).click();
}

async function completeOnboarding(page, fullName, expectedPath) {
  await page.waitForURL('**/onboarding', { timeout: 20000 });
  await page.getByLabel(/nom complet/i).fill(fullName);
  await page.getByRole('button', { name: /terminer/i }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 20000 });
  return page.url();
}

async function signupFlow(inviteCode, email, fullName, expectedPath) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${base}/invite/${inviteCode}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /créer mon compte/i }).waitFor({ timeout: 15000 });
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await page.waitForURL('**/login?mode=signup', { timeout: 15000 });
    await fillSignupForm(page, email);
    const finalUrl = await completeOnboarding(page, fullName, expectedPath);
    return { email, finalUrl };
  } finally {
    await browser.close();
  }
}

async function existingLoginRefreshLogout() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/adresse email/i).waitFor({ timeout: 15000 });
    await page.getByLabel(/adresse email/i).fill(existingProEmail);
    await page.getByLabel(/^mot de passe$/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await page.waitForURL('**/pro/dashboard', { timeout: 20000 });
    const loginUrl = page.url();

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    const refreshUrl = page.url();
    const dashboardTextLength = (await page.locator('body').innerText()).length;

    const settingsCta = page.locator('button').filter({ hasText: 'Sécurité et préférences du compte' }).first();
    await settingsCta.click();
    await page.waitForURL('**/settings', { timeout: 10000 });
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await page.waitForURL('**/login', { timeout: 10000 });

    return {
      loginUrl,
      refreshUrl,
      dashboardTextLength,
      logoutUrl: page.url(),
    };
  } finally {
    await browser.close();
  }
}

async function existingStudioLogin() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
    await page.getByLabel(/adresse email/i).waitFor({ timeout: 15000 });
    await page.getByLabel(/adresse email/i).fill(existingStudioEmail);
    await page.getByLabel(/^mot de passe$/i).fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await page.waitForURL('**/studio/dashboard', { timeout: 20000 });
    return { finalUrl: page.url() };
  } finally {
    await browser.close();
  }
}

try {
  await runTest('TEST 1 PRO SIGNUP', () => signupFlow('PRO2024', proEmail, 'Pro Phase 0', '/pro/dashboard'));
  await runTest('TEST 2 STUDIO SIGNUP', () => signupFlow('STUDIO2024', studioEmail, 'Studio Phase 0', '/studio/dashboard'));
  await runTest('TEST 3/4/5 EXISTING PRO LOGIN+REFRESH+LOGOUT', existingLoginRefreshLogout);
  await runTest('TEST 3B EXISTING STUDIO LOGIN', existingStudioLogin);
} catch {
  // stop after first failing test group
}

console.log(JSON.stringify(results, null, 2));
