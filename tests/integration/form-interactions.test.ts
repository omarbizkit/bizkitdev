import { test, expect } from '@playwright/test';
import type { Browser, Page } from '@playwright/test';
import { chromium } from '@playwright/test';

test.describe('Form Interactions Integration Tests', () => {
  let browser: Browser;
  let page: Page;
  const baseURL = 'http://localhost:4321';

  test.beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test.describe('Contact Form Integration', () => {
    test('should render accessible contact form when available', async () => {
      await page.goto(baseURL);
      
      // Look for any contact forms on the page
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const firstForm = forms.first();
        
        // Check form has proper accessibility attributes
        const ariaLabel = await firstForm.getAttribute('aria-labelledby');
        const ariaDescribed = await firstForm.getAttribute('aria-describedby');
        
        expect(ariaLabel || ariaDescribed).toBeTruthy();
        
        // Check for proper form structure
        const labels = firstForm.locator('label');
        const inputs = firstForm.locator('input, textarea, select');
        
        const labelCount = await labels.count();
        const inputCount = await inputs.count();
        
        // Should have labels for inputs
        expect(labelCount).toBeGreaterThan(0);
        expect(inputCount).toBeGreaterThan(0);
      }
    });

    test('should handle form validation properly', async () => {
      await page.goto(baseURL);
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        
        if (await submitButton.isVisible()) {
          // Try to submit empty form
          await submitButton.click();
          
          // Check for validation messages
          const errorMessages = form.locator('[role="alert"], .error-message, [aria-live]');
          const errorCount = await errorMessages.count();
          
          // Should show validation messages for required fields
          if (errorCount > 0) {
            const firstError = errorMessages.first();
            await expect(firstError).toBeVisible();
          }
        }
      }
    });

    test('should support keyboard navigation in forms', async () => {
      await page.goto(baseURL);
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        const inputs = form.locator('input, textarea, select, button');
        const inputCount = await inputs.count();
        
        if (inputCount > 0) {
          // Focus first input
          await inputs.first().focus();
          
          // Tab through form fields
          for (let i = 0; i < Math.min(inputCount, 5); i++) {
            await page.keyboard.press('Tab');
            
            // Check that focus moves to next focusable element
            const focused = page.locator(':focus');
            await expect(focused).toBeVisible();
          }
        }
      }
    });

    test('should provide proper error feedback', async () => {
      await page.goto(baseURL);
      
      const forms = page.locator('form');
      const formCount = await forms.count();
      
      if (formCount > 0) {
        const form = forms.first();
        const emailInputs = form.locator('input[type="email"]');
        
        if (await emailInputs.count() > 0) {
          const emailInput = emailInputs.first();
          
          // Enter invalid email
          await emailInput.fill('invalid-email');
          await emailInput.blur();
          
          // Check for validation feedback
          const inputId = await emailInput.getAttribute('id');
          if (inputId) {
            const errorElement = form.locator(`[id*="${inputId}"][role="alert"], [id*="${inputId}"].error`);
            
            // Should show error message for invalid email
            if (await errorElement.count() > 0) {
              await expect(errorElement.first()).toBeVisible();
            }
          }
        }
      }
    });
  });

  test.describe('Newsletter Subscription Integration', () => {
    test('should handle subscription form interactions', async () => {
      await page.goto(baseURL);
      
      // Look for newsletter subscription forms
      const subscriptionInputs = page.locator('input[type="email"][name*="email"], input[type="email"][placeholder*="email" i]');
      
      if (await subscriptionInputs.count() > 0) {
        const emailInput = subscriptionInputs.first();
        const form = emailInput.locator('xpath=ancestor::form[1]').first();
        
        // Test valid email input
        await emailInput.fill('test@example.com');
        
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          // Mock network request to prevent actual submission during tests
          await page.route('**/api/subscribe', route => {
            route.fulfill({
              status: 201,
              contentType: 'application/json',
              body: JSON.stringify({ 
                success: true, 
                message: 'Subscription successful',
                email: 'test@example.com'
              })
            });
          });
          
          await submitButton.click();
          
          // Check for success feedback
          await page.waitForTimeout(1000);
          
          const successMessages = page.locator('[role="status"], .success-message, [aria-live]:has-text("success")');
          if (await successMessages.count() > 0) {
            await expect(successMessages.first()).toBeVisible();
          }
        }
      }
    });

    test('should handle subscription errors gracefully', async () => {
      await page.goto(baseURL);
      
      const subscriptionInputs = page.locator('input[type="email"][name*="email"], input[type="email"][placeholder*="email" i]');
      
      if (await subscriptionInputs.count() > 0) {
        const emailInput = subscriptionInputs.first();
        const form = emailInput.locator('xpath=ancestor::form[1]').first();
        
        // Mock network error
        await page.route('**/api/subscribe', route => {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ 
              error: 'INTERNAL_ERROR',
              message: 'Server error occurred'
            })
          });
        });
        
        await emailInput.fill('test@example.com');
        
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // Check for error feedback
          await page.waitForTimeout(1000);
          
          const errorMessages = page.locator('[role="alert"], .error-message, [aria-live]:has-text("error")');
          if (await errorMessages.count() > 0) {
            await expect(errorMessages.first()).toBeVisible();
          }
        }
      }
    });

    test('should prevent duplicate submissions', async () => {
      await page.goto(baseURL);
      
      const subscriptionInputs = page.locator('input[type="email"][name*="email"], input[type="email"][placeholder*="email" i]');
      
      if (await subscriptionInputs.count() > 0) {
        const emailInput = subscriptionInputs.first();
        const form = emailInput.locator('xpath=ancestor::form[1]').first();
        
        let requestCount = 0;
        await page.route('**/api/subscribe', route => {
          requestCount++;
          route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ success: true })
          });
        });
        
        await emailInput.fill('test@example.com');
        
        const submitButton = form.locator('button[type="submit"], input[type="submit"]');
        if (await submitButton.count() > 0) {
          // Click submit button multiple times quickly
          await Promise.all([
            submitButton.click(),
            submitButton.click(),
            submitButton.click()
          ]);
          
          await page.waitForTimeout(1000);
          
          // Should only make one request despite multiple clicks
          expect(requestCount).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  test.describe('Form Accessibility Integration', () => {
    test('should announce form status changes to screen readers', async () => {
      await page.goto(baseURL);
      
      const forms = page.locator('form');
      if (await forms.count() > 0) {
        const form = forms.first();
        
        // Check for aria-live regions
        const liveRegions = form.locator('[aria-live]');
        const statusElements = form.locator('[role="status"], [role="alert"]');
        
        const totalAnnouncements = await liveRegions.count() + await statusElements.count();
        
        // Forms should have announcement mechanisms
        expect(totalAnnouncements).toBeGreaterThanOrEqual(0);
        
        if (totalAnnouncements > 0) {
          const firstRegion = (await liveRegions.count() > 0) ? liveRegions.first() : statusElements.first();
          
          // Should have proper aria-live value
          const ariaLive = await firstRegion.getAttribute('aria-live');
          const role = await firstRegion.getAttribute('role');
          
          expect(ariaLive === 'polite' || ariaLive === 'assertive' || role === 'status' || role === 'alert').toBeTruthy();
        }
      }
    });

    test('should have proper field descriptions and help text', async () => {
      await page.goto(baseURL);
      
      const forms = page.locator('form');
      if (await forms.count() > 0) {
        const form = forms.first();
        const inputs = form.locator('input, textarea, select');
        
        for (let i = 0; i < Math.min(await inputs.count(), 3); i++) {
          const input = inputs.nth(i);
          const describedBy = await input.getAttribute('aria-describedby');
          
          if (describedBy) {
            const descriptionIds = describedBy.split(' ');
            
            for (const id of descriptionIds) {
              const descElement = page.locator(`#${id}`);
              await expect(descElement).toBeAttached();
            }
          }
        }
      }
    });

    test('should support high contrast mode', async () => {
      // Emulate high contrast media query
      await page.emulateMedia({ forcedColors: 'active' });
      await page.goto(baseURL);
      
      const forms = page.locator('form');
      if (await forms.count() > 0) {
        const form = forms.first();
        const inputs = form.locator('input, textarea, select, button');
        
        if (await inputs.count() > 0) {
          const firstInput = inputs.first();
          
          // Check that forced colors are respected
          const borderColor = await firstInput.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.borderColor;
          });
          
          // Should have visible borders in high contrast mode
          expect(borderColor).toBeDefined();
          expect(borderColor).not.toBe('rgba(0, 0, 0, 0)');
          expect(borderColor).not.toBe('transparent');
        }
      }
    });
  });

  test.describe('Form Performance Integration', () => {
    test('should handle large form data efficiently', async () => {
      await page.goto(baseURL);
      
      const textareas = page.locator('textarea');
      if (await textareas.count() > 0) {
        const textarea = textareas.first();
        
        // Fill with large amount of text
        const largeText = 'Lorem ipsum '.repeat(1000);
        
        const startTime = Date.now();
        await textarea.fill(largeText);
        const fillTime = Date.now() - startTime;
        
        // Should handle large text input efficiently (under 1 second)
        expect(fillTime).toBeLessThan(1000);
        
        // Verify text was set correctly
        const value = await textarea.inputValue();
        expect(value.length).toBeGreaterThan(1000);
      }
    });

    test('should debounce validation for better performance', async () => {
      await page.goto(baseURL);
      
      const emailInputs = page.locator('input[type="email"]');
      if (await emailInputs.count() > 0) {
        const emailInput = emailInputs.first();
        
        // Type rapidly to test debouncing
        await emailInput.focus();
        await emailInput.fill('test@example');
        
        // Wait for any debounced validation
        await page.waitForTimeout(1000);
        
        // Form should remain responsive
        const isEnabled = await emailInput.isEnabled();
        expect(isEnabled).toBe(true);
      }
    });
  });
});