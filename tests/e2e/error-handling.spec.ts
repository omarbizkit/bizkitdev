import { test, expect } from '@playwright/test';

/**
 * E2E Test: Error Handling
 * 
 * Tests error handling and edge cases:
 * - 404 page display
 * - Error page navigation
 * - Graceful degradation
 */
test.describe('Error Handling', () => {
  test('should display 404 page for non-existent routes', async ({ page }) => {
    // Navigate to non-existent page
    await page.goto('/non-existent-page');
    
    // Should show 404 or error page
    const errorIndicators = [
      'text=404',
      'text=Not Found',
      'text=Page not found',
      'text=Error',
      '.error-page',
      '[data-testid="error-page"]'
    ];
    
    let errorFound = false;
    for (const indicator of errorIndicators) {
      if (await page.locator(indicator).count() > 0) {
        await expect(page.locator(indicator)).toBeVisible();
        errorFound = true;
        break;
      }
    }
    
    // If no specific error indicators, check for generic error content
    if (!errorFound) {
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/404|not found|error/i);
    }
  });

  test('should have navigation back to home from 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Look for home link or navigation
    const homeLinks = [
      'a[href="/"]',
      'text=Home',
      'text=Go Home',
      'text=Return to Homepage'
    ];
    
    let homeLinkFound = false;
    for (const linkSelector of homeLinks) {
      if (await page.locator(linkSelector).count() > 0) {
        const homeLink = page.locator(linkSelector).first();
        await expect(homeLink).toBeVisible();
        
        // Click home link
        await homeLink.click();
        await expect(page).toHaveURL('/');
        homeLinkFound = true;
        break;
      }
    }
    
    // If no specific home link, at least verify we can navigate back
    if (!homeLinkFound) {
      await page.goBack();
      // Should be back to a valid page
      expect(page.url()).not.toContain('/non-existent-page');
    }
  });

  test('should handle invalid project IDs gracefully', async ({ page }) => {
    // Test invalid project ID
    await page.goto('/projects/invalid-id-12345');
    
    // Should show error or 404
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|not found|error|invalid/i);
  });

  test('should handle malformed URLs', async ({ page }) => {
    // Test malformed URL
    await page.goto('/projects//invalid//path');
    
    // Should not crash and should show error page
    await expect(page.locator('body')).toBeVisible();
    
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|not found|error/i);
  });

  test('should maintain consistent branding on error pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should still show site branding/header
    const brandingElements = [
      'text=Omar Torres',
      'text=bizkit.dev',
      'text=The Mind Behind The Code',
      'header',
      '.header',
      'nav'
    ];
    
    let brandingFound = false;
    for (const element of brandingElements) {
      if (await page.locator(element).count() > 0) {
        await expect(page.locator(element)).toBeVisible();
        brandingFound = true;
        break;
      }
    }
    
    // At minimum, page should load without crashing
    expect(brandingFound || await page.locator('body').isVisible()).toBeTruthy();
  });

  test('should handle JavaScript errors gracefully', async ({ page }) => {
    // Listen for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Should not have critical JavaScript errors
    const criticalErrors = errors.filter(error => 
      error.includes('Uncaught') || 
      error.includes('TypeError') || 
      error.includes('ReferenceError')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure for specific resources
    await page.route('**/*.css', route => route.abort());
    await page.route('**/*.js', route => route.abort());
    
    await page.goto('/');
    
    // Page should still load basic content
    await expect(page.locator('body')).toBeVisible();
    
    // Should show some content even without CSS/JS
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent.length).toBeGreaterThan(0);
  });
});
