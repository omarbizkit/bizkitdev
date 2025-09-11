import { test, expect } from '@playwright/test';

/**
 * E2E tests for subscription engagement flow
 * Tests the complete subscription workflow from user perspective
 * These tests MUST FAIL until the subscription feature is implemented
 */
test.describe('Subscription Engagement Flow', () => {
  const testEmail = 'test@example.com';
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Email Subscription', () => {
    test('should display subscription form on homepage', async ({ page }) => {
      // Look for subscription form
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      await expect(subscribeForm).toBeVisible();
      
      // Should have email input
      const emailInput = subscribeForm.locator('input[type="email"]');
      await expect(emailInput).toBeVisible();
      await expect(emailInput).toHaveAttribute('placeholder', /email/i);
      await expect(emailInput).toHaveAttribute('required');
      
      // Should have submit button
      const submitButton = subscribeForm.locator('button[type="submit"], input[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toContainText(/subscribe|join|notify/i);
    });

    test('should validate email format before submission', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      await expect(subscribeForm).toBeVisible();
      
      const emailInput = subscribeForm.locator('input[type="email"]');
      const submitButton = subscribeForm.locator('button[type="submit"], input[type="submit"]');
      
      // Test invalid email formats
      const invalidEmails = ['invalid', 'test@', '@domain.com', 'test..test@domain.com'];
      
      for (const invalidEmail of invalidEmails) {
        await emailInput.fill(invalidEmail);
        await submitButton.click();
        
        // Should show client-side validation error
        const validationMessage = await emailInput.evaluate(el => (el as HTMLInputElement).validationMessage);
        expect(validationMessage).toBeTruthy();
        
        // Or show custom error message
        const errorMessage = page.locator('[data-testid="email-error"], .error-message, .field-error');
        if (await errorMessage.isVisible()) {
          await expect(errorMessage).toContainText(/email|invalid|format/i);
        }
      }
    });

    test('should handle successful subscription', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      const submitButton = subscribeForm.locator('button[type="submit"], input[type="submit"]');
      
      // Fill valid email and submit
      await emailInput.fill(testEmail);
      
      // Mock the API response to avoid actual subscription
      await page.route('**/api/subscribe', route => {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            message: 'Please check your email to confirm your subscription',
            subscriber_id: '12345-67890-abcdef'
          })
        });
      });
      
      await submitButton.click();
      
      // Should show success message
      const successMessage = page.locator('[data-testid="success-message"], .success-message, .alert-success');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText(/check.*email|confirmation|subscribed/i);
      
      // Form should be disabled or hidden after successful submission
      if (await subscribeForm.isVisible()) {
        await expect(emailInput).toBeDisabled();
        await expect(submitButton).toBeDisabled();
      }
    });

    test('should handle subscription errors gracefully', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      const submitButton = subscribeForm.locator('button[type="submit"], input[type="submit"]');
      
      // Mock API error response
      await page.route('**/api/subscribe', route => {
        route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'ALREADY_SUBSCRIBED',
            message: 'This email is already subscribed'
          })
        });
      });
      
      await emailInput.fill(testEmail);
      await submitButton.click();
      
      // Should show error message
      const errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/already.*subscribed|error/i);
      
      // Form should remain usable for retry
      await expect(emailInput).toBeEnabled();
      await expect(submitButton).toBeEnabled();
    });

    test('should handle server errors', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      const submitButton = subscribeForm.locator('button[type="submit"], input[type="submit"]');
      
      // Mock server error
      await page.route('**/api/subscribe', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'INTERNAL_ERROR',
            message: 'Something went wrong. Please try again later.'
          })
        });
      });
      
      await emailInput.fill(testEmail);
      await submitButton.click();
      
      // Should show generic error message
      const errorMessage = page.locator('[data-testid="error-message"], .error-message, .alert-error');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/try again|error|something went wrong/i);
    });
  });

  test.describe('Email Confirmation Flow', () => {
    test('should handle email confirmation link', async ({ page }) => {
      // Simulate clicking confirmation link from email
      const confirmationToken = 'test-confirmation-token-12345';
      
      // Mock successful confirmation
      await page.route('**/api/subscribe/confirm*', route => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <head><title>Subscription Confirmed</title></head>
              <body>
                <h1>Subscription Confirmed</h1>
                <p>Thank you for confirming your subscription!</p>
                <a href="/">Return to Homepage</a>
              </body>
            </html>
          `
        });
      });
      
      await page.goto(`/api/subscribe/confirm?token=${confirmationToken}`);
      
      // Should show confirmation page
      await expect(page.locator('h1')).toContainText(/confirmed|success/i);
      await expect(page.getByText(/thank you|confirmed/i)).toBeVisible();
      
      // Should have link back to homepage
      const homeLink = page.getByRole('link', { name: /homepage|home/i });
      await expect(homeLink).toBeVisible();
      
      await homeLink.click();
      await expect(page).toHaveURL('/');
    });

    test('should handle invalid confirmation tokens', async ({ page }) => {
      const invalidToken = 'invalid-token-12345';
      
      // Mock invalid token response
      await page.route('**/api/subscribe/confirm*', route => {
        route.fulfill({
          status: 400,
          contentType: 'text/html',
          body: `
            <html>
              <head><title>Invalid Confirmation Link</title></head>
              <body>
                <h1>Invalid Confirmation Link</h1>
                <p>This confirmation link is invalid or has expired.</p>
                <a href="/">Return to Homepage</a>
              </body>
            </html>
          `
        });
      });
      
      await page.goto(`/api/subscribe/confirm?token=${invalidToken}`);
      
      // Should show error page
      await expect(page.locator('h1')).toContainText(/invalid|error|expired/i);
      await expect(page.getByText(/invalid.*link|expired/i)).toBeVisible();
      
      // Should have navigation back
      const homeLink = page.getByRole('link', { name: /homepage|home/i });
      await expect(homeLink).toBeVisible();
    });

    test('should handle expired confirmation tokens', async ({ page }) => {
      const expiredToken = 'expired-token-12345';
      
      // Mock expired token response
      await page.route('**/api/subscribe/confirm*', route => {
        route.fulfill({
          status: 400,
          contentType: 'text/html',
          body: `
            <html>
              <head><title>Confirmation Link Expired</title></head>
              <body>
                <h1>Confirmation Link Expired</h1>
                <p>This confirmation link has expired. Please subscribe again.</p>
                <a href="/">Return to Homepage</a>
                <a href="/#subscribe">Subscribe Again</a>
              </body>
            </html>
          `
        });
      });
      
      await page.goto(`/api/subscribe/confirm?token=${expiredToken}`);
      
      // Should show expiration message
      await expect(page.locator('h1')).toContainText(/expired/i);
      await expect(page.getByText(/expired.*subscribe again/i)).toBeVisible();
      
      // Should have option to subscribe again
      const subscribeAgainLink = page.getByRole('link', { name: /subscribe again/i });
      await expect(subscribeAgainLink).toBeVisible();
    });
  });

  test.describe('Unsubscribe Flow', () => {
    test('should handle unsubscribe link', async ({ page }) => {
      const unsubscribeToken = 'test-unsubscribe-token-12345';
      
      // Mock successful unsubscribe
      await page.route('**/api/subscribe/unsubscribe*', route => {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <html>
              <head><title>Successfully Unsubscribed</title></head>
              <body>
                <h1>Successfully Unsubscribed</h1>
                <p>You have been unsubscribed from all future updates.</p>
                <p>We're sorry to see you go!</p>
                <a href="/">Return to Homepage</a>
              </body>
            </html>
          `
        });
      });
      
      await page.goto(`/api/subscribe/unsubscribe?token=${unsubscribeToken}`);
      
      // Should show unsubscribe confirmation
      await expect(page.locator('h1')).toContainText(/unsubscribed/i);
      await expect(page.getByText(/unsubscribed.*updates/i)).toBeVisible();
      
      // Should have navigation back
      const homeLink = page.getByRole('link', { name: /homepage|home/i });
      await expect(homeLink).toBeVisible();
    });

    test('should handle invalid unsubscribe tokens', async ({ page }) => {
      const invalidToken = 'invalid-unsubscribe-token';
      
      // Mock invalid token response
      await page.route('**/api/subscribe/unsubscribe*', route => {
        route.fulfill({
          status: 404,
          contentType: 'text/html',
          body: `
            <html>
              <head><title>Invalid Unsubscribe Link</title></head>
              <body>
                <h1>Invalid Unsubscribe Link</h1>
                <p>This unsubscribe link is invalid or has already been used.</p>
                <a href="/">Return to Homepage</a>
              </body>
            </html>
          `
        });
      });
      
      await page.goto(`/api/subscribe/unsubscribe?token=${invalidToken}`);
      
      // Should show error message
      await expect(page.locator('h1')).toContainText(/invalid/i);
      await expect(page.getByText(/invalid.*link|already.*used/i)).toBeVisible();
    });
  });

  test.describe('Accessibility and UX', () => {
    test('should be keyboard accessible', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      await expect(subscribeForm).toBeVisible();
      
      // Should be able to navigate to email input via keyboard
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      
      // Keep tabbing until we reach the email input
      let attempts = 0;
      while (attempts < 10) {
        const tagName = await focusedElement.evaluate(el => el.tagName);
        const type = await focusedElement.getAttribute('type');
        
        if (tagName === 'INPUT' && type === 'email') {
          break;
        }
        
        await page.keyboard.press('Tab');
        attempts++;
      }
      
      // Should be focused on email input
      await expect(focusedElement).toHaveAttribute('type', 'email');
      
      // Should be able to type
      await page.keyboard.type(testEmail);
      await expect(focusedElement).toHaveValue(testEmail);
      
      // Should be able to submit via Enter key
      await page.keyboard.press('Enter');
      
      // Form submission should be triggered (will fail without API, which is expected)
    });

    test('should have proper ARIA labels and roles', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      const submitButton = subscribeForm.locator('button[type="submit"], input[type="submit"]');
      
      // Email input should have proper labeling
      const inputId = await emailInput.getAttribute('id');
      if (inputId) {
        const label = page.locator(`label[for="${inputId}"]`);
        await expect(label).toBeVisible();
      }
      
      // Should have aria-label or aria-labelledby
      const ariaLabel = await emailInput.getAttribute('aria-label');
      const ariaLabelledBy = await emailInput.getAttribute('aria-labelledby');
      
      expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      
      // Submit button should have descriptive text
      const buttonText = await submitButton.textContent();
      expect(buttonText?.trim().length).toBeGreaterThan(0);
    });

    test('should provide clear feedback for screen readers', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      
      // Mock error response for testing feedback
      await page.route('**/api/subscribe', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'INVALID_EMAIL',
            message: 'Please enter a valid email address'
          })
        });
      });
      
      await emailInput.fill('invalid-email');
      await subscribeForm.locator('button[type="submit"]').click();
      
      // Error message should be associated with the input
      const errorMessage = page.locator('[data-testid="error-message"], .error-message');
      if (await errorMessage.isVisible()) {
        const errorId = await errorMessage.getAttribute('id');
        if (errorId) {
          const describedBy = await emailInput.getAttribute('aria-describedby');
          expect(describedBy).toContain(errorId);
        }
        
        // Should have proper role for screen readers
        const role = await errorMessage.getAttribute('role');
        expect(['alert', 'status']).toContain(role);
      }
    });
  });

  test.describe('Security Considerations', () => {
    test('should protect against XSS in error messages', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      
      // Mock response with potential XSS payload
      await page.route('**/api/subscribe', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'XSS_ATTEMPT',
            message: '<script>alert("xss")</script>Invalid email'
          })
        });
      });
      
      await emailInput.fill('test@example.com');
      await subscribeForm.locator('button[type="submit"]').click();
      
      // Error message should be escaped
      const errorMessage = page.locator('[data-testid="error-message"], .error-message');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        expect(errorText).not.toContain('<script>');
        
        // Should not execute JavaScript
        const pageContent = await page.content();
        expect(pageContent).not.toMatch(/<script[^>]*>alert\("xss"\)/);
      }
    });

    test('should implement rate limiting feedback', async ({ page }) => {
      const subscribeForm = page.locator('[data-testid="subscribe-form"], form[action*="subscribe"]');
      const emailInput = subscribeForm.locator('input[type="email"]');
      const submitButton = subscribeForm.locator('button[type="submit"]');
      
      // Mock rate limit response
      await page.route('**/api/subscribe', route => {
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.'
          })
        });
      });
      
      await emailInput.fill('test@example.com');
      await submitButton.click();
      
      // Should show rate limit message
      const errorMessage = page.locator('[data-testid="error-message"], .error-message');
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText(/too many requests|try again later/i);
      
      // Button should be disabled temporarily
      await expect(submitButton).toBeDisabled();
    });
  });
});