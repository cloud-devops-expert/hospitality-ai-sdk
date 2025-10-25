import { test, expect } from '@playwright/test';

/**
 * E2E tests for ML demos
 * Tests that all ML demo pages load without sharp bundling errors
 */

test.describe('ML Demos - Page Load Tests', () => {
  test('food-recognition page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demos/food-recognition');
    await expect(page.locator('h1')).toContainText('Food Recognition');
    
    // Check for sharp bundling error
    expect(errors).not.toContainEqual(expect.stringContaining('sharp is not defined'));
    expect(errors.length).toBe(0);
  });

  test('ppe-detection page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demos/ppe-detection');
    await expect(page.locator('h1')).toContainText('PPE Detection');
    
    expect(errors).not.toContainEqual(expect.stringContaining('sharp is not defined'));
    expect(errors.length).toBe(0);
  });

  test('translation page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demos/translation');
    await expect(page.locator('h1')).toContainText('Translation');
    
    expect(errors).not.toContainEqual(expect.stringContaining('sharp is not defined'));
    expect(errors.length).toBe(0);
  });

  test('question-answering page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demos/question-answering');
    await expect(page.locator('h1')).toContainText('Question Answering');
    
    expect(errors).not.toContainEqual(expect.stringContaining('sharp is not defined'));
    expect(errors.length).toBe(0);
  });

  test('text-summarization page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demos/text-summarization');
    await expect(page.locator('h1')).toContainText('Text Summarization');
    
    expect(errors).not.toContainEqual(expect.stringContaining('sharp is not defined'));
    expect(errors.length).toBe(0);
  });

  test('semantic-search page loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/demos/semantic-search');
    await expect(page.locator('h1')).toContainText('Semantic Search');
    
    expect(errors).not.toContainEqual(expect.stringContaining('sharp is not defined'));
    expect(errors.length).toBe(0);
  });
});

test.describe('ML Demos - UI Interaction Tests', () => {
  test('translation demo has functional UI', async ({ page }) => {
    await page.goto('/demos/translation');
    
    // Check language selectors exist
    await expect(page.locator('select').first()).toBeVisible();
    
    // Check textarea exists
    await expect(page.locator('textarea')).toBeVisible();
    
    // Check translate button exists
    const translateButton = page.locator('button', { hasText: /Translate/i });
    await expect(translateButton).toBeVisible();
  });

  test('question-answering demo has functional UI', async ({ page }) => {
    await page.goto('/demos/question-answering');
    
    // Check question input exists
    await expect(page.locator('input[type="text"], textarea').first()).toBeVisible();
    
    // Check ask button exists
    const askButton = page.locator('button', { hasText: /Ask/i });
    await expect(askButton).toBeVisible();
  });

  test('text-summarization demo has functional UI', async ({ page }) => {
    await page.goto('/demos/text-summarization');
    
    // Check textarea exists
    await expect(page.locator('textarea')).toBeVisible();
    
    // Check summarize button exists
    const summarizeButton = page.locator('button', { hasText: /Summarize/i });
    await expect(summarizeButton).toBeVisible();
  });

  test('semantic-search demo has functional UI', async ({ page }) => {
    await page.goto('/demos/semantic-search');
    
    // Check search input exists
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible();
    
    // Check search button exists
    const searchButton = page.locator('button', { hasText: /Search/i });
    await expect(searchButton).toBeVisible();
  });

  test('food-recognition demo has functional UI', async ({ page }) => {
    await page.goto('/demos/food-recognition');
    
    // Check file upload or preset buttons exist
    const uploadInput = page.locator('input[type="file"]');
    const hasUpload = await uploadInput.count() > 0;
    
    const presetButtons = page.locator('button').filter({ hasText: /Pizza|Burger|Salad/i });
    const hasPresets = await presetButtons.count() > 0;
    
    expect(hasUpload || hasPresets).toBeTruthy();
  });

  test('ppe-detection demo has functional UI', async ({ page }) => {
    await page.goto('/demos/ppe-detection');
    
    // Check scenario selection buttons exist
    const scenarioButtons = page.locator('button').filter({ hasText: /Kitchen|Medical|Maintenance|Housekeeping/i });
    await expect(scenarioButtons.first()).toBeVisible();
    
    // Check detect button exists
    const detectButton = page.locator('button', { hasText: /Detect/i });
    await expect(detectButton).toBeVisible();
  });
});
