/**
 * Analytics Initialization Module
 *
 * Centralized analytics initialization logic with environment-specific configuration,
 * provider activation, and consent management.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type { ConsentLevel, AnalyticsEvent as AnalyticsEventInterface } from '../../types/analytics';
import { ANALYTICS_CONFIG, GA4_CONFIG, SENTRY_CONFIG, getCurrentEnvConfig } from './config';
import { initializeGA4 } from './ga4';
import { initializeSentry } from './sentry';
import { initializePerformanceMonitoring } from './performance';
import { debugUtils } from './utils';
import {
  createAnalyticsEvent,
  trackPageView,
  trackProjectInteraction,
  trackNewsletterInteraction,
  trackNavigationClick,
  trackPerformanceEvent,
  trackErrorEvent,
  validateEvent
} from './events';

// Analytics initialization state
interface AnalyticsInitState {
  initialized: boolean;
  providers: {
    ga4: boolean;
    sentry: boolean;
    performance: boolean;
  };
  consentLevel: ConsentLevel;
  initializationTime: number;
  errors: string[];
}

// Global initialization state
let analyticsState: AnalyticsInitState = {
  initialized: false,
  providers: {
    ga4: false,
    sentry: false,
    performance: false
  },
  consentLevel: 'none',
  initializationTime: 0,
  errors: []
};

// Analytics configuration interface
export interface AnalyticsInitConfig {
  consentLevel: ConsentLevel;
  environment?: 'development' | 'staging' | 'production';
  enableDebug?: boolean;
  providers?: {
    ga4?: boolean;
    sentry?: boolean;
    performance?: boolean;
  };
  privacyMode?: boolean;
  sessionId?: string;
  userId?: string;
}

/**
 * Initialize analytics system with provided configuration
 */
export async function initializeAnalytics(config: AnalyticsInitConfig): Promise<AnalyticsInitState> {
  const startTime = Date.now();

  try {
    debugUtils.log('info', '[Analytics Init] Starting analytics initialization', {
      consentLevel: config.consentLevel,
      environment: config.environment,
      enableDebug: config.enableDebug
    });

    // Reset state
    analyticsState = {
      initialized: false,
      providers: {
        ga4: false,
        sentry: false,
        performance: false
      },
      consentLevel: config.consentLevel,
      initializationTime: 0,
      errors: []
    };

    // Get environment-specific configuration
    const envConfig = getCurrentEnvConfig();

    // Validate consent level
    if (!isValidConsentLevel(config.consentLevel)) {
      throw new Error(`Invalid consent level: ${config.consentLevel}`);
    }

    // Initialize providers based on consent and configuration
    const initPromises: Promise<void>[] = [];

    // Initialize GA4 if consent allows and enabled
    if (shouldInitializeGA4(config)) {
      initPromises.push(initializeGA4Provider(config));
    }

    // Initialize Sentry (always enabled for essential error tracking)
    if (shouldInitializeSentry(config)) {
      initPromises.push(initializeSentryProvider(config));
    }

    // Initialize performance monitoring if consent allows
    if (shouldInitializePerformance(config)) {
      initPromises.push(initializePerformanceProvider(config));
    }

    // Wait for all providers to initialize
    const results = await Promise.allSettled(initPromises);

    // Process initialization results
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const providerName = ['ga4', 'sentry', 'performance'][index];
        analyticsState.errors.push(`${providerName}: ${result.reason.message}`);
        debugUtils.log('error', `[Analytics Init] Provider ${providerName} failed to initialize`, result.reason);
      }
    });

    // Mark as initialized
    analyticsState.initialized = true;
    analyticsState.initializationTime = Date.now() - startTime;

    // Make analytics functions globally available
    if (typeof window !== 'undefined') {
      window.analytics = {
        createAnalyticsEvent,
        trackPageView,
        trackProjectInteraction,
        trackNewsletterInteraction,
        trackNavigationClick,
        trackPerformanceEvent,
        trackErrorEvent,
        validateEvent,
        getState: () => ({ ...analyticsState }),
        reinitialize: (newConfig: AnalyticsInitConfig) => initializeAnalytics(newConfig)
      };

      // Signal that analytics is ready
      window.dispatchEvent(new CustomEvent('analyticsInitialized', {
        detail: analyticsState
      }));
    }

    // Track initialization success
    if (config.consentLevel !== 'none') {
      const initEvent = createAnalyticsEvent('performance_metric', 'analytics_initialized', {
        label: 'initialization_complete',
        value: analyticsState.initializationTime,
        consentLevel: config.consentLevel,
        sessionId: config.sessionId,
        userId: config.userId
      });

      if (initEvent && validateEvent(initEvent).valid) {
        debugUtils.log('info', '[Analytics Init] Initialization event created', {
          eventId: initEvent.id,
          consentLevel: config.consentLevel
        });
      }
    }

    debugUtils.log('info', '[Analytics Init] Analytics initialization complete', {
      duration: analyticsState.initializationTime,
      providers: analyticsState.providers,
      errors: analyticsState.errors.length
    });

    return analyticsState;

  } catch (error) {
    analyticsState.errors.push(error instanceof Error ? error.message : 'Unknown initialization error');
    analyticsState.initializationTime = Date.now() - startTime;

    debugUtils.log('error', '[Analytics Init] Analytics initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: analyticsState.initializationTime
    });

    throw error;
  }
}

