import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173';

const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 14 Pro', width: 390, height: 844 },
  { name: 'Samsung Galaxy S21', width: 412, height: 915 },
];

for (const vp of viewports) {
  test.describe(`Mobile ${vp.name} (${vp.width}px)`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('Login page — no overflow, no hidden elements', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`);

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 2);

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();

      const submitBtn = page.locator('button[type="submit"]');
      await expect(submitBtn).toBeVisible();
      const box = await submitBtn.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    });

    test('Legal pages — readable, no overflow', async ({ page }) => {
      for (const path of ['/legal/privacy', '/legal/terms', '/legal/mentions']) {
        await page.goto(`${BASE_URL}${path}`);
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(vp.width + 2);
        await expect(page.locator('h1, h2').first()).toBeVisible();
      }
    });

    test('404 page — visible, has back button', async ({ page }) => {
      await page.goto(`${BASE_URL}/cette-page-nexiste-pas`);
      await expect(page.locator('#page-404')).toBeVisible();
      await expect(page.locator('text=404')).toBeVisible();
      await expect(page.locator('button').first()).toBeVisible();
    });

    test('Health page — visible', async ({ page }) => {
      await page.goto(`${BASE_URL}/health`);
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(vp.width + 2);
    });
  });
}
