import { test, expect } from '@playwright/test';

test.describe('FAQ page', () => {
  test('should load FAQ page', async ({ page }) => {
    await page.goto('/faq');
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });
});

test.describe('SEO endpoints', () => {
  test('should return sitemap.xml', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('<?xml');
    expect(text).toContain('urlset');
  });

  test('should return robots.txt', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const text = await response.text();
    expect(text).toContain('User-Agent');
    expect(text).toContain('Sitemap');
  });

  test('should return manifest.webmanifest', async ({ request }) => {
    const response = await request.get('/manifest.webmanifest');
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.name).toContain('Clean Shop');
  });
});
