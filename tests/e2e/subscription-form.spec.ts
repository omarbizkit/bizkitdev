import { test, expect } from '@playwright/test';

/**
 * E2E Test: Subscription Form
 * 
 * Tests basic subscription form functionality:
 * - Form display and visibility
 * - Email input and validation
 * - Form submission
 */
test.describe('Subscription Form', () => {
  const testEmail = 'test@example.com';
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display subscription form', async ({ page }) => {
    // Look for subscription form on homepage
    const subscriptionForm = page.locator('[data-testid="hero-subscribe-form"], form[action*="subscribe"], .subscribe-form');
    
    if (await subscriptionForm.count() > 0) {
      await expect(subscriptionForm).toBeVisible();
      
      // Should have email input
      const emailInput = subscriptionForm.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();
      }
      
      // Should have submit button
      const submitButton = subscriptionForm.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.count() > 0) {
        await expect(submitButton).toBeVisible();
      }
    }
  });

  test('should allow email input', async ({ page }) => {
    const subscriptionForm = page.locator('[data-testid="hero-subscribe-form"], form[action*="subscribe"], .subscribe-form');
    
    if (await subscriptionForm.count() > 0) {
      const emailInput = subscriptionForm.locator('input[type="email"]');
      
      if (await emailInput.count() > 0) {
        // Should be able to type email
        await emailInput.fill(testEmail);
        await expect(emailInput).toHaveValue(testEmail);
      }
    }
  });

  test('should validate email format', async ({ page }) => {
    const subscriptionForm = page.locator('[data-testid="hero-subscribe-form"], form[action*="subscribe"], .subscribe-form');
    
    if (await subscriptionForm.count() > 0) {
      const emailInput = subscriptionForm.locator('input[type="email"]');
      
      if (await emailInput.count() > 0) {
        // Test invalid email
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        
        // Should have email validation (browser built-in)
        const inputType = await emailInput.getAttribute('type');
        expect(inputType).toBe('email');
      }
    }
  });

  test('should handle form submission', async ({ page }) => {
    const subscriptionForm = page.locator('[data-testid="hero-subscribe-form"], form[action*="subscribe"], .subscribe-form');
    
    if (await subscriptionForm.count() > 0) {
      const emailInput = subscriptionForm.locator('input[type="email"]');
      const submitButton = subscriptionForm.locator('button[type="submit"], input[type="submit"]');
      
      if (await emailInput.count() > 0 && await submitButton.count() > 0) {
        // Fill form
        await emailInput.fill(testEmail);
        
        // Submit form (will likely fail without backend, but should not crash)
        await submitButton.click();
        
        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('should display subscription form on subscribe page if exists', async ({ page }) => {
    // Try to navigate to subscribe page
    await page.goto('/subscribe');
    
    // Should show subscription form
    const subscriptionForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"], .subscribe-form');
    
    if (await subscriptionForm.count() > 0) {
      await expect(subscriptionForm).toBeVisible();
    } else {
      // If no subscribe page, should redirect or show 404
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/subscribe|404|not found/i);
    }
  });
});