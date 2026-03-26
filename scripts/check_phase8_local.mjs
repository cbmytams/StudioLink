import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4178';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const proId = process.env.PRO_ID ?? 'a7329e97-aec6-48f2-b8fc-2a9ec7ad24fe';

const results = [];

function pushResult(name, ok, details) {
  results.push({ name, ok, details });
}

function runSql(sql) {
  const tmpfile = path.join(os.tmpdir(), `phase8-${Date.now().toString(36)}.sql`);
  fs.writeFileSync(tmpfile, sql, 'utf8');

  try {
    const output = execFileSync(
      'npx',
      ['supabase', 'db', 'query', '--linked', '--file', tmpfile],
      {
        cwd: process.cwd(),
        env: process.env,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    return JSON.parse(output).rows;
  } finally {
    fs.rmSync(tmpfile, { force: true });
  }
}

function resetProProfile() {
  runSql(`
update public.profiles
set
  display_name = null,
  full_name = null,
  city = null,
  bio = null,
  company_name = null,
  skills = '{}'::text[],
  daily_rate = null,
  onboarding_complete = false,
  onboarding_completed = false,
  onboarding_step = 1
where id = '${proId}';
`);
}

function readProProfile() {
  return runSql(`
select
  display_name,
  user_type,
  bio,
  daily_rate,
  onboarding_complete,
  onboarding_completed,
  onboarding_step
from public.profiles
where id = '${proId}';
`)[0];
}

async function login(page) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(proEmail);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

async function main() {
  resetProProfile();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page);
    await page.waitForURL('**/onboarding', { timeout: 20000 });
    await page.locator('#onboarding-step-2').waitFor({ state: 'visible', timeout: 15000 });
    pushResult('TEST 38 : Nouveau compte sans display_name → redirect automatique vers /onboarding', true, {
      finalUrl: page.url(),
    });

    await page.locator('#btn-onboarding-prev').click();
    await page.locator('#onboarding-step-1').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#btn-onboarding-next').click();
    await page.locator('#onboarding-step-2').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#input-display-name').fill('Phase 8 Pro');
    await page.locator('#input-location').fill('Paris');
    await page.locator('#btn-onboarding-next').click();
    await page.locator('#onboarding-step-3-pro').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#input-pro-bio').fill('Ingénieure du son freelance spécialisée en mixage, mastering, montage voix et livrables propres pour les studios exigeants à Paris.');
    await page.locator('#input-skills').fill('Mixage');
    await page.locator('#input-skills').press('Enter');
    await page.locator('#input-daily-rate').fill('450');
    await page.locator('#btn-onboarding-next').click();
    await page.locator('#onboarding-step-4').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#btn-complete-onboarding').click();
    await page.waitForURL('**/pro/dashboard', { timeout: 20000 });

    const updatedProfile = readProProfile();
    const onboardingOk = updatedProfile.display_name === 'Phase 8 Pro'
      && updatedProfile.onboarding_complete === true
      && updatedProfile.onboarding_completed === true
      && Number(updatedProfile.onboarding_step) === 4;

    pushResult('TEST 39 : Compléter les 4 steps → profil mis à jour + redirect /dashboard', onboardingOk, {
      finalUrl: page.url(),
      profile: updatedProfile,
    });

    await page.goto(`${base}/url-inexistante`, { waitUntil: 'domcontentloaded' });
    await page.locator('#page-404').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#btn-back-home').waitFor({ state: 'visible', timeout: 15000 });
    pushResult('TEST 40 : Naviguer vers /url-inexistante → #page-404 visible avec #btn-back-home', true, {
      finalUrl: page.url(),
    });

    await page.goto(`${base}/missions?genre=Hip-Hop&location=Atlantide&budget_min=999999&budget_max=1000000`, { waitUntil: 'domcontentloaded' });
    const emptyState = page.locator('#empty-state');
    await emptyState.waitFor({ state: 'visible', timeout: 15000 });
    const resetButton = emptyState.getByRole('button', { name: /réinitialiser les filtres/i });
    const resetVisible = await resetButton.isVisible();
    pushResult('TEST 41 : /missions sans résultats (filtres trop restrictifs) → #empty-state visible avec reset CTA', resetVisible, {
      finalUrl: page.url(),
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

try {
  await main();
} catch (error) {
  pushResult('PHASE 8 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
