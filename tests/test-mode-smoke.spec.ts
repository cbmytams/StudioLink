import { expect, test } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TEST_PASSWORD = 'StudioLink!123';

test.describe('TEST mode smoke', () => {
  test('login works with seeded account', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);

    await expect(page.getByText('Mode test actif')).toBeVisible();
    await page.fill('#login-email', 'phase0.studio.mn5xe7w4@example.com');
    await page.fill('#login-password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(dashboard|studio\/dashboard|onboarding)/, { timeout: 15000 });
  });

  test('register flow works with STUDIO-TEST invitation without email confirmation block', async ({ page }) => {
    const uniqueEmail = `phase0.register.${Date.now()}@example.com`;

    await page.goto(`${BASE_URL}/invitation`);
    await page.fill('#invitation-code', 'STUDIO-TEST');
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/login\?mode=signup|\/register|\/login/, { timeout: 15000 });
    await expect(page.locator('#invitation-code')).toHaveValue('STUDIO-TEST');

    await page.fill('#login-email', uniqueEmail);
    await page.fill('#login-password', TEST_PASSWORD);
    await page.fill('#login-confirm-password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/onboarding|\/dashboard|\/studio\/dashboard/, { timeout: 15000 });
    await expect(page.getByText('Vérifie ta boîte mail')).toHaveCount(0);
  });

  test('legal pages render', async ({ page }) => {
    for (const pathname of ['/legal/privacy', '/legal/terms', '/legal/mentions']) {
      await page.goto(`${BASE_URL}${pathname}`);
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
});

