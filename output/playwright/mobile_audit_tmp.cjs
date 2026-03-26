const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const base = 'http://127.0.0.1:4173';
const password = 'StudioLink!123';
const studioEmail = 'phase0.studio.mn5xe7w4@example.com';
const proEmail = 'phase0.pro.mn5xe7w4@example.com';
const missionId = '169a24f9-40f9-4a11-b3fb-f8d78070e26a';
const sessionId = '61f5280c-dcf6-43e7-b533-cad9a68e46a2';
const missionEditId = '2ce4af16-1435-4b71-a296-9251074318f8';
const viewports = [
  { key: '375x812', width: 375, height: 812 },
  { key: '390x844', width: 390, height: 844 },
  { key: '412x915', width: 412, height: 915 },
];
const outDir = path.join(process.cwd(), 'output', 'playwright', 'mobile-audit-final');
fs.mkdirSync(outDir, { recursive: true });

async function login(page, email) {
  await page.goto(base + '/login', { waitUntil: 'domcontentloaded' });
  await page.locator('#login-email').fill(email);
  await page.locator('#login-password').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await page.waitForLoadState('networkidle');
}

async function audit(page, route, interact) {
  await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  if (interact) {
    await interact(page);
  }
  return page.evaluate(() => {
    const visible = (el) => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const controls = [...document.querySelectorAll('button, a, input, textarea, select')].filter(visible);
    const fields = [...document.querySelectorAll('input, textarea, select')].filter(visible);
    const minControlHeight = controls.reduce((min, el) => Math.min(min, el.getBoundingClientRect().height), Infinity);
    const minFieldFont = fields.reduce((min, el) => Math.min(min, parseFloat(window.getComputedStyle(el).fontSize || '16')), Infinity);
    const panel = document.querySelector('#notification-panel');
    const panelRect = panel ? panel.getBoundingClientRect() : null;
    return {
      overflowX: document.documentElement.scrollWidth > window.innerWidth,
      minControlHeight: Number.isFinite(minControlHeight) ? minControlHeight : null,
      minFieldFont: Number.isFinite(minFieldFont) ? minFieldFont : null,
      hasBottomNav: Boolean(document.querySelector('[aria-label="Dashboard"]')),
      composerVisible: Boolean(document.querySelector('#chat-input')),
      attachVisible: Boolean(document.querySelector('#btn-attach')),
      notificationPanelVisible: Boolean(panel && visible(panel)),
      notificationPanelFitsViewport: panelRect
        ? panelRect.left >= 0 && panelRect.right <= window.innerWidth && panelRect.bottom <= window.innerHeight
        : null,
      url: location.pathname + location.search,
      title: document.title,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = {};

  try {
    for (const vp of viewports) {
      const contextOptions = {
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2,
      };
      const publicCtx = await browser.newContext(contextOptions);
      const proCtx = await browser.newContext(contextOptions);
      const studioCtx = await browser.newContext(contextOptions);

      const pub = await publicCtx.newPage();
      const pro = await proCtx.newPage();
      const studio = await studioCtx.newPage();

      await login(pro, proEmail);
      await login(studio, studioEmail);

      report[vp.key] = {
        landing: await audit(pub, '/'),
        login: await audit(pub, '/login'),
        register: await audit(pub, '/register'),
        forgot: await audit(pub, '/forgot-password'),
        proDashboard: await audit(pro, '/dashboard'),
        studioDashboard: await audit(studio, '/dashboard'),
        missions: await audit(pro, '/missions'),
        missionDetail: await audit(pro, '/missions/' + missionId),
        missionForm: await audit(studio, '/studio/missions/' + missionEditId + '/edit'),
        applications: await audit(pro, '/pro/applications'),
        chatList: await audit(pro, '/chat'),
        chatSession: await audit(pro, '/chat/' + sessionId, async (page) => {
          const input = page.locator('#chat-input');
          if (await input.count()) {
            await input.click();
            await page.waitForTimeout(200);
            await input.fill('test mobile');
          }
        }),
        notifications: await audit(pro, '/notifications'),
        notificationBell: await audit(pro, '/dashboard', async (page) => {
          const bell = page.locator('#btn-notification-bell');
          if (await bell.count()) {
            await bell.click();
            await page.waitForTimeout(250);
          }
        }),
        settings: await audit(pro, '/settings'),
        notFound: await audit(pub, '/n-importe-quelle-route-inexistante'),
      };

      if (vp.key === '375x812') {
        await pub.goto(base + '/login', { waitUntil: 'domcontentloaded' });
        await pub.waitForLoadState('networkidle');
        await pub.screenshot({ path: path.join(outDir, '375-login.png'), fullPage: true });
        await pro.goto(base + '/chat/' + sessionId, { waitUntil: 'domcontentloaded' });
        await pro.waitForLoadState('networkidle');
        await pro.screenshot({ path: path.join(outDir, '375-chat.png'), fullPage: true });
        await pro.goto(base + '/notifications', { waitUntil: 'domcontentloaded' });
        await pro.waitForLoadState('networkidle');
        await pro.screenshot({ path: path.join(outDir, '375-notifications.png'), fullPage: true });
        await studio.goto(base + '/studio/missions/' + missionEditId + '/edit', { waitUntil: 'domcontentloaded' });
        await studio.waitForLoadState('networkidle');
        await studio.screenshot({ path: path.join(outDir, '375-mission-form.png'), fullPage: true });
      }

      await publicCtx.close();
      await proCtx.close();
      await studioCtx.close();
    }
  } finally {
    await browser.close();
  }

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  console.log(path.join(outDir, 'report.json'));
})();