/**
 * Initialize GA4 provider
 */
async function initializeGA4Provider(config: AnalyticsInitConfig): Promise<void> {
  try {
    const ga4Config = {
      measurementId: GA4_CONFIG.config.measurementId,
      privacySettings: {
        ...GA4_CONFIG.config,
        anonymize_ip: config.privacyMode || GA4_CONFIG.config.anonymize_ip,
        allow_ad_personalization_signals: config.consentLevel === 'marketing'
      }
    };

    await initializeGA4(ga4Config);
    analyticsState.providers.ga4 = true;

    debugUtils.log('info', '[Analytics Init] GA4 provider initialized successfully');
  } catch (error) {
    debugUtils.log('error', '[Analytics Init] GA4 provider initialization failed', error);
    throw error;
  }
}

/**
 * Initialize Sentry provider
 */
async function initializeSentryProvider(config: AnalyticsInitConfig): Promise<void> {
  try {
    const sentryConfig = {
      ...SENTRY_CONFIG.config,
      beforeSend: (event: any) => {
        // Apply privacy filters based on consent level
        if (config.consentLevel === 'none') {
          return null; // Don't send events without consent
        }
        return event;
      }
    };

    await initializeSentry(sentryConfig);
    analyticsState.providers.sentry = true;

    debugUtils.log('info', '[Analytics Init] Sentry provider initialized successfully');
  } catch (error) {
    debugUtils.log('error', '[Analytics Init] Sentry provider initialization failed', error);
    throw error;
  }
}

/**
 * Initialize performance monitoring provider
 */
async function initializePerformanceProvider(config: AnalyticsInitConfig): Promise<void> {
  try {
    const performanceConfig = {
      consentLevel: config.consentLevel,
      enableDetailedTracking: config.consentLevel === 'analytics' || config.consentLevel === 'marketing',
      enableRUM: true,
      enableBudgetMonitoring: true,
      samplingRate: config.environment === 'production' ? 0.1 : 1.0,
      reportAllChanges: config.enableDebug || false
    };

    await initializePerformanceMonitoring(performanceConfig);
    analyticsState.providers.performance = true;

    debugUtils.log('info', '[Analytics Init] Performance provider initialized successfully');
  } catch (error) {
    debugUtils.log('error', '[Analytics Init] Performance provider initialization failed', error);
    throw error;
  }
}

/**
 * Check if GA4 should be initialized
 */
function shouldInitializeGA4(config: AnalyticsInitConfig): boolean {
  return (
    config.providers?.ga4 !== false &&
    GA4_CONFIG.enabled &&
    (config.consentLevel === 'analytics' || config.consentLevel === 'marketing' || config.consentLevel === 'full')
  );
}

/**
 * Check if Sentry should be initialized
 */
function shouldInitializeSentry(config: AnalyticsInitConfig): boolean {
  return (
    config.providers?.sentry !== false &&
    SENTRY_CONFIG.enabled &&
    config.consentLevel !== 'none'
  );
}

