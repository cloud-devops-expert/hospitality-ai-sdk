import { test, expect } from '@playwright/test';

test.describe('Real-Time Streaming ML Demo', () => {
  test('should load streaming demo page', async ({ page }) => {
    await page.goto('/streaming');

    await expect(page.getByRole('heading', { name: /Real-Time Streaming ML/i })).toBeVisible();
    await expect(page.getByText(/Live event processing with anomaly detection/i)).toBeVisible();
  });

  test('should display metrics dashboard', async ({ page }) => {
    await page.goto('/streaming');

    // Check for all 4 metric cards
    await expect(page.getByText(/Total Events/i)).toBeVisible();
    await expect(page.getByText(/Events\/Sec/i)).toBeVisible();
    await expect(page.getByText(/Anomalies/i)).toBeVisible();
    await expect(page.getByText(/Alerts/i)).toBeVisible();
  });

  test('should have event simulator buttons', async ({ page }) => {
    await page.goto('/streaming');

    await expect(page.getByRole('button', { name: /Booking/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Check-in/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Check-out/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Auto Stream/i })).toBeVisible();
  });

  test('should simulate booking event', async ({ page }) => {
    await page.goto('/streaming');

    // Get initial event count
    const totalEventsText = await page.locator('text=Total Events').locator('..').locator('.text-3xl').textContent();
    const initialCount = parseInt(totalEventsText || '0');

    // Click booking button
    await page.getByRole('button', { name: /Booking/i }).click();

    // Wait for event to be processed
    await page.waitForTimeout(1000);

    // Check that event count increased
    const newEventsText = await page.locator('text=Total Events').locator('..').locator('.text-3xl').textContent();
    const newCount = parseInt(newEventsText || '0');

    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('should simulate check-in event', async ({ page }) => {
    await page.goto('/streaming');

    await page.getByRole('button', { name: /Check-in/i }).click();

    await page.waitForTimeout(1000);

    // Check for event in feed
    await expect(page.getByText(/Live Event Feed/i)).toBeVisible();
  });

  test('should simulate check-out event', async ({ page }) => {
    await page.goto('/streaming');

    await page.getByRole('button', { name: /Check-out/i }).click();

    await page.waitForTimeout(1000);

    // Verify metrics updated
    const totalEventsText = await page.locator('text=Total Events').locator('..').locator('.text-3xl').textContent();
    expect(parseInt(totalEventsText || '0')).toBeGreaterThan(0);
  });

  test('should display live event feed', async ({ page }) => {
    await page.goto('/streaming');

    await expect(page.getByRole('heading', { name: /Live Event Feed/i })).toBeVisible();

    // Initially should show placeholder
    await expect(page.getByText(/Click a button to simulate events/i)).toBeVisible();
  });

  test('should populate event feed after simulation', async ({ page }) => {
    await page.goto('/streaming');

    // Simulate an event
    await page.getByRole('button', { name: /Booking/i }).click();
    await page.waitForTimeout(1000);

    // Event feed should now have content
    const eventFeed = page.locator('.max-h-96');
    await expect(eventFeed).toBeVisible();

    // Check for event ID (starts with evt-)
    await expect(page.locator('text=/evt-/')).toBeVisible();
  });

  test('should show processing time for events', async ({ page }) => {
    await page.goto('/streaming');

    await page.getByRole('button', { name: /Booking/i }).click();
    await page.waitForTimeout(1000);

    // Check for processing time (ends with 'ms')
    await expect(page.locator('text=/\\d+\\.\\d+ms/')).toBeVisible();
  });

  test('should update events per second metric', async ({ page }) => {
    await page.goto('/streaming');

    // Simulate multiple events quickly
    await page.getByRole('button', { name: /Booking/i }).click();
    await page.getByRole('button', { name: /Check-in/i }).click();
    await page.getByRole('button', { name: /Check-out/i }).click();

    await page.waitForTimeout(1000);

    // Events/Sec should be calculated
    const eventsPerSecText = await page.locator('text=Events/Sec').locator('..').locator('.text-3xl').textContent();
    expect(eventsPerSecText).toBeTruthy();
  });

  test('should disable auto stream button while streaming', async ({ page }) => {
    await page.goto('/streaming');

    const autoStreamButton = page.getByRole('button', { name: /Auto Stream/i });

    // Click to start auto stream
    await autoStreamButton.click();

    // Button should be disabled and show streaming state
    await expect(autoStreamButton).toBeDisabled();
    await expect(autoStreamButton).toContainText(/Streaming/i);
  });
});
