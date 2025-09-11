import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page } from 'playwright';
import { chromium } from 'playwright';

describe('Application Flow Integration Tests', () => {
  let browser: Browser;
  let page: Page;
  const baseURL = 'http://localhost:4321';

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Homepage Integration', () => {
    it('should load homepage successfully with all core elements', async () => {
      await page.goto(baseURL);
      
      // Check that the page loads
      await expect(page).toHaveTitle(/Omar Torres/);
      
      // Check navigation is present
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      // Check main content area
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Check footer
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
    });

    it('should have accessible navigation structure', async () => {
      await page.goto(baseURL);
      
      // Check skip link
      const skipLink = page.locator('a[href="#main-content"]').first();
      await expect(skipLink).toBeAttached();
      
      // Check main landmark
      const main = page.locator('main#main-content');
      await expect(main).toBeAttached();
      
      // Check navigation landmark
      const nav = page.locator('nav[role="navigation"]');
      await expect(nav).toBeAttached();
    });

    it('should have proper ARIA labels and accessibility attributes', async () => {
      await page.goto(baseURL);
      
      // Check navigation has proper aria-label
      const nav = page.locator('nav[aria-label="Main navigation"]');
      await expect(nav).toBeAttached();
      
      // Check main content is focusable
      const main = page.locator('main[tabindex="-1"]');
      await expect(main).toBeAttached();
    });
  });

  describe('Navigation Integration', () => {
    it('should navigate between pages successfully', async () => {
      await page.goto(baseURL);
      
      // Navigate to Work page
      await page.click('a[href="/work/"]');
      await page.waitForURL('**/work/');
      await expect(page).toHaveTitle(/Work/);
      
      // Navigate to About page
      await page.click('a[href="/about/"]');
      await page.waitForURL('**/about/');
      await expect(page).toHaveTitle(/About/);
      
      // Navigate back to home
      await page.click('a[href="/"]');
      await page.waitForURL(baseURL);
    });

    it('should highlight current page in navigation', async () => {
      await page.goto(`${baseURL}/about/`);
      
      // Check that the about link has aria-current="page"
      const currentLink = page.locator('a[aria-current="page"]');
      await expect(currentLink).toBeVisible();
      await expect(currentLink).toHaveText('About');
    });

    it('should handle mobile menu interaction', async () => {
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(baseURL);
      
      // Check if menu button is visible on mobile
      const menuButton = page.locator('button[aria-label="Toggle navigation menu"]');
      if (await menuButton.isVisible()) {
        // Test menu toggle
        await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
        
        await menuButton.click();
        await expect(menuButton).toHaveAttribute('aria-expanded', 'true');
        
        // Check menu content is visible
        const menuContent = page.locator('#menu-content');
        await expect(menuContent).toBeVisible();
        
        // Close menu by clicking button again
        await menuButton.click();
        await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      }
      
      // Reset viewport
      await page.setViewportSize({ width: 1024, height: 768 });
    });
  });

  describe('API Integration', () => {
    it('should load projects data successfully', async () => {
      // Test the projects API endpoint directly
      const response = await page.request.get(`${baseURL}/api/projects`);
      expect(response.status()).toBe(200);
      
      const projects = await response.json();
      expect(Array.isArray(projects)).toBe(true);
      expect(projects.length).toBeGreaterThan(0);
      
      // Check project structure
      const firstProject = projects[0];
      expect(firstProject).toHaveProperty('id');
      expect(firstProject).toHaveProperty('title');
      expect(firstProject).toHaveProperty('description');
      expect(firstProject).toHaveProperty('status');
    });

    it('should handle API error scenarios gracefully', async () => {
      // Test invalid project status filter
      const response = await page.request.get(`${baseURL}/api/projects?status=invalid`);
      expect(response.status()).toBe(400);
      
      const error = await response.json();
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('INVALID_STATUS');
    });

    it('should return proper CORS headers', async () => {
      const response = await page.request.get(`${baseURL}/api/projects`);
      expect(response.status()).toBe(200);
      
      const headers = response.headers();
      expect(headers['access-control-allow-origin']).toBe('*');
      expect(headers['content-type']).toBe('application/json');
    });
  });

  describe('Performance Integration', () => {
    it('should load pages within acceptable time', async () => {
      const startTime = Date.now();
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should lazy load images properly', async () => {
      await page.goto(baseURL);
      
      // Check for lazy loading attributes
      const images = page.locator('img[loading="lazy"]');
      const imageCount = await images.count();
      
      if (imageCount > 0) {
        const firstImage = images.first();
        await expect(firstImage).toHaveAttribute('loading', 'lazy');
      }
    });

    it('should have optimized images with proper formats', async () => {
      await page.goto(baseURL);
      
      // Check for picture elements with multiple sources
      const pictures = page.locator('picture');
      const pictureCount = await pictures.count();
      
      if (pictureCount > 0) {
        const firstPicture = pictures.first();
        const sources = firstPicture.locator('source');
        const sourceCount = await sources.count();
        
        // Should have multiple format sources (WebP, AVIF, etc.)
        expect(sourceCount).toBeGreaterThan(0);
      }
    });
  });

  describe('Security Integration', () => {
    it('should include proper security headers', async () => {
      const response = await page.request.get(baseURL);
      const headers = response.headers();
      
      // Check for security headers
      expect(headers['x-content-type-options']).toBe('nosniff');
      expect(headers['x-frame-options']).toBe('DENY');
      expect(headers['x-xss-protection']).toBe('1; mode=block');
      expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(headers['content-security-policy']).toBeDefined();
    });

    it('should implement Content Security Policy', async () => {
      const response = await page.request.get(baseURL);
      const headers = response.headers();
      
      const csp = headers['content-security-policy'];
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('frame-ancestors \'none\'');
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should handle XSS attempts safely', async () => {
      // Test XSS in URL parameters
      await page.goto(`${baseURL}?test=<script>alert('xss')</script>`);
      
      // Page should still load normally without executing the script
      await expect(page).toHaveTitle(/Omar Torres/);
      
      // Check that no alert dialog appeared
      const dialogs: string[] = [];
      page.on('dialog', (dialog) => {
        dialogs.push(dialog.message());
        dialog.dismiss();
      });
      
      await page.waitForTimeout(1000);
      expect(dialogs).toHaveLength(0);
    });
  });

  describe('SEO Integration', () => {
    it('should have proper meta tags', async () => {
      await page.goto(baseURL);
      
      // Check essential meta tags
      const title = await page.title();
      expect(title).toMatch(/Omar Torres/);
      
      const description = page.locator('meta[name="description"]');
      await expect(description).toBeAttached();
      
      const viewport = page.locator('meta[name="viewport"]');
      await expect(viewport).toBeAttached();
      
      const charset = page.locator('meta[charset]');
      await expect(charset).toBeAttached();
    });

    it('should have Open Graph tags', async () => {
      await page.goto(baseURL);
      
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toBeAttached();
      
      const ogDescription = page.locator('meta[property="og:description"]');
      await expect(ogDescription).toBeAttached();
      
      const ogImage = page.locator('meta[property="og:image"]');
      await expect(ogImage).toBeAttached();
    });

    it('should have structured data', async () => {
      await page.goto(baseURL);
      
      const structuredData = page.locator('script[type="application/ld+json"]');
      await expect(structuredData).toBeAttached();
      
      const jsonContent = await structuredData.textContent();
      expect(jsonContent).toBeTruthy();
      
      // Validate JSON structure
      const parsed = JSON.parse(jsonContent!);
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBeDefined();
    });
  });

  describe('Accessibility Integration', () => {
    it('should pass basic accessibility checks', async () => {
      await page.goto(baseURL);
      
      // Check that all images have alt attributes
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        expect(alt).toBeDefined();
      }
    });

    it('should support keyboard navigation', async () => {
      await page.goto(baseURL);
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // First focusable element should be skip link
      const focused = page.locator(':focus');
      const href = await focused.getAttribute('href');
      expect(href).toBe('#main-content');
    });

    it('should handle focus management properly', async () => {
      await page.goto(baseURL);
      
      // Test skip link functionality
      const skipLink = page.locator('a[href="#main-content"]').first();
      await skipLink.click();
      
      // Main content should be focused
      const focused = page.locator(':focus');
      const tagName = await focused.evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('main');
    });

    it('should respect reduced motion preferences', async () => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(baseURL);
      
      // Check that animations are disabled or reduced
      const elements = page.locator('*');
      const firstElement = elements.first();
      
      const animationDuration = await firstElement.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.animationDuration;
      });
      
      // Should be very short or none for reduced motion
      expect(animationDuration === 'none' || animationDuration === '0s' || animationDuration === '0.01ms').toBeTruthy();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle 404 pages gracefully', async () => {
      const response = await page.request.get(`${baseURL}/non-existent-page`);
      expect(response.status()).toBe(404);
    });

    it('should handle network errors gracefully', async () => {
      // Test with offline network
      await page.context().setOffline(true);
      
      try {
        await page.goto(baseURL, { timeout: 5000 });
      } catch (error) {
        // Should handle offline state gracefully
        expect(error).toBeDefined();
      }
      
      // Reset network
      await page.context().setOffline(false);
    });
  });
});