/**
 * Check if performance monitoring should be initialized
 */
function shouldInitializePerformance(config: AnalyticsInitConfig): boolean {
  return (
    config.providers?.performance !== false &&
    ANALYTICS_CONFIG.enablePerformance &&
    (config.consentLevel === 'analytics' || config.consentLevel === 'marketing' || config.consentLevel === 'full')
  );
}

/**
 * Validate consent level
 */
function isValidConsentLevel(level: string): level is ConsentLevel {
  const validLevels: ConsentLevel[] = ['none', 'essential', 'functional', 'analytics', 'marketing', 'full'];
  return validLevels.includes(level as ConsentLevel);
}

/**
 * Reinitialize analytics with new consent level
 */
export async function reinitializeAnalytics(newConsentLevel: ConsentLevel): Promise<AnalyticsInitState> {
  debugUtils.log('info', '[Analytics Init] Reinitializing analytics with new consent level', {
    oldLevel: analyticsState.consentLevel,
    newLevel: newConsentLevel
  });

  const config: AnalyticsInitConfig = {
    consentLevel: newConsentLevel,
    environment: getCurrentEnvConfig().environment as 'development' | 'staging' | 'production',
    enableDebug: getCurrentEnvConfig().debugMode
  };

  return initializeAnalytics(config);
}

/**
 * Get current analytics state
 */
export function getAnalyticsState(): AnalyticsInitState {
  return { ...analyticsState };
}

/**
 * Check if analytics is initialized
 */
export function isAnalyticsInitialized(): boolean {
  return analyticsState.initialized;
}

/**
 * Get analytics provider status
 */
export function getProviderStatus() {
  return {
    ga4: {
      enabled: analyticsState.providers.ga4,
      configured: GA4_CONFIG.enabled,
      consentRequired: 'analytics' as ConsentLevel
    },
    sentry: {
      enabled: analyticsState.providers.sentry,
      configured: SENTRY_CONFIG.enabled,
      consentRequired: 'essential' as ConsentLevel
    },
    performance: {
      enabled: analyticsState.providers.performance,
      configured: ANALYTICS_CONFIG.enablePerformance,
      consentRequired: 'analytics' as ConsentLevel
    }
  };
}

/**
 * Track analytics provider events
 */
export function trackProviderEvent(providerName: string, eventType: string, data?: Record<string, any>) {
  if (analyticsState.consentLevel !== 'none') {
    const event = createAnalyticsEvent('engagement', `provider_${eventType}`, {
      label: providerName,
      consentLevel: analyticsState.consentLevel,
      ...data
    });

    if (event && validateEvent(event).valid) {
      debugUtils.log('info', `[Analytics Init] Provider event tracked: ${providerName}.${eventType}`, {
        eventId: event.id
      });
    }
  }
}

/**
 * Cleanup analytics resources (for testing or shutdown)
 */
export function cleanupAnalytics(): void {
  if (typeof window !== 'undefined') {
    delete (window as any).analytics;
  }

  analyticsState = {
    initialized: false,
    providers: {
      ga4: false,
      sentry: false,
      performance: false
    },
    consentLevel: 'none',
    initializationTime: 0,
    errors: []
  };

  debugUtils.log('info', '[Analytics Init] Analytics resources cleaned up');
}

// Default export for easy importing
export default {
  initializeAnalytics,
  reinitializeAnalytics,
  getAnalyticsState,
  isAnalyticsInitialized,
  getProviderStatus,
  trackProviderEvent,
  cleanupAnalytics
};

// Global type augmentation
declare global {
  interface Window {
    analytics?: {
      createAnalyticsEvent: typeof createAnalyticsEvent;
      trackPageView: typeof trackPageView;
      trackProjectInteraction: typeof trackProjectInteraction;
      trackNewsletterInteraction: typeof trackNewsletterInteraction;
      trackNavigationClick: typeof trackNavigationClick;
      trackPerformanceEvent: typeof trackPerformanceEvent;
      trackErrorEvent: typeof trackErrorEvent;
      validateEvent: typeof validateEvent;
      getState: () => AnalyticsInitState;
      reinitialize: (config: AnalyticsInitConfig) => Promise<AnalyticsInitState>;
    };
  }
}