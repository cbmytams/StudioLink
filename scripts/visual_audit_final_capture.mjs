import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:4175';
const password = process.env.TEST_PASSWORD ?? 'StudioLink!123';
const studioEmail = process.env.STUDIO_EMAIL ?? 'phase0.studio.mn5xe7w4@example.com';
const proEmail = process.env.PRO_EMAIL ?? 'phase0.pro.mn5xe7w4@example.com';
const proProfileId = process.env.PRO_PROFILE_ID ?? 'a7329e97-aec6-48f2-b8fc-2a9ec7ad24fe';
const studioProfileId = process.env.STUDIO_PROFILE_ID ?? 'b5c04e01-fda0-4d47-a568-4a98d3a5a6d0';
const out = path.join(process.cwd(), 'output', 'visual-audit-final');

fs.mkdirSync(out, { recursive: true });

async function login(page, email, expectedPath) {
  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForURL(`**${expectedPath}`, { timeout: 20000 });
}

async function capture(page, name) {
  await page.waitForTimeout(900);
  const screenshotPath = path.join(out, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return {
    name,
    url: page.url(),
    title: await page.title(),
    screenshotPath,
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const desktopStudio = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const desktopPro = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const desktopPublic = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const mobilePro = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });
  const mobilePublic = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true });

  const studioPage = await desktopStudio.newPage();
  const proPage = await desktopPro.newPage();
  const publicPage = await desktopPublic.newPage();
  const mobileProPage = await mobilePro.newPage();
  const mobilePublicPage = await mobilePublic.newPage();

  const report = [];

  try {
    await login(studioPage, studioEmail, '/studio/dashboard');
    await login(proPage, proEmail, '/pro/dashboard');
    await login(mobileProPage, proEmail, '/pro/dashboard');

    await publicPage.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(publicPage, 'landing'));
    await publicPage.goto(`${base}/register`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(publicPage, 'register'));
    await publicPage.goto(`${base}/forgot-password`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(publicPage, 'forgot-password'));

    await studioPage.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(studioPage, 'studio-dashboard'));
    await proPage.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(proPage, 'pro-dashboard'));

    await proPage.goto(`${base}/missions`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('.mission-card').first().waitFor({ state: 'visible', timeout: 15000 });
    report.push(await capture(proPage, 'missions-feed'));
    await proPage.locator('.mission-card').first().click();
    await proPage.waitForTimeout(900);
    report.push(await capture(proPage, 'mission-detail'));

    await studioPage.goto(`${base}/missions/new`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(studioPage, 'mission-create'));
    await studioPage.goto(`${base}/studio/missions`, { waitUntil: 'domcontentloaded' });
    await studioPage.getByRole('button', { name: /voir les candidatures/i }).first().click();
    await studioPage.waitForTimeout(900);
    report.push(await capture(studioPage, 'mission-manage'));

    await proPage.goto(`${base}/applications`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(proPage, 'applications'));

    await proPage.goto(`${base}/chat`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(proPage, 'chat-list'));
    const firstChat = proPage.locator('button').filter({ hasText: /Studio Phase 0|Phase 8 Pro|Studio/i }).first();
    if (await firstChat.count()) {
      await firstChat.click();
      await proPage.waitForTimeout(900);
    }
    report.push(await capture(proPage, 'chat-session'));

    await proPage.goto(`${base}/notifications`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(proPage, 'notifications-page'));
    await proPage.goto(`${base}/dashboard`, { waitUntil: 'domcontentloaded' });
    await proPage.locator('#btn-notification-bell').click();
    await proPage.locator('#notification-panel').waitFor({ state: 'visible', timeout: 10000 });
    report.push(await capture(proPage, 'notification-bell'));

    await proPage.goto(`${base}/settings`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(proPage, 'settings'));

    await publicPage.goto(`${base}/pros/${proProfileId}`, { waitUntil: 'domcontentloaded' });
    await publicPage.waitForTimeout(900);
    report.push(await capture(publicPage, 'pro-public-profile'));
    await publicPage.goto(`${base}/studios/${studioProfileId}`, { waitUntil: 'domcontentloaded' });
    await publicPage.waitForTimeout(900);
    report.push(await capture(publicPage, 'studio-public-profile'));
    await publicPage.goto(`${base}/n-importe-quelle-route-inexistante`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(publicPage, '404'));

    await mobileProPage.goto(`${base}/missions`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(mobileProPage, 'missions-feed-mobile'));
    await mobileProPage.locator('.mission-card').first().click();
    await mobileProPage.waitForTimeout(900);
    report.push(await capture(mobileProPage, 'mission-detail-mobile'));
    await mobileProPage.goto(`${base}/notifications`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(mobileProPage, 'notifications-mobile'));
    await mobileProPage.goto(`${base}/settings`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(mobileProPage, 'settings-mobile'));
    await mobilePublicPage.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
    report.push(await capture(mobilePublicPage, 'landing-mobile'));
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

await main();
