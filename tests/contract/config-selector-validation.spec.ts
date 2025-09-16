import { test, expect } from '@playwright/test';

/**
 * T009: Selector Existence Validation Test
 *
 * This test should PASS as audit showed selectors are properly aligned.
 * Validates that all test selectors exist in actual DOM elements.
 *
 * Contract: All data-testid selectors used in tests must exist in source code
 */

test.describe('Test Selector Existence Validation', () => {

  test('should find hero-subscribe-form selector on homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // The hero-subscribe-form should exist on homepage
    const heroForm = page.locator('[data-testid="hero-subscribe-form"]');

    await expect(heroForm).toBeVisible();

    // Should be a form element
    await expect(heroForm).toHaveRole('form');

    console.log('✅ hero-subscribe-form selector found on homepage');
  });

  test('should find subscribe-form selector on subscribe page', async ({ page }) => {
    await page.goto('/subscribe');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // The subscribe-form should exist on subscribe page
    const subscribeForm = page.locator('[data-testid="subscribe-form"]');

    await expect(subscribeForm).toBeVisible();

    // Should be a form element
    await expect(subscribeForm).toHaveRole('form');

    console.log('✅ subscribe-form selector found on subscribe page');
  });

  test('should find project-grid selector on homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // The project-grid should exist
    const projectGrid = page.locator('[data-testid="project-grid"]');

    await expect(projectGrid).toBeVisible();

    console.log('✅ project-grid selector found on homepage');
  });

  test('should validate success and error message selectors', async ({ page }) => {
    await page.goto('/subscribe');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Success message should exist (may not be visible initially)
    const successMessage = page.locator('[data-testid="success-message"]');
    await expect(successMessage).toBeAttached();

    // Error message should exist (may not be visible initially)
    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeAttached();

    console.log('✅ Success and error message selectors found');
  });

  test('should validate all critical test selectors are present', async ({ page }) => {
    // Test critical selectors used by E2E tests
    const criticalSelectors = [
      { selector: 'hero-subscribe-form', page: '/', description: 'Homepage subscription form' },
      { selector: 'subscribe-form', page: '/subscribe', description: 'Subscribe page form' },
      { selector: 'project-grid', page: '/', description: 'Homepage project grid' },
      { selector: 'success-message', page: '/subscribe', description: 'Success message' },
      { selector: 'error-message', page: '/subscribe', description: 'Error message' }
    ];

    const missingSelectors: string[] = [];

    for (const { selector, page: pagePath, description } of criticalSelectors) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const element = page.locator(`[data-testid="${selector}"]`);

      // Check if element exists (is attached to DOM)
      const exists = await element.isAttached();

      if (!exists) {
        missingSelectors.push(`${selector} (${description}) on ${pagePath}`);
      } else {
        console.log(`✅ ${selector}: Found on ${pagePath}`);
      }
    }

    if (missingSelectors.length > 0) {
      console.log('❌ Missing selectors:');
      missingSelectors.forEach(missing => console.log(`  ${missing}`));

      expect(missingSelectors).toHaveLength(0);
    } else {
      console.log('✅ All critical selectors found');
    }
  });

  test('should validate selector accessibility and proper implementation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Hero form should be accessible and functional
    const heroForm = page.locator('[data-testid="hero-subscribe-form"]');

    // Should have proper form structure
    const emailInput = heroForm.locator('input[type="email"]');
    const submitButton = heroForm.locator('button[type="submit"], input[type="submit"]');

    await expect(emailInput).toBeAttached();
    await expect(submitButton).toBeAttached();

    // Test accessibility
    await expect(emailInput).toBeEnabled();
    await expect(submitButton).toBeEnabled();

    console.log('✅ Hero form has proper structure and accessibility');

    // Test subscribe page form structure
    await page.goto('/subscribe');
    await page.waitForLoadState('networkidle');

    const subscribeForm = page.locator('[data-testid="subscribe-form"]');
    const subscribeEmail = subscribeForm.locator('input[type="email"]');
    const subscribeSubmit = subscribeForm.locator('button[type="submit"], input[type="submit"]');

    await expect(subscribeEmail).toBeAttached();
    await expect(subscribeSubmit).toBeAttached();

    console.log('✅ Subscribe form has proper structure and accessibility');
  });

  test('should validate selectors work with different interaction patterns', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const heroForm = page.locator('[data-testid="hero-subscribe-form"]');

    // Test various selector patterns that E2E tests might use
    const selectorVariations = [
      '[data-testid="hero-subscribe-form"]',
      'data-testid=hero-subscribe-form',
      '[data-testid*="hero-subscribe"]',
      'form[data-testid="hero-subscribe-form"]'
    ];

    for (const selectorPattern of selectorVariations) {
      const element = page.locator(selectorPattern);
      const exists = await element.isAttached();

      expect(exists).toBe(true);
      console.log(`✅ Selector pattern works: ${selectorPattern}`);
    }
  });
});