import { test, expect } from '@playwright/test';

/**
 * E2E Test: Mobile Responsive Design
 * 
 * Tests mobile responsiveness and functionality:
 * - Mobile viewport rendering
 * - Mobile navigation
 * - Touch interactions
 */
test.describe('Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
  });

  test('should display correctly on mobile viewport', async ({ page }) => {
    // Hero section should be visible (use more specific selector)
    const mainHeading = page.locator('h1').filter({ hasText: /The Mind Behind The Code|Omar Torres/i });
    await expect(mainHeading).toBeVisible();
    
    // Project grid should be visible
    await expect(page.locator('[data-testid="project-grid"], .project-grid')).toBeVisible();
  });

  test('should have mobile-friendly navigation', async ({ page }) => {
    // Look for mobile menu button
    const mobileMenuButton = page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu"]');
    
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible();
      
      // Click mobile menu
      await mobileMenuButton.click();
      
      // Should show navigation links
      const navLinks = page.locator('nav a, .nav a');
      await expect(navLinks.first()).toBeVisible();
    } else {
      // If no mobile menu, regular navigation should work
      const navLinks = page.locator('nav a, .nav a');
      if (await navLinks.count() > 0) {
        await expect(navLinks.first()).toBeVisible();
      }
    }
  });

  test('should have touch-friendly project cards', async ({ page }) => {
    // Project cards should be visible and clickable
    const projectCards = page.locator('[data-testid="project-card"], .project-card');
    
    if (await projectCards.count() > 0) {
      const firstCard = projectCards.first();
      await expect(firstCard).toBeVisible();
      
      // Should be clickable (test hover state)
      await firstCard.hover();
      
      // Card should have proper touch target size (minimum 44px)
      const cardBox = await firstCard.boundingBox();
      if (cardBox) {
        expect(cardBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should display subscription form on mobile', async ({ page }) => {
    // Look for subscription form
    const subscriptionForm = page.locator('[data-testid="hero-subscribe-form"], form[action*="subscribe"]');
    
    if (await subscriptionForm.count() > 0) {
      await expect(subscriptionForm).toBeVisible();
      
      // Email input should be visible and usable
      const emailInput = subscriptionForm.locator('input[type="email"]');
      if (await emailInput.count() > 0) {
        await expect(emailInput).toBeVisible();
        
        // Should be able to type in email input
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');
      }
    }
  });

  test('should handle mobile scrolling', async ({ page }) => {
    // Test vertical scrolling
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    // Page should still be functional after scrolling
    await expect(page.locator('body')).toBeVisible();
    
    // Test scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Hero section should still be visible
    const mainHeading = page.locator('h1').filter({ hasText: /The Mind Behind The Code|Omar Torres/i });
    await expect(mainHeading).toBeVisible();
  });

  test('should maintain text readability on mobile', async ({ page }) => {
    // Text should be readable (not too small)
    const mainText = page.locator('p, h1, h2, h3');
    
    if (await mainText.count() > 0) {
      const firstText = mainText.first();
      await expect(firstText).toBeVisible();
      
      // Check computed font size (should be at least 14px for readability)
      const fontSize = await firstText.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return parseFloat(computed.fontSize);
      });
      
      expect(fontSize).toBeGreaterThanOrEqual(14);
    }
  });
});
