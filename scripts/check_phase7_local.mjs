import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4177';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const studioId = process.env.STUDIO_ID ?? 'b5c04e01-fda0-4d47-a568-4a98d3a5a6d0';
const proId = process.env.PRO_ID ?? 'a7329e97-aec6-48f2-b8fc-2a9ec7ad24fe';

const results = [];

function pushResult(name, ok, details) {
  results.push({ name, ok, details });
}

function runSql(sql) {
  const tmpfile = path.join(os.tmpdir(), `phase7-${Date.now().toString(36)}.sql`);
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

function studioMetrics() {
  const rows = runSql(`
select
  (select count(*) from public.missions where studio_id = '${studioId}' and status::text in ('open','published','selecting')) as published_missions,
  (select count(*) from public.applications a join public.missions m on m.id = a.mission_id where m.studio_id = '${studioId}' and a.status = 'pending') as pending_applications,
  (select count(*) from public.sessions where studio_id = '${studioId}' and status = 'confirmed') as active_sessions;
`);

  return rows[0];
}

function proMetrics() {
  const countRows = runSql(`
select
  count(*) as total_applications,
  coalesce(sum(case when status = 'accepted' then 1 else 0 end), 0) as accepted_count,
  case
    when count(*) = 0 then 0
    else round(100.0 * coalesce(sum(case when status = 'accepted' then 1 else 0 end), 0)::numeric / count(*), 1)
  end as success_rate
from public.applications
where pro_id = '${proId}';
`);

  const recentRows = runSql(`
select coalesce(m.title, 'Mission') as mission_title
from public.applications a
join public.missions m on m.id = a.mission_id
where a.pro_id = '${proId}'
order by a.created_at desc
limit 5;
`);

  return {
    ...countRows[0],
    recentTitles: recentRows.map((row) => row.mission_title),
  };
}

async function login(page, email, expectedPath) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.getByLabel(/adresse email/i).fill(email);
  await page.getByLabel(/^mot de passe$/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 20000 });
}

async function main() {
  const studioExpected = studioMetrics();
  const proExpected = proMetrics();

  const browser = await chromium.launch({ headless: true });
  const studioContext = await browser.newContext();
  const proContext = await browser.newContext();
  const studioPage = await studioContext.newPage();
  const proPage = await proContext.newPage();

  try {
    await login(studioPage, studioEmail, '/studio/dashboard');
    await studioPage.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
    await studioPage.locator('#dashboard-studio').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('#stat-published-missions').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('#stat-pending-applications').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('#stat-active-sessions').waitFor({ state: 'visible', timeout: 15000 });
    await studioPage.locator('#stat-total-spent').waitFor({ state: 'visible', timeout: 15000 });
    pushResult('TEST 33 : Studio connecté navigue vers /dashboard → #dashboard-studio visible avec 4 StatCards chargées', true, {
      finalUrl: studioPage.url(),
    });

    const pendingText = await studioPage.locator('#stat-pending-applications .stat-card__value').innerText();
    pushResult('TEST 34 : #stat-pending-applications affiche le bon count (cohérent avec la BDD)', Number.parseInt(pendingText, 10) === Number(studioExpected.pending_applications), {
      finalUrl: studioPage.url(),
      uiPending: pendingText,
      expectedPending: studioExpected.pending_applications,
    });

    const chartPointCount = await studioPage.locator('#mini-line-chart-applications .mini-line-chart__point').count();
    pushResult('TEST 35 : #chart-applications-over-time affiche 30 points (jours sans candidatures = 0)', chartPointCount === 30, {
      finalUrl: studioPage.url(),
      chartPointCount,
    });

    await login(proPage, proEmail, '/pro/dashboard');
    await proPage.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#dashboard-pro').waitFor({ state: 'visible', timeout: 15000 });
    const successText = await proPage.locator('#stat-success-rate .stat-card__value').innerText();
    pushResult('TEST 36 : Pro connecté navigue vers /dashboard → #dashboard-pro visible avec taux de succès calculé', Number.parseFloat(successText.replace(',', '.')) === Number(proExpected.success_rate), {
      finalUrl: proPage.url(),
      uiSuccessRate: successText,
      expectedSuccessRate: proExpected.success_rate,
    });

    const recentItems = proPage.locator('#recent-applications-list .recent-application-item');
    const recentCount = await recentItems.count();
    const recentTexts = [];
    for (let index = 0; index < recentCount; index += 1) {
      recentTexts.push(await recentItems.nth(index).innerText());
    }
    const orderedMatch = proExpected.recentTitles.every(
      (title, index) => recentTexts[index]?.includes(title),
    );
    pushResult('TEST 37 : #recent-applications-list contient bien les 5 dernières candidatures du Pro', recentCount === 5 && orderedMatch, {
      finalUrl: proPage.url(),
      recentCount,
      recentTexts,
      expectedTitles: proExpected.recentTitles,
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
  pushResult('PHASE 7 FLOW', false, {
    error: error instanceof Error ? error.message : String(error),
  });
}

console.log(JSON.stringify(results, null, 2));
