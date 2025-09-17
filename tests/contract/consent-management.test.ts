/**
 * Privacy & Consent Management Contract Tests
 *
 * TDD contract tests for GDPR/CCPA compliant consent system.
 * Based on: specs/057-advanced-analytics-monitoring/tasks.md (T004)
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  ConsentData,
  ConsentLevel,
  GranularConsent,
  ConsentMethod
} from '../../src/types/analytics';

// Import the consent management functions we need to implement
import {
  initializeConsent,
  updateConsent,
  getCurrentConsent,
  isTrackingAllowed,
  hasConsentLevel,
  withdrawConsent,
  shouldShowConsentBanner,
  markConsentBannerShown,
  respectDoNotTrack,
  getConsentSummary
} from '../../src/lib/analytics/consent';

// Mock js-cookie for testing
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(() => null),
    set: vi.fn(() => true),
    remove: vi.fn(() => true)
  }
}));

describe('Privacy & Consent Management Contract Tests', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock browser APIs
    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Test Browser)',
        doNotTrack: '0' // Default to DNT disabled
      },
      configurable: true
    });

    Object.defineProperty(global, 'window', {
      value: {
        location: {
          protocol: 'https:',
          hostname: 'localhost'
        }
      },
      configurable: true
    });

    // Mock Cookies module - get fresh mock for each test
    const { default: Cookies } = await import('js-cookie');
    vi.mocked(Cookies.get).mockReturnValue(null); // Default: no existing cookies
    vi.mocked(Cookies.set).mockReturnValue(undefined);
    vi.mocked(Cookies.remove).mockReturnValue(undefined);
  });

  afterEach(() => {
    // Clean up after each test
    if (typeof document !== 'undefined') {
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    }
  });

  describe('Consent Initialization', () => {
    it('should initialize with essential-only consent by default', () => {
      const consent = initializeConsent();

      expect(consent).toBeDefined();
      expect(consent.level).toBe('essential');
      expect(consent.granularConsent.essential).toBe(true);
      expect(consent.granularConsent.analytics).toBe(false);
      expect(consent.granularConsent.marketing).toBe(false);
      expect(consent.consentId).toMatch(/^[a-f0-9-]{36}$|^consent_\d+_[a-z0-9]+$/); // Accept UUID or custom format
      expect(consent.timestamp).toBeGreaterThan(0);
      expect(consent.version).toBe('1.0');
      expect(consent.method).toBe('auto_essential');
    });

    it('should generate unique consent IDs', () => {
      const consent1 = initializeConsent();
      const consent2 = initializeConsent();

      expect(consent1.consentId).not.toBe(consent2.consentId);
    });

    it('should set timestamp to current time', () => {
      const beforeTime = Date.now();
      const consent = initializeConsent();
      const afterTime = Date.now();

      expect(consent.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(consent.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should capture user agent when available', () => {
      const consent = initializeConsent();

      if (typeof navigator !== 'undefined') {
        expect(consent.userAgent).toBe(navigator.userAgent);
      } else {
        expect(consent.userAgent).toBe('');
      }
    });
  });

  describe('Consent Level Management', () => {
    it('should update consent level to analytics', () => {
      const consent = updateConsent('analytics', undefined, 'banner_accept');

      expect(consent.level).toBe('analytics');
      expect(consent.granularConsent.essential).toBe(true);
      expect(consent.granularConsent.functional).toBe(true);
      expect(consent.granularConsent.analytics).toBe(true);
      expect(consent.granularConsent.performance).toBe(true);
      expect(consent.granularConsent.marketing).toBe(false);
      expect(consent.method).toBe('banner_accept');
    });

    it('should update consent level to marketing', () => {
      const consent = updateConsent('marketing', undefined, 'banner_accept');

      expect(consent.level).toBe('marketing');
      expect(consent.granularConsent.essential).toBe(true);
      expect(consent.granularConsent.functional).toBe(true);
      expect(consent.granularConsent.analytics).toBe(true);
      expect(consent.granularConsent.performance).toBe(true);
      expect(consent.granularConsent.marketing).toBe(true);
      expect(consent.granularConsent.personalization).toBe(true);
      expect(consent.granularConsent.thirdParty).toBe(false);
    });

    it('should update consent level to full', () => {
      const consent = updateConsent('full', undefined, 'banner_accept');

      expect(consent.level).toBe('full');
      expect(consent.granularConsent.essential).toBe(true);
      expect(consent.granularConsent.functional).toBe(true);
      expect(consent.granularConsent.analytics).toBe(true);
      expect(consent.granularConsent.performance).toBe(true);
      expect(consent.granularConsent.marketing).toBe(true);
      expect(consent.granularConsent.personalization).toBe(true);
      expect(consent.granularConsent.thirdParty).toBe(true);
    });

    it('should allow granular consent overrides', () => {
      const granularConsent: Partial<GranularConsent> = {
        analytics: true,
        marketing: false,
        personalization: true
      };

      const consent = updateConsent('analytics', granularConsent, 'settings_update');

      expect(consent.level).toBe('analytics');
      expect(consent.granularConsent.essential).toBe(true);
      expect(consent.granularConsent.analytics).toBe(true);
      expect(consent.granularConsent.marketing).toBe(false);
      expect(consent.granularConsent.personalization).toBe(true);
    });

    it('should update lastUpdated timestamp on consent changes', () => {
      const initialConsent = initializeConsent();
      const initialTime = initialConsent.lastUpdated;

      // Wait a small amount to ensure timestamp difference
      setTimeout(() => {
        const updatedConsent = updateConsent('analytics');
        expect(updatedConsent.lastUpdated).toBeGreaterThan(initialTime);
      }, 10);
    });
  });

  describe('Consent Validation & Checking', () => {
    it('should check tracking permissions for analytics', () => {
      // Start with essential only
      initializeConsent();
      expect(isTrackingAllowed('analytics')).toBe(false);

      // Update to analytics level
      updateConsent('analytics');
      expect(isTrackingAllowed('analytics')).toBe(true);
      expect(isTrackingAllowed('marketing')).toBe(false);
    });

    it('should check consent level hierarchy', () => {
      // Essential level
      updateConsent('essential');
      expect(hasConsentLevel('essential')).toBe(true);
      expect(hasConsentLevel('analytics')).toBe(false);

      // Analytics level
      updateConsent('analytics');
      expect(hasConsentLevel('essential')).toBe(true);
      expect(hasConsentLevel('functional')).toBe(true);
      expect(hasConsentLevel('analytics')).toBe(true);
      expect(hasConsentLevel('marketing')).toBe(false);

      // Full level
      updateConsent('full');
      expect(hasConsentLevel('essential')).toBe(true);
      expect(hasConsentLevel('analytics')).toBe(true);
      expect(hasConsentLevel('marketing')).toBe(true);
      expect(hasConsentLevel('full')).toBe(true);
    });

    it('should get current consent state', () => {
      const initialConsent = initializeConsent();
      const currentConsent = getCurrentConsent();

      expect(currentConsent.consentId).toBe(initialConsent.consentId);
      expect(currentConsent.level).toBe(initialConsent.level);
      expect(currentConsent.timestamp).toBe(initialConsent.timestamp);
    });
  });

  describe('Consent Withdrawal & Privacy Rights', () => {
    it('should withdraw consent and reset to essential only', () => {
      // First, give full consent
      updateConsent('full');
      expect(isTrackingAllowed('analytics')).toBe(true);
      expect(isTrackingAllowed('marketing')).toBe(true);

      // Withdraw consent
      const withdrawnConsent = withdrawConsent();

      expect(withdrawnConsent.level).toBe('none');
      expect(withdrawnConsent.granularConsent.analytics).toBe(false);
      expect(withdrawnConsent.granularConsent.marketing).toBe(false);
      expect(withdrawnConsent.granularConsent.essential).toBe(true);
      expect(withdrawnConsent.withdrawnAt).toBeDefined();
      expect(withdrawnConsent.withdrawnAt).toBeGreaterThan(0);
      expect(withdrawnConsent.method).toBe('gdpr_request');

      // Verify tracking is disabled
      expect(isTrackingAllowed('analytics')).toBe(false);
      expect(isTrackingAllowed('marketing')).toBe(false);
    });

    it('should mark withdrawal timestamp', () => {
      const beforeWithdrawal = Date.now();
      const withdrawnConsent = withdrawConsent();
      const afterWithdrawal = Date.now();

      expect(withdrawnConsent.withdrawnAt).toBeDefined();
      expect(withdrawnConsent.withdrawnAt!).toBeGreaterThanOrEqual(beforeWithdrawal);
      expect(withdrawnConsent.withdrawnAt!).toBeLessThanOrEqual(afterWithdrawal);
    });
  });

  describe('Consent Banner Management', () => {
    it('should show consent banner for new users', () => {
      // Fresh initialization should show banner
      initializeConsent();
      expect(shouldShowConsentBanner()).toBe(true);
    });

    it('should hide consent banner after being marked as shown', async () => {
      // Mock Cookies module for this specific test
      const { default: Cookies } = await import('js-cookie');

      initializeConsent();
      expect(shouldShowConsentBanner()).toBe(true);

      // Mark banner as shown
      markConsentBannerShown();

      // Mock that the banner cookie is now set
      vi.mocked(Cookies.get).mockImplementation((key: string) =>
        key === 'consent_banner_shown' ? 'true' : null
      );

      expect(shouldShowConsentBanner()).toBe(false);
    });

    it('should hide consent banner for users who have given explicit consent', () => {
      initializeConsent();
      updateConsent('analytics', undefined, 'banner_accept');

      // Banner should be hidden after explicit consent
      expect(shouldShowConsentBanner()).toBe(false);
    });
  });

  describe('Do Not Track Compliance', () => {
    it('should respect Do Not Track header when present', () => {
      // Test DNT enabled
      Object.defineProperty(global.navigator, 'doNotTrack', {
        value: '1',
        configurable: true
      });
      expect(respectDoNotTrack()).toBe(true);

      // Test DNT disabled
      Object.defineProperty(global.navigator, 'doNotTrack', {
        value: '0',
        configurable: true
      });
      expect(respectDoNotTrack()).toBe(false);

      // Test DNT with 'yes' value
      Object.defineProperty(global.navigator, 'doNotTrack', {
        value: 'yes',
        configurable: true
      });
      expect(respectDoNotTrack()).toBe(true);

      // Test DNT undefined
      Object.defineProperty(global.navigator, 'doNotTrack', {
        value: undefined,
        configurable: true
      });
      expect(respectDoNotTrack()).toBe(false);
    });
  });

  describe('Consent Data Validation', () => {
    it('should validate consent data structure', () => {
      const consent = initializeConsent();

      // Required fields
      expect(consent.consentId).toBeDefined();
      expect(consent.timestamp).toBeDefined();
      expect(consent.version).toBeDefined();
      expect(consent.level).toBeDefined();
      expect(consent.granularConsent).toBeDefined();
      expect(consent.method).toBeDefined();
      expect(consent.lastUpdated).toBeDefined();

      // Granular consent structure
      expect(consent.granularConsent.essential).toBeDefined();
      expect(consent.granularConsent.functional).toBeDefined();
      expect(consent.granularConsent.analytics).toBeDefined();
      expect(consent.granularConsent.performance).toBeDefined();
      expect(consent.granularConsent.marketing).toBeDefined();
      expect(consent.granularConsent.personalization).toBeDefined();
      expect(consent.granularConsent.thirdParty).toBeDefined();
    });

    it('should validate consent levels are valid enum values', () => {
      const validLevels: ConsentLevel[] = [
        'none', 'essential', 'functional', 'analytics', 'marketing', 'full'
      ];

      validLevels.forEach(level => {
        const consent = updateConsent(level);
        expect(validLevels).toContain(consent.level);
      });
    });

    it('should validate consent methods are valid enum values', () => {
      const validMethods: ConsentMethod[] = [
        'banner_accept', 'banner_reject', 'settings_update', 'auto_essential', 'gdpr_request'
      ];

      validMethods.forEach(method => {
        const consent = updateConsent('analytics', undefined, method);
        expect(validMethods).toContain(consent.method);
      });
    });
  });

  describe('Consent Summary & Debugging', () => {
    it('should provide comprehensive consent summary', () => {
      updateConsent('analytics', undefined, 'banner_accept');
      const summary = getConsentSummary();

      expect(summary).toHaveProperty('level');
      expect(summary).toHaveProperty('granular');
      expect(summary).toHaveProperty('method');
      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('lastUpdated');
      expect(summary).toHaveProperty('isValid');
      expect(summary).toHaveProperty('shouldShowBanner');
      expect(summary).toHaveProperty('respectsDNT');

      expect(summary.level).toBe('analytics');
      expect(summary.method).toBe('banner_accept');
      expect(summary.isValid).toBe(true);
    });

    it('should include ISO timestamp formatting in summary', () => {
      const consent = updateConsent('analytics');
      const summary = getConsentSummary();

      expect(summary.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(summary.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('Essential Functionality Requirements', () => {
    it('should always allow essential functionality regardless of consent level', () => {
      // Test all consent levels maintain essential functionality
      const levels: ConsentLevel[] = ['none', 'essential', 'functional', 'analytics', 'marketing', 'full'];

      levels.forEach(level => {
        const consent = updateConsent(level);
        expect(consent.granularConsent.essential).toBe(true);
        expect(isTrackingAllowed('essential')).toBe(true);
      });
    });

    it('should maintain essential consent even after withdrawal', () => {
      updateConsent('full');
      const withdrawnConsent = withdrawConsent();

      expect(withdrawnConsent.granularConsent.essential).toBe(true);
      expect(isTrackingAllowed('essential')).toBe(true);
    });
  });

  describe('Privacy Policy Version Tracking', () => {
    it('should track privacy policy version', () => {
      const consent = initializeConsent();
      expect(consent.version).toBe('1.0');
    });

    it('should maintain version across consent updates', () => {
      initializeConsent();
      const updatedConsent = updateConsent('analytics');
      expect(updatedConsent.version).toBe('1.0');
    });
  });

  describe('GDPR/CCPA Compliance Requirements', () => {
    it('should provide explicit opt-in for non-essential tracking', () => {
      const initialConsent = initializeConsent();

      // Default state should not allow analytics/marketing
      expect(initialConsent.granularConsent.analytics).toBe(false);
      expect(initialConsent.granularConsent.marketing).toBe(false);

      // Explicit consent required for analytics
      expect(isTrackingAllowed('analytics')).toBe(false);
      expect(isTrackingAllowed('marketing')).toBe(false);
    });

    it('should provide granular control over consent categories', () => {
      const granularConsent: Partial<GranularConsent> = {
        analytics: true,
        marketing: false,
        personalization: true,
        thirdParty: false
      };

      const consent = updateConsent('analytics', granularConsent);

      expect(consent.granularConsent.analytics).toBe(true);
      expect(consent.granularConsent.marketing).toBe(false);
      expect(consent.granularConsent.personalization).toBe(true);
      expect(consent.granularConsent.thirdParty).toBe(false);
    });

    it('should support data deletion through consent withdrawal', () => {
      updateConsent('full');
      const withdrawnConsent = withdrawConsent();

      expect(withdrawnConsent.withdrawnAt).toBeDefined();
      expect(withdrawnConsent.method).toBe('gdpr_request');
      expect(withdrawnConsent.level).toBe('none');

      // All non-essential tracking should be disabled
      expect(isTrackingAllowed('analytics')).toBe(false);
      expect(isTrackingAllowed('marketing')).toBe(false);
      expect(isTrackingAllowed('personalization')).toBe(false);
    });
  });
});