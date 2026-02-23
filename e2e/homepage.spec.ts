import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display store name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Clean Shop/i);
  });

  test('should have navigation header', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should navigate to catalog', async ({ page }) => {
    await page.goto('/');
    const catalogLink = page.locator('a[href="/catalog"]').first();
    if (await catalogLink.isVisible()) {
      await catalogLink.click();
      await expect(page).toHaveURL(/\/catalog/);
    }
  });
});
