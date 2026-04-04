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

    const ROUTES_TO_TEST = [
      '/',
      '/login',
      '/register',
      '/missions',
      '/dashboard/studio',
      '/dashboard/pro',
      '/settings',
      '/notifications',
    ];

    for (const route of ROUTES_TO_TEST) {
      test(`touch targets >= 44px on ${route}`, async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto(`${BASE_URL}${route}`);
        await page.waitForLoadState('networkidle');

        const smallTargets = await page.evaluate(() => {
          const elements = document.querySelectorAll(
            'a, button, [role="button"], input, select',
          );

          return Array.from(elements)
            .filter((element) => {
              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0 && (rect.height < 44 || rect.width < 44);
            })
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName,
                text: (element as HTMLElement).innerText?.slice(0, 30) ?? '',
                width: Math.round(rect.width),
                height: Math.round(rect.height),
              };
            });
        });

        expect(smallTargets, `Small targets on ${route}`).toHaveLength(0);
      });
    }
  });
}
