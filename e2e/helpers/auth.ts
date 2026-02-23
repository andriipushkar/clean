import { Page, expect } from '@playwright/test';

export const TEST_USERS = {
  admin: {
    email: 'admin@clean-shop.ua',
    password: 'Admin123!',
    fullName: 'Адміністратор',
  },
  manager: {
    email: 'manager@clean-shop.ua',
    password: 'Manager123!',
    fullName: 'Менеджер Олена',
  },
  client: {
    email: 'client@test.ua',
    password: 'Client123!',
    fullName: 'Тестовий Клієнт',
  },
};

/**
 * Login via the UI login form.
 */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  // Wait for redirect away from login page
  await expect(page).not.toHaveURL(/\/auth\/login/, { timeout: 10000 });
}

/**
 * Login via API and set token in localStorage (faster).
 */
export async function loginViaAPI(page: Page, email: string, password: string) {
  const baseURL = page.url().split('/').slice(0, 3).join('/') || 'http://localhost:3000';

  const response = await page.request.post(`${baseURL}/api/v1/auth/login`, {
    data: { email, password },
  });

  const body = await response.json();
  if (!body.success || !body.data?.accessToken) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(body)}`);
  }

  // Store tokens in localStorage for the app to use
  await page.evaluate(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    },
    { accessToken: body.data.accessToken, refreshToken: body.data.refreshToken }
  );

  return body.data;
}

/**
 * Ensure the user is logged out.
 */
export async function logout(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  });
}
