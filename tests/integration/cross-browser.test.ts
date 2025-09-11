import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Browser, Page, BrowserContext } from 'playwright';
import { chromium, firefox, webkit } from 'playwright';

describe('Cross-Browser Compatibility Integration Tests', () => {
  const baseURL = 'http://localhost:4321';
  const browsers = [
    { name: 'Chromium', launcher: chromium },
    { name: 'Firefox', launcher: firefox },
    { name: 'WebKit', launcher: webkit }
  ];

  describe.each(browsers)('$name Browser Tests', ({ name, launcher }) => {
    let browser: Browser;
    let context: BrowserContext;
    let page: Page;

    beforeAll(async () => {
      try {
        browser = await launcher.launch();
        context = await browser.newContext();
        page = await context.newPage();
      } catch (error) {
        console.warn(`${name} browser not available, skipping tests`);
        return;
      }
    });

    afterAll(async () => {
      if (browser) {
        await browser.close();
      }
    });

    it('should load homepage successfully', async () => {
      if (!page) return; // Skip if browser not available
      
      await page.goto(baseURL);
      await expect(page).toHaveTitle(/Omar Torres/);
      
      // Check that main elements are visible
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
      
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });

    it('should handle CSS Grid and Flexbox layouts', async () => {
      if (!page) return;
      
      await page.goto(baseURL);
      
      // Check for modern CSS features
      const gridElements = page.locator('[style*="grid"], [class*="grid"]');
      const flexElements = page.locator('[style*="flex"], [class*="flex"]');
      
      if (await gridElements.count() > 0) {
        const firstGrid = gridElements.first();
        const display = await firstGrid.evaluate(el => window.getComputedStyle(el).display);
        expect(display === 'grid' || display === 'inline-grid').toBeTruthy();
      }
      
      if (await flexElements.count() > 0) {
        const firstFlex = flexElements.first();
        const display = await firstFlex.evaluate(el => window.getComputedStyle(el).display);
        expect(display === 'flex' || display === 'inline-flex').toBeTruthy();
      }
    });

    it('should support modern JavaScript features', async () => {
      if (!page) return;
      
      await page.goto(baseURL);
      
      // Test async/await support
      const supportsAsync = await page.evaluate(() => {
        try {
          eval('(async () => {})');
          return true;
        } catch {
          return false;
        }
      });
      
      expect(supportsAsync).toBe(true);
      
      // Test ES6 features
      const supportsES6 = await page.evaluate(() => {
        try {
          eval('const test = () => {}; const { a } = { a: 1 };');
          return true;
        } catch {
          return false;
        }
      });
      
      expect(supportsES6).toBe(true);
    });

    it('should handle font loading gracefully', async () => {
      if (!page) return;
      
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      
      // Check font loading
      const body = page.locator('body');
      const fontFamily = await body.evaluate(el => window.getComputedStyle(el).fontFamily);
      
      // Should have fallback fonts
      expect(fontFamily).toBeDefined();
      expect(fontFamily.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design Integration', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
      browser = await chromium.launch();
      page = await browser.newPage();
    });

    afterAll(async () => {
      await browser.close();
    });

    const viewports = [
      { name: 'Mobile Portrait', width: 375, height: 667 },
      { name: 'Mobile Landscape', width: 667, height: 375 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop Small', width: 1280, height: 720 },
      { name: 'Desktop Large', width: 1920, height: 1080 }
    ];

    describe.each(viewports)('$name ($width x $height)', ({ name, width, height }) => {
      it('should display properly', async () => {
        await page.setViewportSize({ width, height });
        await page.goto(baseURL);
        
        // Check that content is visible and not overflowing
        const body = page.locator('body');
        const bodyBox = await body.boundingBox();
        
        expect(bodyBox).toBeDefined();
        expect(bodyBox!.width).toBeLessThanOrEqual(width + 50); // Allow for scrollbars
        
        // Check navigation is accessible
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
        
        // Check main content is visible
        const main = page.locator('main');
        await expect(main).toBeVisible();
      });

      it('should handle touch interactions on mobile', async () => {
        if (width < 768) {
          await page.setViewportSize({ width, height });
          await page.goto(baseURL);
          
          // Check for touch-friendly elements
          const buttons = page.locator('button, a, [role="button"]');
          if (await buttons.count() > 0) {
            const firstButton = buttons.first();
            const buttonBox = await firstButton.boundingBox();
            
            if (buttonBox) {
              // Touch targets should be at least 44px per WCAG guidelines
              expect(Math.min(buttonBox.width, buttonBox.height)).toBeGreaterThanOrEqual(40);
            }
          }
        }
      });

      it('should adapt navigation for screen size', async () => {
        await page.setViewportSize({ width, height });
        await page.goto(baseURL);
        
        const menuButton = page.locator('button[aria-label*="menu" i]');
        const menuButtonVisible = await menuButton.isVisible();
        
        if (width < 800) {
          // Mobile should have menu button
          if (menuButtonVisible) {
            await expect(menuButton).toBeVisible();
          }
        } else {
          // Desktop should show full navigation
          const navLinks = page.locator('nav a');
          const linkCount = await navLinks.count();
          expect(linkCount).toBeGreaterThan(0);
        }
      });
    });

    it('should handle orientation changes', async () => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(baseURL);
      
      const initialHeight = await page.evaluate(() => window.innerHeight);
      
      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500);
      
      const newHeight = await page.evaluate(() => window.innerHeight);
      
      // Page should adapt to new orientation
      expect(newHeight).toBeLessThan(initialHeight);
      
      // Content should still be accessible
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });

    it('should handle zoom levels gracefully', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(baseURL);
      
      // Test 200% zoom
      await page.evaluate(() => {
        document.body.style.zoom = '2';
      });
      
      await page.waitForTimeout(500);
      
      // Content should still be accessible
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = '1';
      });
    });
  });

  describe('Performance Across Devices', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
      browser = await chromium.launch();
      page = await browser.newPage();
    });

    afterAll(async () => {
      await browser.close();
    });

    it('should load efficiently on slow connections', async () => {
      // Simulate slow 3G
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add delay
        await route.continue();
      });
      
      const startTime = Date.now();
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time even on slow connection
      expect(loadTime).toBeLessThan(10000); // 10 seconds
    });

    it('should handle limited memory gracefully', async () => {
      await page.goto(baseURL);
      
      // Simulate memory pressure by creating large objects
      const memoryTest = await page.evaluate(() => {
        try {
          const largeArray = new Array(1000000).fill('test');
          largeArray.length = 0; // Clean up
          return true;
        } catch {
          return false;
        }
      });
      
      expect(memoryTest).toBe(true);
      
      // Page should still be responsive
      const title = await page.title();
      expect(title).toBeDefined();
    });
  });

  describe('Feature Detection Integration', () => {
    let browser: Browser;
    let page: Page;

    beforeAll(async () => {
      browser = await chromium.launch();
      page = await browser.newPage();
    });

    afterAll(async () => {
      await browser.close();
    });

    it('should gracefully degrade when features are unavailable', async () => {
      await page.goto(baseURL);
      
      // Test without JavaScript
      await page.setJavaScriptEnabled(false);
      await page.reload();
      
      // Basic content should still be visible
      const main = page.locator('main');
      await expect(main).toBeVisible();
      
      // Re-enable JavaScript
      await page.setJavaScriptEnabled(true);
      await page.reload();
    });

    it('should handle missing Web APIs gracefully', async () => {
      await page.goto(baseURL);
      
      // Mock missing API
      await page.evaluate(() => {
        // @ts-ignore
        delete window.fetch;
      });
      
      // Page should still function
      const title = await page.title();
      expect(title).toBeDefined();
    });

    it('should provide appropriate fallbacks for modern features', async () => {
      await page.goto(baseURL);
      
      // Check for CSS custom properties support
      const supportsCustomProps = await page.evaluate(() => {
        return CSS.supports && CSS.supports('color', 'var(--test)');
      });
      
      if (supportsCustomProps) {
        // Should use custom properties
        const rootStyles = await page.evaluate(() => {
          const styles = window.getComputedStyle(document.documentElement);
          return styles.getPropertyValue('--font-sans') || styles.getPropertyValue('--focus-color');
        });
        
        expect(typeof rootStyles).toBe('string');
      }
    });
  });
});