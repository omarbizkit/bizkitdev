// Simple E2E test to validate our troubleshooting setup
import { test, expect } from '@playwright/test';

test.describe('Workflow Diagnosis - Setup Validation', () => {
  test('should validate server health and environment setup', async ({ page }) => {
    // Basic setup validation
    await page.goto('http://localhost:4321');

    // Check page title using page.title() method
    const title = await page.title();
    expect(title).toContain('Omar Torres');

    console.log('✅ Setup validation passed - server and environment working');
  });

  test('should check for potential timeout sources', async ({ page }) => {
    // Simulate common timeout scenarios

    try {
      await page.goto('http://localhost:4321');
      await page.waitForLoadState('networkidle');

      // Check if subscription form loads (common failure point)
      const subscribeForm = page.locator('data-testid=hero-subscribe-form');
      const isVisible = await subscribeForm.isVisible().catch(() => false);

      if (isVisible) {
        console.log('✅ Subscription form loads successfully');
      } else {
        console.log('⚠️ Subscription form not found - potential failure point');
      }

    } catch (error) {
      console.error('❌ Page load error - major failure point:', error.message);

      // This represents the kind of failure we'd investigate
      throw new Error(`E2E page load failed: ${error.message}`);
    }
  });
});