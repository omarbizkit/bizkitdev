/**
 * T012: Environment variable consistency testing between local and CI
 * This helps validate that the environment setup matches what would cause the subscription form issue
 */

import { test, expect } from '@playwright/test';

/**
 * TEST STRATEGY: Validate environment variables and configuration that could affect
 * subscription form loading/visibility in E2E tests
 */
test.describe('Environment Variable Consistency Testing', () => {
  test.describe('Critical Environment Variables', () => {
    test('should validate NODE_ENV consistency impacts page loading', async ({ page }) => {
      // Test what NODE_ENV causes different behavior
      // CI typically sets NODE_ENV=production, local might be development
      await page.goto('http://localhost:4321');

      // Check if the environment affects available features
      const isProduction = process.env.NODE_ENV === 'production';

      try {
        // This form might only exist in development mode or with specific env vars
        const subscribeForm = page.locator('data-testid=hero-subscribe-form');
        const isFormVisible = await subscribeForm.isVisible().catch(() => false);

        // Log environment context for debugging
        console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
        console.log(`CI flag: ${process.env.CI || 'false'}`);
        console.log(`Subscribe form visible: ${isFormVisible}`);

        if (!isFormVisible) {
          console.log('❌ SUSPECTED ROOT CAUSE: Environment configuration preventing form rendering');

          if (isProduction && !process.env.CI) {
            console.log('ISSUE DETECTED: Production mode locally may disable development-only components');
          }

          if (process.env.CI === 'true' && !isProduction) {
            console.log('ISSUE DETECTED: CI environment not matching expected configuration');
          }
        }

        // Document the findings
        expect(isFormVisible).toBe(true); // This test will fail, revealing the issue

      } catch (error) {
        console.error('❌ Environment configuration error:', error.message);
        console.error('This represents the CI E2E workflow failure scenario');
        throw error;
      }
    });

    test('should validate Supabase configuration affects component visibility', async ({ page }) => {
      // Test if Supabase API key configuration affects subscription form
      const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

      console.log('Supabase URL configured:', !!supabaseUrl);
      console.log('Supabase key configured:', !!supabaseKey);

      await page.goto('http://localhost:4321');

      try {
        // The subscription form might depend on Supabase for validation
        const form = page.locator('data-testid=hero-subscribe-form');
        await form.waitFor({ state: 'visible', timeout: 5000 });

        console.log('✅ Supabase configuration valid - form loads');

        // Test the form actually works by filling it
        const emailInput = form.locator('input[type="email"]');
        await emailInput.fill('test-validation@example.com');

        console.log('✅ Form interaction successful with current configuration');

      } catch (timeoutError) {
        console.error('❌ SUSPECTED CAUSE: Supabase configuration issue');

        if (!supabaseUrl || !supabaseKey) {
          console.error('PROBLEM: Missing Supabase environment variables');
          console.error(`URL: ${supabaseUrl ? 'present' : 'MISSING'}`);
          console.error(`Key: ${supabaseKey ? 'present' : 'MISSING'}`);
        }

        // This would cause the E2E failure in CI if environment vars are missing
        expect(supabaseUrl).toBeTruthy();
        expect(supabaseKey).toBeTruthy();
        throw new Error('Supabase configuration issue detected - likely CI failure cause');
      }
    });

    test('should validate browser test configuration consistency', async ({ page, browserName }) => {
      // Test if browser-specific configuration affects form visibility
      const testConfig = {
        browser: browserName || 'unknown',
        headless: process.env.HEADLESS === 'true' || !process.env.CI,
        baseURL: process.env.TEST_BASE_URL || 'http://localhost:4321'
      };

      console.log('Browser test configuration:', testConfig);

      await page.goto(testConfig.baseURL);

      try {
        const form = page.locator('data-testid=hero-subscribe-form');

        // Different browsers might have different timing/success rates
        await form.waitFor({ state: 'visible', timeout: 10000 });

        console.log(`✅ Browser ${browserName} - subscription form visible`);

        // Validate form elements are accessible
        const emailField = form.locator('input[type="email"]');
        const submitButton = form.locator('button[type="submit"]');

        expect(await emailField.isVisible()).toBe(true);
        expect(await submitButton.isVisible()).toBe(true);

      } catch (error) {
        console.error(`❌ Browser ${browserName} configuration issue:`, error.message);
        console.error('SUSPECTED CAUSE: Browser-specific rendering or timing differences');

        if (browserName === 'webkit') {
          console.log('NOTE: WebKit often has different form rendering behavior');
        }

        // Document browser-specific failures
        throw error;
      }
    });
  });

  test.describe('Environment Drift Detection', () => {
    test('should detect environment differences that break E2E tests', async ({ page }) => {
      // Simulate environment comparison between local and CI
      const localEnv = {
        node_version: process.version,
        ci: process.env.CI || 'false',
        base_url: process.env.TEST_BASE_URL || 'http://localhost:4321',
        headless: process.env.HEADLESS || 'false'
      };

      // Simulate what CI environment would look like
      const ciEnv = {
        node_version: 'v18.19.0', // Common CI Node version
        ci: 'true',
        base_url: 'http://127.0.0.1:4321', // Different URL format sometimes
        headless: 'true'
      };

      const differences = [];

      if (localEnv.node_version !== ciEnv.node_version) {
        differences.push(`Node version: local=${localEnv.node_version}, CI=${ciEnv.node_version}`);
      }

      if (localEnv.ci !== ciEnv.ci) {
        differences.push(`CI flag: local=${localEnv.ci}, CI=${ciEnv.ci}`);
      }

      if (localEnv.base_url !== ciEnv.base_url) {
        differences.push(`Base URL: local=${localEnv.base_url}, CI=${ciEnv.base_url}`);
      }

      if (localEnv.headless !== ciEnv.headless) {
        differences.push(`Headless: local=${localEnv.headless}, CI=${ciEnv.headless}`);
      }

      console.log('Environment comparison:');
      Object.entries(localEnv).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });

      if (differences.length > 0) {
        console.log('⚠️ ENVIRONMENT DRIFT DETECTED:');
        differences.forEach(diff => console.log(`  - ${diff}`));
        console.log('These differences could cause E2E test failures in CI');
      }

      await page.goto('http://localhost:4321');

      // Test if these environment differences actually affect the form
      const formExists = await page.locator('data-testid=hero-subscribe-form').isVisible().catch(() => false);

      if (!formExists && differences.some(d => d.includes('base_url') || d.includes('CI'))) {
        console.error('❌ CRITICAL: Environment drift causes form loading failure');
        console.error('This is likely the root cause of CI E2E failures');

        // Fail test to reveal the environment issue
        expect(formExists).toBe(true);
      }
    });
  });

  test.describe('Performance and Timing Validation', () => {
    test('should validate timing that could cause timeout failures', async ({ page }) => {
      const startTime = Date.now();

      await page.goto('http://localhost:4321');

      const navigationTime = Date.now() - startTime;
      console.log(`Page load time: ${navigationTime}ms`);

      // Check server response time could affect test timing
      try {
        const form = page.locator('data-testid=hero-subscribe-form');

        // Use timing that matches our Playwright configuration
        await form.waitFor({ state: 'visible', timeout: 10000 });

        const formLoadTime = Date.now() - startTime;
        console.log(`Form load time: ${formLoadTime}ms`);

        if (formLoadTime > 5000) {
          console.log('⚠️ SLOW LOAD: Form takes >5s - could timeout in CI with 30s limit');
        }

      } catch (timeout) {
        const failTime = Date.now() - startTime;
        console.error(`❌ FORM TIMEOUT after ${failTime}ms`);
        console.error('SUSPECTED CAUSE: Slow server response or rendering issues');
        console.error('This represents the CI E2E workflow failure');

        throw timeout;
      }
    });
  });
});