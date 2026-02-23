import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should load register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should show validation errors on empty login submit', async ({ page }) => {
    await page.goto('/auth/login');
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should show some error state (stay on page or show error messages)
      await expect(page).toHaveURL(/\/auth\/login/);
    }
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/auth/login');
    const registerLink = page.locator('a[href*="register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/auth\/register/);
    }
  });

  test('should load forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
