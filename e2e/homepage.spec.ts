import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main heading', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Hospitality AI SDK' })).toBeVisible();

    // Check subtitle
    await expect(page.getByText('Cost-effective AI solutions for hospitality management')).toBeVisible();
  });

  test('should have theme toggle button', async ({ page }) => {
    await page.goto('/');

    // Theme toggle should be visible
    const themeToggle = page.locator('button').filter({ hasText: /theme|dark|light/i }).first();
    await expect(themeToggle).toBeVisible();
  });

  test('should display all three advanced ML feature cards', async ({ page }) => {
    await page.goto('/');

    // Check for the 3 advanced ML features
    await expect(page.getByRole('link', { name: /Competitive Intelligence/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Real-Time Streaming ML/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Computer Vision/i })).toBeVisible();
  });

  test('should navigate to Competitive Intelligence demo', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Competitive Intelligence/i }).click();

    await expect(page).toHaveURL('/competitive');
    await expect(page.getByRole('heading', { name: /Competitive Intelligence/i })).toBeVisible();
  });

  test('should navigate to Streaming ML demo', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Real-Time Streaming ML/i }).click();

    await expect(page).toHaveURL('/streaming');
    await expect(page.getByRole('heading', { name: /Real-Time Streaming ML/i })).toBeVisible();
  });

  test('should navigate to Computer Vision demo', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /Computer Vision/i }).click();

    await expect(page).toHaveURL('/vision');
    await expect(page.getByRole('heading', { name: /Computer Vision/i })).toBeVisible();
  });

  test('should display test count badge', async ({ page }) => {
    await page.goto('/');

    // Check for test count badge (113 tests)
    await expect(page.getByText(/113 TESTS/i)).toBeVisible();
  });

  test('should display footer with total test count', async ({ page }) => {
    await page.goto('/');

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check footer test count
    await expect(page.getByText(/929 tests/i)).toBeVisible();
  });
});
