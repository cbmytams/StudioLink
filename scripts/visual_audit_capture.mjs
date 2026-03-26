import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4174';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';

const outputDir = path.join(process.cwd(), 'output', 'visual-audit');
const desktopDir = path.join(outputDir, 'desktop');
const mobileDir = path.join(outputDir, 'mobile');

fs.mkdirSync(desktopDir, { recursive: true });
fs.mkdirSync(mobileDir, { recursive: true });

function runSql(sql) {
  const tmpfile = path.join(os.tmpdir(), `visual-audit-${Date.now().toString(36)}.sql`);
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

function getAuditIds() {
  const [row] = runSql(`
select json_build_object(
  'studio_profile_id', (select id from public.profiles where display_name = 'Studio Phase 0' limit 1),
  'pro_profile_id', (select id from public.profiles where display_name = 'Phase 8 Pro' limit 1),
  'open_mission_id', (select id from public.missions where status in ('open', 'published') order by created_at desc limit 1),
  'accepted_mission_id', (select mission_id from public.applications where status = 'accepted' order by updated_at desc nulls last, created_at desc limit 1),
  'session_id', (select id from public.sessions order by updated_at desc nulls last, created_at desc limit 1)
) as payload;
`);
  return row.payload;
}

async function login(page, email, expectedPathSegment) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(`**${expectedPathSegment}`, { timeout: 20000 });
}

async function capture(page, bucket, key, route, interaction) {
  const consoleErrors = [];
  const pageErrors = [];
  const consoleHandler = (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  };
  const pageErrorHandler = (error) => {
    pageErrors.push(error.message);
  };

  page.on('console', consoleHandler);
  page.on('pageerror', pageErrorHandler);

  try {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    if (interaction) {
      await interaction(page);
      await page.waitForTimeout(600);
    }

    const title = await page.title();
    const h1 = await page.locator('h1').first().textContent().catch(() => null);
    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const screenshotPath = path.join(bucket, `${key}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    return {
      key,
      route,
      url: page.url(),
      title,
      h1,
      overflowX,
      consoleErrors,
      pageErrors,
      screenshotPath,
    };
  } finally {
    page.off('console', consoleHandler);
    page.off('pageerror', pageErrorHandler);
  }
}

async function main() {
  const ids = getAuditIds();
  const browser = await chromium.launch({ headless: true });

  const desktopPublic = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const desktopStudio = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const desktopPro = await browser.newContext({ viewport: { width: 1440, height: 1024 } });
  const mobilePublic = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobileStudio = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobilePro = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });

  const pages = [];

  try {
    const desktopPublicPage = await desktopPublic.newPage();
    const desktopStudioPage = await desktopStudio.newPage();
    const desktopProPage = await desktopPro.newPage();
    const mobilePublicPage = await mobilePublic.newPage();
    const mobileStudioPage = await mobileStudio.newPage();
    const mobileProPage = await mobilePro.newPage();

    await login(desktopStudioPage, studioEmail, '/studio/dashboard');
    await login(desktopProPage, proEmail, '/pro/dashboard');
    await login(mobileStudioPage, studioEmail, '/studio/dashboard');
    await login(mobileProPage, proEmail, '/pro/dashboard');

    const desktopScenarios = [
      ['landing', desktopPublicPage, '/', null],
      ['login', desktopPublicPage, '/login', null],
      ['register', desktopPublicPage, '/register', null],
      ['forgot-password', desktopPublicPage, '/forgot-password', null],
      ['studio-dashboard', desktopStudioPage, '/dashboard', null],
      ['pro-dashboard', desktopProPage, '/dashboard', null],
      ['missions-feed', desktopProPage, '/missions', null],
      ['mission-detail', desktopProPage, `/missions/${ids.open_mission_id}`, null],
      ['mission-create', desktopStudioPage, '/missions/new', null],
      ['mission-manage', desktopStudioPage, `/missions/${ids.accepted_mission_id}/manage`, null],
      ['pro-public-profile', desktopPublicPage, `/pros/${ids.pro_profile_id}`, null],
      ['studio-public-profile', desktopPublicPage, `/studios/${ids.studio_profile_id}`, null],
      ['settings', desktopProPage, '/settings', null],
      ['applications', desktopProPage, '/applications', null],
      ['chat-list', desktopProPage, '/chat', null],
      ['chat-session', desktopProPage, `/chat/${ids.session_id}`, null],
      ['notifications-page', desktopProPage, '/notifications', null],
      ['notification-bell', desktopProPage, '/dashboard', async (page) => {
        await page.locator('#btn-notification-bell').click();
        await page.locator('#notification-panel').waitFor({ state: 'visible', timeout: 10000 });
      }],
      ['404', desktopPublicPage, '/n-importe-quelle-route-inexistante', null],
    ];

    for (const [key, page, route, interaction] of desktopScenarios) {
      pages.push(await capture(page, desktopDir, key, route, interaction));
    }

    const mobileScenarios = [
      ['landing-mobile', mobilePublicPage, '/', null],
      ['login-mobile', mobilePublicPage, '/login', null],
      ['register-mobile', mobilePublicPage, '/register', null],
      ['studio-dashboard-mobile', mobileStudioPage, '/dashboard', null],
      ['missions-feed-mobile', mobileProPage, '/missions', null],
      ['mission-detail-mobile', mobileProPage, `/missions/${ids.open_mission_id}`, null],
      ['mission-create-mobile', mobileStudioPage, '/missions/new', null],
      ['chat-session-mobile', mobileProPage, `/chat/${ids.session_id}`, null],
      ['notifications-page-mobile', mobileProPage, '/notifications', null],
      ['settings-mobile', mobileProPage, '/settings', null],
    ];

    for (const [key, page, route, interaction] of mobileScenarios) {
      pages.push(await capture(page, mobileDir, key, route, interaction));
    }
  } finally {
    await desktopPublic.close();
    await desktopStudio.close();
    await desktopPro.close();
    await mobilePublic.close();
    await mobileStudio.close();
    await mobilePro.close();
    await browser.close();
  }

  const outputPath = path.join(outputDir, 'report.json');
  fs.writeFileSync(outputPath, JSON.stringify({ base, ids, pages }, null, 2));
  console.log(outputPath);
}

await main();
