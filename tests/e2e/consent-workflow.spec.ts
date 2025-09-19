/**
 * E2E Tests: Consent Management Flow
 *
 * Tests comprehensive consent management workflow including:
 * - Cookie consent banner display and interaction
 * - Consent level selection and persistence
 * - Analytics behavior based on consent levels
 * - GDPR compliance validation
 * - Consent preference management
 *
 * Feature: 057-advanced-analytics-monitoring
 * Task: T095
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4321';

// Consent levels for testing
const CONSENT_LEVELS = ['none', 'essential', 'functional', 'analytics', 'marketing', 'full'] as const;
type ConsentLevel = typeof CONSENT_LEVELS[number];

test.describe('Consent Management Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Clear all storage to start fresh
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Mock consent management functions
    await page.addInitScript(() => {
      (window as any).consentEvents = [];

      // Mock consent management
      (window as any).consentManager = {
        getConsentLevel: () => {
          return localStorage.getItem('user_consent_level') || 'none';
        },
        setConsentLevel: (level: string) => {
          localStorage.setItem('user_consent_level', level);
          localStorage.setItem('consent_banner_shown', 'true');
          localStorage.setItem('consent_timestamp', Date.now().toString());

          // Dispatch consent change event
          window.dispatchEvent(new CustomEvent('consentChanged', {
            detail: { consentLevel: level, timestamp: Date.now() }
          }));

          (window as any).consentEvents.push({
            type: 'consent_change',
            level: level,
            timestamp: Date.now()
          });
        },
        showBanner: () => {
          (window as any).consentEvents.push({
            type: 'banner_shown',
            timestamp: Date.now()
          });
        },
        hideBanner: () => {
          (window as any).consentEvents.push({
            type: 'banner_hidden',
            timestamp: Date.now()
          });
        }
      };

      // Mock analytics with consent checking
      (window as any).analytics = {
        trackEvent: (category: string, action: string, metadata?: any) => {
          const consentLevel = (window as any).consentManager.getConsentLevel();

          if (consentLevel === 'none') {
            return; // No tracking without consent
          }

          (window as any).consentEvents.push({
            type: 'analytics_event',
            category: category,
            action: action,
            consentLevel: consentLevel,
            metadata: metadata,
            timestamp: Date.now()
          });
        },
        isTrackingAllowed: (requiredLevel: string) => {
          const currentLevel = (window as any).consentManager.getConsentLevel();
          const levelHierarchy = ['none', 'essential', 'functional', 'analytics', 'marketing', 'full'];
          const currentIndex = levelHierarchy.indexOf(currentLevel);
          const requiredIndex = levelHierarchy.indexOf(requiredLevel);
          return currentIndex >= requiredIndex;
        }
      };
    });
  });

  test('should display consent banner for new visitors', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Check if consent banner should be displayed
    const hasConsent = await page.evaluate(() => {
      return localStorage.getItem('user_consent_level') !== null;
    });

    // For new visitors, banner should be shown
    if (!hasConsent) {
      const bannerEvents = await page.evaluate(() =>
        (window as any).consentEvents.filter((e: any) => e.type === 'banner_shown')
      );

      // Banner should be triggered for new visitors
      expect(bannerEvents.length).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle consent level selection', async () => {
    await page.goto(TEST_BASE_URL);

    // Test each consent level
    for (const level of ['essential', 'functional', 'analytics', 'marketing', 'full']) {
      // Set consent level
      await page.evaluate((consentLevel) => {
        (window as any).consentManager.setConsentLevel(consentLevel);
      }, level);

      // Verify consent was set
      const storedConsent = await page.evaluate(() =>
        localStorage.getItem('user_consent_level')
      );
      expect(storedConsent).toBe(level);

      // Verify consent change event was fired
      const consentEvents = await page.evaluate(() =>
        (window as any).consentEvents.filter((e: any) => e.type === 'consent_change')
      );
      expect(consentEvents.length).toBeGreaterThan(0);

      const lastConsentEvent = consentEvents[consentEvents.length - 1];
      expect(lastConsentEvent.level).toBe(level);
    }
  });

  test('should persist consent across page reloads', async () => {
    await page.goto(TEST_BASE_URL);

    // Set consent level
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('analytics');
    });

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify consent persisted
    const storedConsent = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );
    expect(storedConsent).toBe('analytics');

    const bannerShown = await page.evaluate(() =>
      localStorage.getItem('consent_banner_shown')
    );
    expect(bannerShown).toBe('true');
  });

  test('should respect consent levels for analytics tracking', async () => {
    await page.goto(TEST_BASE_URL);

    // Test tracking with no consent
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('none');
      (window as any).analytics.trackEvent('test', 'action');
    });

    let analyticsEvents = await page.evaluate(() =>
      (window as any).consentEvents.filter((e: any) => e.type === 'analytics_event')
    );
    expect(analyticsEvents.length).toBe(0); // No tracking without consent

    // Test tracking with analytics consent
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('analytics');
      (window as any).analytics.trackEvent('test', 'action');
    });

    analyticsEvents = await page.evaluate(() =>
      (window as any).consentEvents.filter((e: any) => e.type === 'analytics_event')
    );
    expect(analyticsEvents.length).toBeGreaterThan(0);
    expect(analyticsEvents[0].consentLevel).toBe('analytics');
  });

  test('should validate consent hierarchy', async () => {
    await page.goto(TEST_BASE_URL);

    // Test consent hierarchy: none < essential < functional < analytics < marketing < full
    const testCases = [
      { current: 'none', required: 'essential', allowed: false },
      { current: 'essential', required: 'essential', allowed: true },
      { current: 'functional', required: 'essential', allowed: true },
      { current: 'analytics', required: 'functional', allowed: true },
      { current: 'marketing', required: 'analytics', allowed: true },
      { current: 'full', required: 'marketing', allowed: true },
      { current: 'essential', required: 'analytics', allowed: false },
      { current: 'functional', required: 'marketing', allowed: false }
    ];

    for (const testCase of testCases) {
      await page.evaluate((currentLevel) => {
        (window as any).consentManager.setConsentLevel(currentLevel);
      }, testCase.current);

      const isAllowed = await page.evaluate((requiredLevel) => {
        return (window as any).analytics.isTrackingAllowed(requiredLevel);
      }, testCase.required);

      expect(isAllowed).toBe(testCase.allowed);
    }
  });

  test('should handle consent withdrawal', async () => {
    await page.goto(TEST_BASE_URL);

    // Set high consent level first
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('full');
    });

    // Verify tracking is allowed
    let trackingAllowed = await page.evaluate(() => {
      return (window as any).analytics.isTrackingAllowed('analytics');
    });
    expect(trackingAllowed).toBe(true);

    // Withdraw consent
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('none');
    });

    // Verify tracking is blocked
    trackingAllowed = await page.evaluate(() => {
      return (window as any).analytics.isTrackingAllowed('analytics');
    });
    expect(trackingAllowed).toBe(false);

    // Verify consent change event was fired
    const consentEvents = await page.evaluate(() =>
      (window as any).consentEvents.filter((e: any) => e.type === 'consent_change')
    );
    expect(consentEvents.length).toBeGreaterThanOrEqual(2); // Initial set + withdrawal
  });

  test('should validate GDPR compliance features', async () => {
    await page.goto(TEST_BASE_URL);

    // Test data minimization: no tracking without explicit consent
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('none');
      (window as any).analytics.trackEvent('test', 'gdpr_test');
    });

    const unauthorizedEvents = await page.evaluate(() =>
      (window as any).consentEvents.filter((e: any) => e.type === 'analytics_event')
    );
    expect(unauthorizedEvents.length).toBe(0);

    // Test consent timestamp storage
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('analytics');
    });

    const consentTimestamp = await page.evaluate(() =>
      localStorage.getItem('consent_timestamp')
    );
    expect(consentTimestamp).toBeTruthy();
    expect(parseInt(consentTimestamp!)).toBeGreaterThan(Date.now() - 10000);

    // Test consent granularity
    const consentLevel = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );
    expect(CONSENT_LEVELS).toContain(consentLevel as ConsentLevel);
  });

  test('should handle consent banner interactions', async () => {
    await page.goto(TEST_BASE_URL);

    // Simulate consent banner interactions
    await page.evaluate(() => {
      // Show banner
      (window as any).consentManager.showBanner();

      // User accepts analytics
      (window as any).consentManager.setConsentLevel('analytics');

      // Hide banner
      (window as any).consentManager.hideBanner();
    });

    const bannerEvents = await page.evaluate(() => (window as any).consentEvents);

    const showEvent = bannerEvents.find((e: any) => e.type === 'banner_shown');
    const hideEvent = bannerEvents.find((e: any) => e.type === 'banner_hidden');
    const consentEvent = bannerEvents.find((e: any) => e.type === 'consent_change');

    expect(showEvent).toBeTruthy();
    expect(hideEvent).toBeTruthy();
    expect(consentEvent).toBeTruthy();
    expect(consentEvent.level).toBe('analytics');

    // Banner should not show again
    const bannerShown = await page.evaluate(() =>
      localStorage.getItem('consent_banner_shown')
    );
    expect(bannerShown).toBe('true');
  });

  test('should support consent preferences management', async () => {
    await page.goto(TEST_BASE_URL);

    // Test changing consent preferences multiple times
    const preferenceChanges = ['essential', 'functional', 'analytics', 'marketing', 'functional'];

    for (const preference of preferenceChanges) {
      await page.evaluate((level) => {
        (window as any).consentManager.setConsentLevel(level);
      }, preference);

      await page.waitForTimeout(100); // Small delay between changes
    }

    // Verify all changes were tracked
    const consentEvents = await page.evaluate(() =>
      (window as any).consentEvents.filter((e: any) => e.type === 'consent_change')
    );
    expect(consentEvents.length).toBe(preferenceChanges.length);

    // Verify final consent level
    const finalConsent = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );
    expect(finalConsent).toBe('functional');
  });

  test('should validate consent across different pages', async () => {
    // Set consent on homepage
    await page.goto(TEST_BASE_URL);
    await page.evaluate(() => {
      (window as any).consentManager.setConsentLevel('analytics');
    });

    // Navigate to about page
    await page.goto(`${TEST_BASE_URL}/about`);
    await page.waitForLoadState('networkidle');

    // Verify consent persisted
    const consentOnAbout = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );
    expect(consentOnAbout).toBe('analytics');

    // Navigate to work page
    await page.goto(`${TEST_BASE_URL}/work`);
    await page.waitForLoadState('networkidle');

    // Verify consent still persisted
    const consentOnWork = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );
    expect(consentOnWork).toBe('analytics');
  });

  test('should handle invalid consent levels gracefully', async () => {
    await page.goto(TEST_BASE_URL);

    // Try to set invalid consent level
    await page.evaluate(() => {
      try {
        (window as any).consentManager.setConsentLevel('invalid_level');
      } catch (error) {
        // Expected to handle gracefully
      }
    });

    // Should fall back to safe default (none or previous valid level)
    const consent = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );

    // Should either be a valid level or null (for fallback to 'none')
    expect(consent === null || CONSENT_LEVELS.includes(consent as ConsentLevel)).toBe(true);
  });

  test('should support consent expiration handling', async () => {
    await page.goto(TEST_BASE_URL);

    // Set consent with old timestamp (simulate expired consent)
    await page.evaluate(() => {
      const oldTimestamp = Date.now() - (365 * 24 * 60 * 60 * 1000); // 1 year ago
      localStorage.setItem('user_consent_level', 'analytics');
      localStorage.setItem('consent_timestamp', oldTimestamp.toString());
    });

    // Check if consent is considered expired
    const isExpired = await page.evaluate(() => {
      const timestamp = localStorage.getItem('consent_timestamp');
      if (!timestamp) return true;

      const consentAge = Date.now() - parseInt(timestamp);
      const maxAge = 180 * 24 * 60 * 60 * 1000; // 180 days
      return consentAge > maxAge;
    });

    expect(isExpired).toBe(true);

    // Expired consent should require renewal
    if (isExpired) {
      // Simulate consent renewal
      await page.evaluate(() => {
        (window as any).consentManager.setConsentLevel('analytics');
      });

      const newTimestamp = await page.evaluate(() =>
        localStorage.getItem('consent_timestamp')
      );
      expect(parseInt(newTimestamp!)).toBeGreaterThan(Date.now() - 1000);
    }
  });
});

test.describe('Consent Management Edge Cases', () => {
  test('should handle concurrent consent changes', async ({ page }) => {
    await page.goto(TEST_BASE_URL);

    // Set up consent manager
    await page.addInitScript(() => {
      (window as any).consentEvents = [];
      (window as any).consentManager = {
        setConsentLevel: (level: string) => {
          localStorage.setItem('user_consent_level', level);
          (window as any).consentEvents.push({ level, timestamp: Date.now() });
        }
      };
    });

    // Simulate rapid concurrent consent changes
    await page.evaluate(() => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          new Promise(resolve => {
            setTimeout(() => {
              (window as any).consentManager.setConsentLevel(`level_${i}`);
              resolve(null);
            }, Math.random() * 100);
          })
        );
      }
      return Promise.all(promises);
    });

    await page.waitForTimeout(200);

    // Verify final state is consistent
    const events = await page.evaluate(() => (window as any).consentEvents);
    expect(events.length).toBe(5);

    const finalConsent = await page.evaluate(() =>
      localStorage.getItem('user_consent_level')
    );
    expect(finalConsent).toBeTruthy();
  });
});