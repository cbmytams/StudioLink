import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const password = process.env.TEST_PASSWORD ?? '';
const studioEmail = process.env.STUDIO_EMAIL ?? '';
const proEmail = process.env.PRO_EMAIL ?? '';
const proProfileId = process.env.PRO_PROFILE_ID ?? 'a7329e97-aec6-48f2-b8fc-2a9ec7ad24fe';
const studioProfileId = process.env.STUDIO_PROFILE_ID ?? 'b5c04e01-fda0-4d47-a568-4a98d3a5a6d0';
const out = path.join(process.cwd(), 'output', 'visual-audit-final');
const screenshotDir = path.join(out, 'screenshots');

fs.mkdirSync(screenshotDir, { recursive: true });

async function dismissCookieBanner(page) {
  const reject = page.getByRole('button', { name: /tout refuser/i });
  if (await reject.count()) {
    await reject.first().click().catch(() => undefined);
    await page.waitForTimeout(200);
  }
}

async function login(page, email) {
  if (!email || !password) {
    throw new Error('AUTH_SKIPPED_MISSING_CREDENTIALS');
  }

  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  await dismissCookieBanner(page);
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForFunction(
    (allowedPaths) => allowedPaths.some((path) => window.location.pathname.startsWith(path)),
    ['/dashboard', '/onboarding', '/studio/dashboard', '/pro/dashboard'],
    { timeout: 20000 },
  );
}

async function capture(page, viewportName, name) {
  await page.addStyleTag({
    content: `
      [data-testid="timestamp"],
      .animate-pulse {
        visibility: hidden !important;
      }
    `,
  }).catch(() => undefined);
  await page.waitForTimeout(900);
  const screenshotPath = path.join(screenshotDir, `${viewportName}-${name}.png`);
  const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return {
    viewport: viewportName,
    name,
    url: page.url(),
    title: await page.title(),
    hasHorizontalScroll,
    screenshotPath,
  };
}

async function collectSmallTargets(page) {
  return page.evaluate(() => {
    const interactive = document.querySelectorAll('button, a, input, textarea, select, [role="button"]');
    const small = [];
    interactive.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      if (styles.display === 'none' || styles.visibility === 'hidden') return;
      if (rect.height < 44 || rect.width < 44) {
        small.push(
          `${el.tagName} "${
            el.textContent?.trim().slice(0, 30)
            || el.getAttribute('aria-label')
            || el.getAttribute('type')
            || 'n/a'
          }" — ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
        );
      }
    });
    return small;
  });
}

async function capturePublicRoutes(page, viewportName, report) {
  const routes = [
    ['home', '/'],
    ['login', '/login'],
    ['register', '/register'],
    ['privacy', '/legal/privacy'],
    ['terms', '/legal/terms'],
    ['mentions', '/legal/mentions'],
    ['health', '/health'],
    ['404', '/n-importe-quelle-route-inexistante'],
  ];

  for (const [name, route] of routes) {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    report.captures.push(await capture(page, viewportName, name));
  }

  await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
  report.touchTargets.push({
    viewport: viewportName,
    route: '/login',
    smallTargets: await collectSmallTargets(page),
  });
}

async function captureProRoutes(page, viewportName, report) {
  const routes = [
    ['pro-dashboard', '/dashboard'],
    ['missions-feed', '/missions'],
    ['applications', '/applications'],
    ['chat-list', '/chat'],
    ['settings', '/settings'],
    ['notifications', '/notifications'],
  ];

  for (const [name, route] of routes) {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    report.captures.push(await capture(page, viewportName, name));
  }

  await page.goto(`${base}/missions`, { waitUntil: 'domcontentloaded' });
  const missionCard = page.locator('.mission-card').first();
  if (await missionCard.count()) {
    await missionCard.click();
    await page.waitForTimeout(900);
    report.captures.push(await capture(page, viewportName, 'mission-detail'));
  }
}

async function captureStudioRoutes(page, viewportName, report) {
  const routes = [
    ['studio-dashboard', '/dashboard'],
    ['studio-missions', '/studio/missions'],
    ['studio-chat', '/chat'],
    ['studio-settings', '/settings'],
  ];

  for (const [name, route] of routes) {
    await page.goto(`${base}${route}`, { waitUntil: 'domcontentloaded' });
    report.captures.push(await capture(page, viewportName, name));
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const report = {
    base,
    generatedAt: new Date().toISOString(),
    captures: [],
    touchTargets: [],
    errors: [],
    warnings: [],
    auth: {
      enabled: Boolean(password && studioEmail && proEmail),
      missing: [
        !password ? 'TEST_PASSWORD' : null,
        !studioEmail ? 'STUDIO_EMAIL' : null,
        !proEmail ? 'PRO_EMAIL' : null,
      ].filter(Boolean),
    },
  };

  const viewports = [
    { name: 'desktop', width: 1280, height: 800, isMobile: false, auth: true },
    { name: 'iPhoneSE', width: 375, height: 667, isMobile: true, auth: true },
    { name: 'iPhone14Pro', width: 393, height: 852, isMobile: true, auth: true },
  ];

  try {
    for (const viewport of viewports) {
      const publicContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        isMobile: viewport.isMobile,
      });
      await publicContext.addInitScript(() => {
        window.localStorage.setItem('cookie_consent', 'accepted');
      });
      const publicPage = await publicContext.newPage();
      await capturePublicRoutes(publicPage, viewport.name, report);
      await publicPage.goto(`${base}/pros/${proProfileId}`, { waitUntil: 'domcontentloaded' });
      report.captures.push(await capture(publicPage, viewport.name, 'pro-public-profile'));
      await publicPage.goto(`${base}/studios/${studioProfileId}`, { waitUntil: 'domcontentloaded' });
      report.captures.push(await capture(publicPage, viewport.name, 'studio-public-profile'));
      await publicContext.close();

      if (viewport.auth) {
        const proContext = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile,
        });
        const studioContext = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          isMobile: viewport.isMobile,
        });
        await proContext.addInitScript(() => {
          window.localStorage.setItem('cookie_consent', 'accepted');
        });
        await studioContext.addInitScript(() => {
          window.localStorage.setItem('cookie_consent', 'accepted');
        });

        const proPage = await proContext.newPage();
        const studioPage = await studioContext.newPage();

        if (!report.auth.enabled) {
          report.warnings.push({
            viewport: viewport.name,
            role: 'auth',
            message: `Captures authentifiees ignorees (variables manquantes: ${report.auth.missing.join(', ')})`,
          });
        } else {
          try {
            await login(proPage, proEmail);
            await captureProRoutes(proPage, viewport.name, report);
          } catch (error) {
            report.errors.push({
              viewport: viewport.name,
              role: 'pro',
              message: error instanceof Error ? error.message : String(error),
            });
          }

          try {
            await login(studioPage, studioEmail);
            await captureStudioRoutes(studioPage, viewport.name, report);
          } catch (error) {
            report.errors.push({
              viewport: viewport.name,
              role: 'studio',
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }

        await proContext.close();
        await studioContext.close();
      }
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  const overflowCount = report.captures.filter((entry) => entry.hasHorizontalScroll).length;
  const touchViolations = report.touchTargets.reduce((acc, entry) => acc + entry.smallTargets.length, 0);
  const summary = {
    captures: report.captures.length,
    overflowCount,
    touchViolations,
    errors: report.errors.length,
    warnings: report.warnings.length,
    authEnabled: report.auth.enabled,
  };
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

await main();
