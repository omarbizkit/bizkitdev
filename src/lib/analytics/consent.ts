/**
 * Privacy & Consent Management
 *
 * GDPR/CCPA compliant consent management with granular controls.
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import Cookies from 'js-cookie';
import type {
  ConsentData,
  ConsentLevel,
  GranularConsent,
  ConsentMethod
} from '../../types/analytics';
import { getCurrentEnvConfig } from './config';

// Consent storage key
const CONSENT_COOKIE_KEY = 'analytics_consent';
const CONSENT_BANNER_KEY = 'consent_banner_shown';

// Current consent state
let currentConsent: ConsentData | null = null;
let consentCallbacks: Array<(consent: ConsentData) => void> = [];

// Default consent preferences
const DEFAULT_GRANULAR_CONSENT: GranularConsent = {
  essential: true,     // Always required for site functionality
  functional: false,   // Enhance user experience
  analytics: false,    // Anonymous usage analytics
  performance: false,  // Performance monitoring
  marketing: false,    // Marketing and advertising
  personalization: false, // Personalized content
  thirdParty: false    // Third-party integrations
};

// Initialize consent management
export const initializeConsent = (): ConsentData => {
  try {
    // Load existing consent from storage
    const existingConsent = loadConsentFromStorage();

    if (existingConsent && isConsentValid(existingConsent)) {
      currentConsent = existingConsent;
      notifyConsentCallbacks(existingConsent);
      return existingConsent;
    }

    // Create default consent (essential only)
    const defaultConsent = createDefaultConsent();
    currentConsent = defaultConsent;

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('Consent initialized with default settings');
    }

    return defaultConsent;
  } catch (error) {
    console.error('Failed to initialize consent management:', error);
    return createDefaultConsent();
  }
};

// Create default consent object
const createDefaultConsent = (): ConsentData => {
  return {
    consentId: generateConsentId(),
    timestamp: Date.now(),
    version: '1.0',
    level: 'essential',
    granularConsent: { ...DEFAULT_GRANULAR_CONSENT },
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    method: 'auto_essential',
    lastUpdated: Date.now()
  };
};

// Generate unique consent ID
const generateConsentId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Load consent from storage
const loadConsentFromStorage = (): ConsentData | null => {
  try {
    const consentString = Cookies.get(CONSENT_COOKIE_KEY);
    if (!consentString) return null;

    const consent = JSON.parse(consentString);
    return consent as ConsentData;
  } catch (error) {
    console.warn('Failed to load consent from storage:', error);
    return null;
  }
};

// Save consent to storage
const saveConsentToStorage = (consent: ConsentData): void => {
  try {
    const consentString = JSON.stringify(consent);

    // Save with 1-year expiry (GDPR compliant)
    Cookies.set(CONSENT_COOKIE_KEY, consentString, {
      expires: 365,
      secure: window.location.protocol === 'https:',
      sameSite: 'strict'
    });

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('Consent saved to storage:', consent.level);
    }
  } catch (error) {
    console.error('Failed to save consent to storage:', error);
  }
};

// Check if consent is valid and not expired
const isConsentValid = (consent: ConsentData): boolean => {
  // Check if consent has expired (1 year)
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - consent.timestamp > oneYearMs;

  if (isExpired) return false;

  // Check if consent was withdrawn
  if (consent.withdrawnAt) return false;

  // Check if consent structure is valid
  return !!(
    consent.consentId &&
    consent.timestamp &&
    consent.level &&
    consent.granularConsent &&
    consent.method
  );
};

// Update consent preferences
export const updateConsent = (
  level: ConsentLevel,
  granularConsent?: Partial<GranularConsent>,
  method: ConsentMethod = 'settings_update'
): ConsentData => {
  try {
    const updatedGranularConsent = granularConsent
      ? { ...DEFAULT_GRANULAR_CONSENT, ...granularConsent }
      : mapLevelToGranularConsent(level);

    const updatedConsent: ConsentData = {
      consentId: currentConsent?.consentId || generateConsentId(),
      timestamp: currentConsent?.timestamp || Date.now(),
      version: '1.0',
      level,
      granularConsent: updatedGranularConsent,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      method,
      lastUpdated: Date.now()
    };

    // Save to storage
    saveConsentToStorage(updatedConsent);

    // Update current state
    currentConsent = updatedConsent;

    // Notify callbacks
    notifyConsentCallbacks(updatedConsent);

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('Consent updated:', { level, method });
    }

    return updatedConsent;
  } catch (error) {
    console.error('Failed to update consent:', error);
    return currentConsent || createDefaultConsent();
  }
};

// Map consent level to granular preferences
const mapLevelToGranularConsent = (level: ConsentLevel): GranularConsent => {
  const baseConsent = { ...DEFAULT_GRANULAR_CONSENT };

  switch (level) {
    case 'none':
      return { ...baseConsent, essential: true };

    case 'essential':
      return { ...baseConsent, essential: true };

    case 'functional':
      return {
        ...baseConsent,
        essential: true,
        functional: true
      };

    case 'analytics':
      return {
        ...baseConsent,
        essential: true,
        functional: true,
        analytics: true,
        performance: true
      };

    case 'marketing':
      return {
        ...baseConsent,
        essential: true,
        functional: true,
        analytics: true,
        performance: true,
        marketing: true,
        personalization: true
      };

    case 'full':
      return {
        essential: true,
        functional: true,
        analytics: true,
        performance: true,
        marketing: true,
        personalization: true,
        thirdParty: true
      };

    default:
      return baseConsent;
  }
};

// Get current consent
export const getCurrentConsent = (): ConsentData => {
  return currentConsent || initializeConsent();
};

// Check if specific tracking is allowed
export const isTrackingAllowed = (requiredConsent: keyof GranularConsent): boolean => {
  const consent = getCurrentConsent();
  return consent.granularConsent[requiredConsent] === true;
};

// Check if consent level allows specific analytics
export const hasConsentLevel = (requiredLevel: ConsentLevel): boolean => {
  const consent = getCurrentConsent();

  const consentHierarchy: ConsentLevel[] = [
    'none',
    'essential',
    'functional',
    'analytics',
    'marketing',
    'full'
  ];

  const currentIndex = consentHierarchy.indexOf(consent.level);
  const requiredIndex = consentHierarchy.indexOf(requiredLevel);

  return currentIndex >= requiredIndex;
};

// Withdraw consent
export const withdrawConsent = (): ConsentData => {
  const updatedConsent: ConsentData = {
    ...(currentConsent || createDefaultConsent()),
    level: 'none',
    granularConsent: { ...DEFAULT_GRANULAR_CONSENT },
    withdrawnAt: Date.now(),
    method: 'gdpr_request',
    lastUpdated: Date.now()
  };

  saveConsentToStorage(updatedConsent);
  currentConsent = updatedConsent;
  notifyConsentCallbacks(updatedConsent);

  // Clear all analytics cookies
  clearAnalyticsCookies();

  const envConfig = getCurrentEnvConfig();
  if (envConfig.enableConsoleLogging) {
    console.log('Consent withdrawn and analytics cookies cleared');
  }

  return updatedConsent;
};

// Clear analytics-related cookies
const clearAnalyticsCookies = (): void => {
  // List of common analytics cookies to clear
  const analyticsCookies = [
    '_ga',
    '_ga_',
    '_gid',
    '_gat',
    '_gtag',
    '_fbp',
    '_fbc',
    'analytics_session'
  ];

  analyticsCookies.forEach(cookieName => {
    Cookies.remove(cookieName);
    Cookies.remove(cookieName, { domain: window.location.hostname });
    Cookies.remove(cookieName, { domain: `.${window.location.hostname}` });
  });
};

// Register callback for consent changes
export const onConsentChange = (callback: (consent: ConsentData) => void): void => {
  consentCallbacks.push(callback);

  // Immediately call with current consent
  const consent = getCurrentConsent();
  callback(consent);
};

// Remove consent change callback
export const removeConsentCallback = (callback: (consent: ConsentData) => void): void => {
  consentCallbacks = consentCallbacks.filter(cb => cb !== callback);
};

// Notify all callbacks of consent changes
const notifyConsentCallbacks = (consent: ConsentData): void => {
  consentCallbacks.forEach(callback => {
    try {
      callback(consent);
    } catch (error) {
      console.error('Error in consent callback:', error);
    }
  });
};

// Check if consent banner should be shown
export const shouldShowConsentBanner = (): boolean => {
  // Check if banner was already shown and dismissed
  const bannerShown = Cookies.get(CONSENT_BANNER_KEY);
  if (bannerShown) return false;

  // Check if user has already given consent
  const consent = getCurrentConsent();
  return consent.method === 'auto_essential';
};

// Mark consent banner as shown
export const markConsentBannerShown = (): void => {
  Cookies.set(CONSENT_BANNER_KEY, 'true', {
    expires: 365,
    secure: window.location.protocol === 'https:',
    sameSite: 'strict'
  });
};

// Respect Do Not Track header
export const respectDoNotTrack = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // Check various DNT implementations
  const dnt = navigator.doNotTrack ||
              (window as any).doNotTrack ||
              (navigator as any).msDoNotTrack;

  return dnt === '1' || dnt === 'yes';
};

// Get consent summary for debugging
export const getConsentSummary = () => {
  const consent = getCurrentConsent();

  return {
    level: consent.level,
    granular: consent.granularConsent,
    method: consent.method,
    timestamp: new Date(consent.timestamp).toISOString(),
    lastUpdated: new Date(consent.lastUpdated).toISOString(),
    isValid: isConsentValid(consent),
    shouldShowBanner: shouldShowConsentBanner(),
    respectsDNT: respectDoNotTrack()
  };
};

export default {
  initializeConsent,
  updateConsent,
  getCurrentConsent,
  isTrackingAllowed,
  hasConsentLevel,
  withdrawConsent,
  onConsentChange,
  removeConsentCallback,
  shouldShowConsentBanner,
  markConsentBannerShown,
  respectDoNotTrack,
  getConsentSummary
};