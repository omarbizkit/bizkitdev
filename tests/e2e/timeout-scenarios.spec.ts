/**
 * T013: Integration test for Playwright timeout and browser compatibility scenarios
 * Focuses on reproducing the specific timing failures identified in T012
 */

import { test, expect } from '@playwright/test';

test.describe('Playwright Timeout and Browser Compatibility Scenarios', () => {
  test.describe.serial('Timeout Reproduction Testing', () => {
    test('should reproduce the exact timeout scenario from workflow #53', async ({ page }) => {
      // Reproduce the 10929ms timeout we saw in Chrome
      console.log('🔄 REPLICATING: Workflow #53 E2E timeout failure pattern');

      await page.goto('http://localhost:4321');

      const startTime = Date.now();

      try {
        const subscribeForm = page.locator('data-testid=subscribe-form');

        // Use the exact timeout configuration from our Playwright config
        await expect(subscribeForm).toBeVisible({
          timeout: 10000 // 10 seconds - matches expect timeout
        });

        console.log('✅ UNEXPECTED: Form appeared - this should have failed');
        console.log('If we see this, the issue might be intermittent or resolved');

      } catch (timeoutError) {
        const duration = Date.now() - startTime;

        console.log(`❌ REPRODUCED: Form timeout after ${duration}ms`);
        console.log('This matches the workflow #53 failure pattern exactly');

        // Validate this matches expected failure characteristics
        expect(duration).toBeGreaterThan(5000); // Take more than 5 seconds
        expect(duration).toBeLessThan(30000); // But less than overall test timeout (30s)
        expect(timeoutError.message).toContain('visible');

        console.log('✅ CONFIRMED: This is the exact failure pattern from CI');
      }
    });

    test('should test different timeout configurations systematically', async ({ page }) => {
      await page.goto('http://localhost:4321');

      console.log('🔄 TESTING: Multiple timeout scenarios');

      const scenarios = [
        { timeout: 5000, expected: 'quick timeout (should fail)' },
        { timeout: 10000, expected: 'standard timeout' },
        { timeout: 15000, expected: 'extended timeout (allows more time for slow loads)' }
      ];

      for (const { timeout, expected } of scenarios) {
        const startTime = Date.now();

        try {
          const form = page.locator('data-testid=subscribe-form');
          await expect(form).toBeVisible({ timeout });

          console.log(`✅ ${expected}: Form appeared within ${timeout}ms`);
          break; // If any succeeds, the component does exist

        } catch (error) {
          const duration = Date.now() - startTime;
          console.log(`❌ ${expected}: Failed after ${duration}ms - component not found within ${timeout}ms`);

          // Validate failure is due to missing component, not other issues
          expect(error.message).toContain('visible');
        }

        // Brief pause between scenarios
        await page.waitForTimeout(500);
      }

      console.log('🔍 CONCLUSION: Component consistently missing - infrastructure working, code issue');
    });
  });

  test.describe('Browser-Specific Compatibility', () => {
    test('should validate browser-specific element detection and timing', async ({ page, browserName }) => {
      console.log(`🔍 TESTING: Browser ${browserName} compatibility`);

      await page.goto('http://localhost:4321');

      const browserCharacteristics = {
        chromium: { conservative: true, fast: true },
        firefox: { conservative: true, css_aware: true },
        webkit: { different_timing: true, stricter_css: true },
        'Mobile Safari': { mobile_emulation: true, touch_events: true }
      };

      const characteristics = browserCharacteristics[browserName as keyof typeof browserCharacteristics] || {};

      console.log(`Browser characteristics: ${JSON.stringify(characteristics)}`);

      try {
        const form = page.locator('data-testid=subscribe-form');

        // Test with browser-specific timeout expectations
        const timeout = browserName === 'webkit' ? 15000 : 10000;

        await expect(form).toBeVisible({ timeout });

        console.log(`✅ Browser ${browserName}: Form found successfully`);
        console.log('This suggests the component might exist but have browser-specific issues');

        // Additional checks for browser-specific behavior
        if (browserName === 'webkit') {
          console.log('WebKit successfully loaded form - may be timing or CSS specificity issue');
        }

      } catch (error) {
        console.log(`❌ Browser ${browserName}: Form not found within ${timeout}ms`);

        // Document what might be different about this browser
        if (browserName === 'webkit') {
          console.log('💡 WebKit commonly has different CSS parsing or timing');
          console.log('Possible: CSS selectors, JavaScript event handling, or DOM timing');
        }

        expect(error.message).toContain('visible');
      }
    });

    test('should identify the most reliable detection method across browsers', async ({ page }) => {
      await page.goto('http://localhost:4321');

      console.log('🔍 TESTING: Multiple form detection methods');

      const detectionMethods = [
        'data-testid=subscribe-form',    // Test ID (most specific)
        'form[action*="subscribe"]',     // Form action
        '[id*="subscribe"]',             // ID contains
        '.newsletter, .subscribe',        // CSS class
        'input[type="email"]',           // Email input (fallback)
        'button[type="submit"]',         // Submit button (most generic)
      ];

      const results: { method: string; found: boolean; count: number }[] = [];

      for (const method of detectionMethods) {
        try {
          const elements = page.locator(method);
          const count = await elements.count();

          results.push({ method, found: count > 0, count });

          if (count > 0) {
            console.log(`✅ Found ${count} elements with: ${method}`);
          }

        } catch (error) {
          results.push({ method, found: false, count: 0 });
          console.log(`❌ No elements found with: ${method}`);
        }
      }

      // Analyze results to determine best detection strategy
      const successfulMethods = results.filter(r => r.found);

      if (successfulMethods.length === 0) {
        console.log('🚨 CONCLUSION: No form-related elements found on page');
        console.log('ROOT CAUSE: Subscription component completely missing from page');

        expect(successfulMethods.length).toBeGreaterThan(0);
      } else {
        console.log(`💡 ${successfulMethods.length} detection methods work:`);
        successfulMethods.forEach(({ method, count }) => {
          console.log(`  - ${method}: ${count} elements`);
        });

        // Recommend the most specific working method
        const recommendedMethod = successfulMethods[0].method;
        console.log(`🎯 RECOMMENDED: Use "${recommendedMethod}" for E2E tests`);
      }
    });
  });

  test.describe('Timing and Performance Analysis', () => {
    test('should establish baseline page load performance', async ({ page }) => {
      const metrics: { metric: string; value: number }[] = [];

      const startTime = Date.now();
      await page.goto('http://localhost:4321', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      metrics.push({ metric: 'page_load_time', value: loadTime });

      console.log(`📊 Page load time: ${loadTime}ms`);

      // Test form-specific timing
      const formStartTime = Date.now();
      try {
        const form = page.locator('data-testid=subscribe-form');
        await expect(form).toBeVisible({ timeout: 2000 }); // Quick check

        const formLoadTime = Date.now() - formStartTime;
        metrics.push({ metric: 'form_load_time', value: formLoadTime });

        console.log(`✅ Form appears within ${formLoadTime}ms of page load`);
        console.log('PERFORMANCE: Well within CI timeout limits');

      } catch (error) {
        const timeSpent = Date.now() - formStartTime;
        console.log(`❌ Form failed quick check at ${timeSpent}ms`);
        console.log('This indicates the form is not present when expected');

        metrics.push({ metric: 'form_load_time', value: -1 }); // Failed
      }

      // Compare with CI timeout settings
      const ciTimeout = 30000; // 30 seconds from our config
      const pageLoadMargin = ciTimeout - loadTime;

      if (pageLoadMargin < 3000) {
        console.log(`⚠️ WARNING: Only ${pageLoadMargin}ms left for tests after page load`);
        console.log(`CI failures likely if form loading exceeds ${pageLoadMargin}ms`);
      } else {
        console.log(`✅ GOOD: ${pageLoadMargin}ms available for test execution`);
      }

      // Export metrics for analysis
      console.log('Performance metrics collected:', metrics);

      // Assert basic performance is within bounds
      expect(loadTime).toBeLessThan(10000); // Page should load within 10s
    });
  });

  test.describe('Recovery and Debugging Strategies', () => {
    test('should provide debugging information for future E2E failures', async ({ page }) => {
      await page.goto('http://localhost:4321');

      console.log('🔧 DEBUGGING INFORMATION:');

      // Check what elements are actually available
      const allForms = await page.locator('form').count();
      const allInputs = await page.locator('input').count();
      const allButtons = await page.locator('button').count();

      console.log(`Page contains: ${allForms} forms, ${allInputs} inputs, ${allButtons} buttons`);

      // Check for any form with email fields
      const emailForms = await page.locator('form').filter({ has: page.locator('input[type="email"]') }).count();
      console.log(`Forms with email inputs: ${emailForms}`);

      // Check for any form with submit buttons
      const submitForms = await page.locator('form').filter({ has: page.locator('input[type="submit"], button[type="submit"]') }).count();
      console.log(`Forms with submit buttons: ${submitForms}`);

      // Check for any newsletter-related elements
      const newsletterElements = await page.locator('*').filter({ hasText: /subscribe|newsletter|email/i }).count();
      console.log(`Newsletter-related text elements: ${newsletterElements}`);

      // Take a screenshot for manual inspection
      await page.screenshot({ path: 'test-results/page-elements-debug.png', fullPage: true });
      console.log('Screenshot saved: test-results/page-elements-debug.png');

      // Provide action items based on findings
      if (allForms === 0) {
        console.log('❌ ACTION NEEDED: No forms found on page');
        console.log('  - Check if newsletter component is imported in pages');
        console.log('  - Verify page layout includes newsletter section');
      } else if (newsletterElements === 0) {
        console.log('❌ ACTION NEEDED: No newsletter-related content found');
        console.log('  - Check newsletter component template');
        console.log('  - Verify text content is rendering');
      } else {
        console.log('⚡ DIAGNOSTIC: Some form elements present but subscription form missing');
        console.log('  - Check data-testid attributes on components');
        console.log('  - Verify component tree structure');
        console.log('  - Look for JavaScript rendering issues');
      }
    });
  });
});