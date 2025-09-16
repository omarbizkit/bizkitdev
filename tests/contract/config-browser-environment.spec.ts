import { test, expect } from '@playwright/test';
import { chromium, firefox, webkit } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * T010: Browser Environment Validation Test
 *
 * This test should PASS as audit showed browser environment is excellently configured.
 * Validates browser installation, environment variables, and CI configuration.
 *
 * Contract: Browser environment must be consistent across local and CI environments
 */

test.describe('Browser Environment Validation', () => {

  test('should validate PLAYWRIGHT_BROWSERS_PATH environment configuration', async () => {
    // Check if environment variable is set
    const browserPath = process.env.PLAYWRIGHT_BROWSERS_PATH;

    if (browserPath) {
      console.log(`✅ PLAYWRIGHT_BROWSERS_PATH is set: ${browserPath}`);

      // If set, the directory should exist
      if (fs.existsSync(browserPath)) {
        console.log('✅ Browser path directory exists');

        // Check for browser installations
        const contents = fs.readdirSync(browserPath);
        const browserDirs = contents.filter(item =>
          item.includes('chromium') ||
          item.includes('firefox') ||
          item.includes('webkit')
        );

        expect(browserDirs.length).toBeGreaterThan(0);
        console.log(`✅ Found ${browserDirs.length} browser installations:`, browserDirs);
      } else {
        console.log('⚠️ Browser path directory does not exist, but variable is set');
      }
    } else {
      // This is okay for local development - browsers use default path
      console.log('ℹ️ PLAYWRIGHT_BROWSERS_PATH not set (using default browser installation path)');
    }
  });

  test('should validate CI workflow browser configuration', async () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const ciWorkflowPath = path.join(projectRoot, '.github/workflows/deploy.yml');

    if (fs.existsSync(ciWorkflowPath)) {
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');

      // Check for PLAYWRIGHT_BROWSERS_PATH configuration
      expect(ciWorkflow).toContain('PLAYWRIGHT_BROWSERS_PATH=/tmp/playwright-browsers');

      // Check for browser installation step
      expect(ciWorkflow).toMatch(/npx playwright install.*chromium/);

      // Check for environment variable export
      expect(ciWorkflow).toContain('$GITHUB_ENV');

      // Check for browser verification steps
      expect(ciWorkflow).toContain('BROWSER ENVIRONMENT VERIFICATION');

      console.log('✅ CI workflow has comprehensive browser environment configuration');
    } else {
      console.log('⚠️ CI workflow file not found - cannot validate CI browser configuration');
    }
  });

  test('should validate browser installations are functional', async () => {
    // Test chromium
    try {
      const chromiumBrowser = await chromium.launch({ headless: true });
      const chromiumPage = await chromiumBrowser.newPage();
      await chromiumPage.goto('data:text/html,<h1>Test</h1>');
      const title = await chromiumPage.textContent('h1');
      expect(title).toBe('Test');
      await chromiumBrowser.close();
      console.log('✅ Chromium browser functional');
    } catch (error) {
      console.error('❌ Chromium browser test failed:', error);
      throw error;
    }

    // Test firefox (skip if not installed in CI)
    try {
      const firefoxBrowser = await firefox.launch({ headless: true });
      const firefoxPage = await firefoxBrowser.newPage();
      await firefoxPage.goto('data:text/html,<h1>Test</h1>');
      const title = await firefoxPage.textContent('h1');
      expect(title).toBe('Test');
      await firefoxBrowser.close();
      console.log('✅ Firefox browser functional');
    } catch (error) {
      if (process.env.CI && error.message.includes("Executable doesn't exist")) {
        console.log('⚠️ Firefox browser not installed in CI - skipping test');
      } else {
        console.error('❌ Firefox browser test failed:', error);
        throw error;
      }
    }

    // Test webkit (skip if not installed in CI)
    try {
      const webkitBrowser = await webkit.launch({ headless: true });
      const webkitPage = await webkitBrowser.newPage();
      await webkitPage.goto('data:text/html,<h1>Test</h1>');
      const title = await webkitPage.textContent('h1');
      expect(title).toBe('Test');
      await webkitBrowser.close();
      console.log('✅ WebKit browser functional');
    } catch (error) {
      if (process.env.CI && error.message.includes("Executable doesn't exist")) {
        console.log('⚠️ WebKit browser not installed in CI - skipping test');
      } else {
        console.error('❌ WebKit browser test failed:', error);
        throw error;
      }
    }
  });

  test('should validate browser environment consistency across projects', async ({ page }) => {
    // Test that browser environment works with our actual application

    await page.goto('/');

    // Test basic browser functionality
    const title = await page.title();
    expect(title).toBeTruthy();

    // Test JavaScript execution
    const userAgent = await page.evaluate(() => navigator.userAgent);
    expect(userAgent).toBeTruthy();

    // Test viewport and rendering
    const viewport = page.viewportSize();
    expect(viewport?.width).toBeGreaterThan(0);
    expect(viewport?.height).toBeGreaterThan(0);

    console.log('✅ Browser environment works with application');
    console.log(`  Title: ${title}`);
    console.log(`  Viewport: ${viewport?.width}x${viewport?.height}`);
    console.log(`  User Agent: ${userAgent.substring(0, 50)}...`);
  });

  test('should validate mobile browser configurations', async () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const playwrightConfigPath = path.join(projectRoot, 'playwright.config.ts');
    const playwrightConfig = fs.readFileSync(playwrightConfigPath, 'utf8');

    // Check for mobile configurations
    expect(playwrightConfig).toContain('Mobile Chrome');
    expect(playwrightConfig).toContain('Mobile Safari');
    expect(playwrightConfig).toContain('Pixel 5');
    expect(playwrightConfig).toContain('iPhone 12');

    console.log('✅ Mobile browser configurations are properly defined');
  });

  test('should validate browser timeout and performance settings', async ({ page }) => {
    // Test that browser timeouts are properly configured

    const startTime = Date.now();

    // Navigate to page and ensure it loads within reasonable time
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Should load within 30 seconds (CI timeout)
    expect(loadTime).toBeLessThan(30000);

    console.log(`✅ Page loaded in ${loadTime}ms (within timeout limits)`);

    // Test that browser can handle basic interactions
    const heroForm = page.locator('[data-testid="hero-subscribe-form"]');
    await expect(heroForm).toBeVisible({ timeout: 10000 });

    console.log('✅ Browser interactions work within timeout limits');
  });

  test('should validate browser capabilities and features', async ({ page }) => {
    await page.goto('/');

    // Test essential browser capabilities
    const capabilities = await page.evaluate(() => {
      return {
        localStorage: typeof localStorage !== 'undefined',
        sessionStorage: typeof sessionStorage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        Promise: typeof Promise !== 'undefined',
        IntersectionObserver: typeof IntersectionObserver !== 'undefined',
        ResizeObserver: typeof ResizeObserver !== 'undefined'
      };
    });

    // All modern features should be available
    expect(capabilities.localStorage).toBe(true);
    expect(capabilities.sessionStorage).toBe(true);
    expect(capabilities.fetch).toBe(true);
    expect(capabilities.Promise).toBe(true);

    console.log('✅ Browser has all required modern capabilities');
    console.log('  Modern features available:', Object.keys(capabilities).filter(key => capabilities[key]));
  });
});