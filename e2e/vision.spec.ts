import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Computer Vision Demo', () => {
  test('should load vision demo page', async ({ page }) => {
    await page.goto('/vision');

    await expect(page.getByRole('heading', { name: /Computer Vision/i })).toBeVisible();
    await expect(page.getByText(/Facility monitoring, occupancy detection, and safety analysis/i)).toBeVisible();
  });

  test('should display all analysis type buttons', async ({ page }) => {
    await page.goto('/vision');

    // Check all 5 analysis types
    await expect(page.getByRole('button', { name: 'facility' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'occupancy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'cleanliness' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'safety' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'asset' })).toBeVisible();
  });

  test('should have image upload input', async ({ page }) => {
    await page.goto('/vision');

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
    await expect(page.getByText(/Upload Image \(Optional\)/i)).toBeVisible();
  });

  test('should switch between analysis types', async ({ page }) => {
    await page.goto('/vision');

    // Click occupancy button
    await page.getByRole('button', { name: 'occupancy' }).click();
    await expect(page.getByRole('button', { name: 'occupancy' })).toHaveClass(/bg-blue-600/);

    // Click cleanliness button
    await page.getByRole('button', { name: 'cleanliness' }).click();
    await expect(page.getByRole('button', { name: 'cleanliness' })).toHaveClass(/bg-blue-600/);
  });

  test('should run analysis without image', async ({ page }) => {
    await page.goto('/vision');

    // Click run analysis button
    const runButton = page.getByRole('button', { name: /Run Analysis/i });
    await runButton.click();

    // Should show loading state
    await expect(page.getByText(/Analyzing/i)).toBeVisible();

    // Wait for results
    await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible({ timeout: 10000 });

    // Check for result metrics
    await expect(page.getByText(/Overall Score/i)).toBeVisible();
    await expect(page.getByText(/Confidence/i)).toBeVisible();
    await expect(page.getByText(/Processing/i)).toBeVisible();
  });

  test('should display detections section after analysis', async ({ page }) => {
    await page.goto('/vision');

    await page.getByRole('button', { name: /Run Analysis/i }).click();
    await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible({ timeout: 10000 });

    // Check for detections
    await expect(page.getByText(/Detections/i)).toBeVisible();
  });

  test('should test all analysis types', async ({ page }) => {
    await page.goto('/vision');

    const analysisTypes = ['facility', 'occupancy', 'cleanliness', 'safety', 'asset'];

    for (const type of analysisTypes) {
      await page.getByRole('button', { name: type }).click();
      await page.getByRole('button', { name: /Run Analysis/i }).click();

      // Wait for results
      await expect(page.getByRole('heading', { name: /Analysis Results/i })).toBeVisible({ timeout: 10000 });

      // Navigate back to vision page for next iteration
      if (type !== 'asset') {
        await page.goto('/vision');
      }
    }
  });

  test('should have run analysis button disabled while analyzing', async ({ page }) => {
    await page.goto('/vision');

    const runButton = page.getByRole('button', { name: /Run Analysis/i });
    await runButton.click();

    // Button should be disabled during analysis
    await expect(runButton).toBeDisabled();
  });
});
