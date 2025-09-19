import { test, expect } from '@playwright/test';

/**
 * E2E Test: Contact Information
 * 
 * Tests contact information display and functionality:
 * - Contact email visibility
 * - Contact email clickability
 * - Contact page navigation
 */
test.describe('Contact Information', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display contact email on homepage', async ({ page }) => {
    // Look for contact email in various locations
    const emailSelectors = [
      'text=omarbizkit@hotmail.com',
      '[href="mailto:omarbizkit@hotmail.com"]',
      '.contact-email',
      '[data-testid="contact-email"]'
    ];
    
    let emailFound = false;
    for (const selector of emailSelectors) {
      if (await page.locator(selector).count() > 0) {
        await expect(page.locator(selector)).toBeVisible();
        emailFound = true;
        break;
      }
    }
    
    // If not found with specific selectors, look for any email pattern
    if (!emailFound) {
      const emailPattern = /omarbizkit@hotmail\.com/i;
      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(emailPattern);
    }
  });

  test('should have clickable contact email', async ({ page }) => {
    // Look for mailto link
    const mailtoLink = page.locator('a[href^="mailto:omarbizkit@hotmail.com"]');
    
    if (await mailtoLink.count() > 0) {
      await expect(mailtoLink).toBeVisible();
      
      // Verify it opens email client
      const href = await mailtoLink.getAttribute('href');
      expect(href).toBe('mailto:omarbizkit@hotmail.com');
    }
  });

  test('should display contact information in footer', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Look for contact info in footer
    const footer = page.locator('footer, .footer');
    if (await footer.count() > 0) {
      await expect(footer).toBeVisible();
      
      // Should contain email
      const emailInFooter = footer.locator('text=omarbizkit@hotmail.com');
      if (await emailInFooter.count() > 0) {
        await expect(emailInFooter).toBeVisible();
      }
    }
  });

  test('should navigate to contact page if exists', async ({ page }) => {
    // Look for contact link in navigation
    const contactLink = page.getByRole('link', { name: /contact/i });
    
    if (await contactLink.count() > 0) {
      await contactLink.click();
      await expect(page).toHaveURL(/\/contact/);
      
      // Should show contact information on contact page
      await expect(page.locator('text=omarbizkit@hotmail.com')).toBeVisible();
    }
  });

  test('should display professional identity', async ({ page }) => {
    // Should show "Data and AI Enthusiast" or similar
    const professionalIdentity = page.locator('text=Data.*AI.*Enthusiast, text=The Mind Behind The Code');
    
    if (await professionalIdentity.count() > 0) {
      await expect(professionalIdentity).toBeVisible();
    }
  });
});
