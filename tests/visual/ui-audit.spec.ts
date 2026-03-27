import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'visual', 'screenshots');

const VIEWPORTS = [
  { name: 'iPhoneSE', width: 375, height: 667 },
  { name: 'iPhone14Pro', width: 393, height: 852 },
  { name: 'desktop', width: 1280, height: 800 },
];

const PUBLIC_PAGES = [
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'privacy', path: '/legal/privacy' },
  { name: 'terms', path: '/legal/terms' },
  { name: 'mentions', path: '/legal/mentions' },
  { name: 'health', path: '/health' },
  { name: '404', path: '/une-page-qui-nexiste-pas' },
];

test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
});

for (const viewport of VIEWPORTS) {
  test.describe(`Visual audit — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const pageDef of PUBLIC_PAGES) {
      test(`${pageDef.name} renders correctly`, async ({ page }) => {
        await page.goto(`${BASE_URL}${pageDef.path}`);
        await page.waitForLoadState('networkidle');
        await page.addStyleTag({
          content: `
            [data-testid="timestamp"],
            .animate-pulse {
              visibility: hidden !important;
            }
          `,
        });
        await page.waitForTimeout(500);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, `${viewport.name}-${pageDef.name}.png`),
          fullPage: true,
        });
        const hasHorizontalScroll = await page.evaluate(
          () => document.body.scrollWidth > window.innerWidth,
        );
        expect(hasHorizontalScroll).toBe(false);
      });
    }

    test('touch targets >= 44px on login', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);
      await page.waitForLoadState('networkidle');

      const smallTargets = await page.evaluate(() => {
        const interactive = document.querySelectorAll(
          'button, a, input, [role="button"]',
        );
        const small: string[] = [];
        interactive.forEach((el) => {
          const rect = el.getBoundingClientRect();
          const styles = window.getComputedStyle(el);
          if (styles.display === 'none' || styles.visibility === 'hidden') return;
          if (rect.height < 44 || rect.width < 44) {
            small.push(
              `${el.tagName} "${
                (el as HTMLElement).innerText?.substring(0, 30)
                || el.getAttribute('aria-label')
                || el.getAttribute('type')
              }" — ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
            );
          }
        });
        return small;
      });

      if (smallTargets.length > 0) {
        console.warn('Touch targets < 44px:', smallTargets);
      }
    });
  });
}
