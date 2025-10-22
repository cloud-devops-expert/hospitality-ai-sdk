import { test, expect } from '@playwright/test';

test.describe('Competitive Intelligence Demo', () => {
  test('should load competitive intelligence demo page', async ({ page }) => {
    await page.goto('/competitive');

    await expect(page.getByRole('heading', { name: /Competitive Intelligence/i })).toBeVisible();
    await expect(page.getByText(/Market positioning and competitive analysis/i)).toBeVisible();
  });

  test('should display all navigation tabs', async ({ page }) => {
    await page.goto('/competitive');

    // Check for all 5 tabs
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Positioning' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Amenities' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Recommendations' })).toBeVisible();
  });

  test('should default to overview tab', async ({ page }) => {
    await page.goto('/competitive');

    // Overview tab should be active
    const overviewTab = page.getByRole('button', { name: 'Overview' });
    await expect(overviewTab).toHaveClass(/border-blue-500/);

    // Check for overview content
    await expect(page.getByText(/Market Position/i)).toBeVisible();
  });

  test('should switch to positioning tab', async ({ page }) => {
    await page.goto('/competitive');

    await page.getByRole('button', { name: 'Positioning' }).click();

    // Positioning tab should be active
    const positioningTab = page.getByRole('button', { name: 'Positioning' });
    await expect(positioningTab).toHaveClass(/border-blue-500/);

    // Check for positioning content
    await expect(page.getByText(/Market Positioning/i)).toBeVisible();
  });

  test('should switch to pricing tab', async ({ page }) => {
    await page.goto('/competitive');

    await page.getByRole('button', { name: 'Pricing' }).click();

    // Pricing tab should be active
    const pricingTab = page.getByRole('button', { name: 'Pricing' });
    await expect(pricingTab).toHaveClass(/border-blue-500/);

    // Check for pricing content
    await expect(page.getByText(/Price Comparison/i)).toBeVisible();
  });

  test('should switch to amenities tab', async ({ page }) => {
    await page.goto('/competitive');

    await page.getByRole('button', { name: 'Amenities' }).click();

    // Amenities tab should be active
    const amenitiesTab = page.getByRole('button', { name: 'Amenities' });
    await expect(amenitiesTab).toHaveClass(/border-blue-500/);

    // Check for amenities content
    await expect(page.getByText(/Amenity Gap Analysis/i)).toBeVisible();
  });

  test('should switch to recommendations tab', async ({ page }) => {
    await page.goto('/competitive');

    await page.getByRole('button', { name: 'Recommendations' }).click();

    // Recommendations tab should be active
    const recommendationsTab = page.getByRole('button', { name: 'Recommendations' });
    await expect(recommendationsTab).toHaveClass(/border-blue-500/);

    // Check for recommendations content
    await expect(page.getByText(/Strategic Recommendations/i)).toBeVisible();
  });

  test('should display market share on overview tab', async ({ page }) => {
    await page.goto('/competitive');

    // Should show market share percentage
    await expect(page.locator('text=/\\d+%/')).toBeVisible();
    await expect(page.getByText(/Your estimated market share/i)).toBeVisible();
  });

  test('should display competitor cards on overview tab', async ({ page }) => {
    await page.goto('/competitive');

    // Check for competitor information
    await expect(page.getByText(/Competitor/i)).toBeVisible();
  });

  test('should display key metrics on overview tab', async ({ page }) => {
    await page.goto('/competitive');

    // Check for various metrics
    await expect(page.getByText(/Market Position/i)).toBeVisible();
  });

  test('should navigate through all tabs sequentially', async ({ page }) => {
    await page.goto('/competitive');

    const tabs = ['Overview', 'Positioning', 'Pricing', 'Amenities', 'Recommendations'];

    for (const tabName of tabs) {
      await page.getByRole('button', { name: tabName }).click();

      const tab = page.getByRole('button', { name: tabName });
      await expect(tab).toHaveClass(/border-blue-500/);

      // Small delay to allow content to load
      await page.waitForTimeout(200);
    }
  });

  test('should display competitor pricing on pricing tab', async ({ page }) => {
    await page.goto('/competitive');

    await page.getByRole('button', { name: 'Pricing' }).click();

    // Should show price comparison
    await expect(page.getByText(/Price Comparison/i)).toBeVisible();
    await expect(page.locator('text=/\\$\\d+/')).toBeVisible();
  });

  test('should display strategic actions on recommendations tab', async ({ page }) => {
    await page.goto('/competitive');

    await page.getByRole('button', { name: 'Recommendations' }).click();

    // Should show action items
    await expect(page.getByText(/Strategic Recommendations/i)).toBeVisible();
  });

  test('should maintain state when switching tabs', async ({ page }) => {
    await page.goto('/competitive');

    // Switch to pricing tab
    await page.getByRole('button', { name: 'Pricing' }).click();
    await expect(page.getByText(/Price Comparison/i)).toBeVisible();

    // Switch to overview
    await page.getByRole('button', { name: 'Overview' }).click();
    await expect(page.getByText(/Market Position/i)).toBeVisible();

    // Go back to pricing - should still work
    await page.getByRole('button', { name: 'Pricing' }).click();
    await expect(page.getByText(/Price Comparison/i)).toBeVisible();
  });
});
