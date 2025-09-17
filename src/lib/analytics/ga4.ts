/**
 * Google Analytics 4 Integration
 *
 * Privacy-enhanced GA4 implementation with consent management.
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import { gtag } from 'gtag';
import type {
  AnalyticsEvent,
  EventCategory,
  ConsentLevel,
  GtagEvent
} from '../../types/analytics';
import { ENHANCED_GA4_PROVIDER, GA4_CONSENT_STATES, getCurrentEnvConfig } from './config';

// Track if GA4 has been initialized
let ga4Initialized = false;
let currentConsentLevel: ConsentLevel = 'none';

// Initialize Google Analytics 4
export const initializeGA4 = async (consentLevel: ConsentLevel = 'none'): Promise<boolean> => {
  if (!ENHANCED_GA4_PROVIDER.enabled || !ENHANCED_GA4_PROVIDER.config.measurementId) {
    console.warn('GA4 is not enabled - missing measurement ID');
    return false;
  }

  // Only initialize if consent allows analytics
  if (!canTrackWithConsent(consentLevel)) {
    console.log('GA4 initialization skipped - insufficient consent level');
    return false;
  }

  try {
    // Load GA4 script dynamically with enhanced privacy settings
    await loadGA4Script();

    // Configure gtag with enhanced privacy settings
    gtag('js', new Date());
    gtag('config', ENHANCED_GA4_PROVIDER.config.measurementId, ENHANCED_GA4_PROVIDER.config);

    // Set consent state
    updateConsentState(consentLevel);

    ga4Initialized = true;
    currentConsentLevel = consentLevel;

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('GA4 initialized successfully with consent level:', consentLevel);
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize GA4:', error);
    return false;
  }
};

// Load GA4 script dynamically
const loadGA4Script = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already exists
    if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ENHANCED_GA4_PROVIDER.config.measurementId}`;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load GA4 script'));

    // Add preconnect hints for better performance
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://www.google-analytics.com';

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://analytics.google.com';

    document.head.appendChild(preconnect1);
    document.head.appendChild(preconnect2);
    document.head.appendChild(script);
  });
};

// Check if tracking is allowed based on consent level
const canTrackWithConsent = (consentLevel: ConsentLevel): boolean => {
  const requiredLevel = ENHANCED_GA4_PROVIDER.consentRequired;

  const consentHierarchy: ConsentLevel[] = [
    'none',
    'essential',
    'functional',
    'analytics',
    'marketing',
    'full'
  ];

  const currentIndex = consentHierarchy.indexOf(consentLevel);
  const requiredIndex = consentHierarchy.indexOf(requiredLevel);

  return currentIndex >= requiredIndex;
};

// Update consent state in GA4 with enhanced privacy settings
export const updateConsentState = (consentLevel: ConsentLevel): void => {
  if (!ga4Initialized) return;

  // Use the enhanced consent states from configuration
  const consentSettings = GA4_CONSENT_STATES[consentLevel];

  if (consentSettings) {
    gtag('consent', 'update', consentSettings);

    currentConsentLevel = consentLevel;

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log(`GA4 consent updated to: ${consentLevel}`);
      console.log('Consent settings applied:', consentSettings);
    }
  } else {
    console.warn(`Unknown consent level: ${consentLevel}`);
  }
};

// Track analytics events
export const trackEvent = (event: AnalyticsEvent): void => {
  if (!ga4Initialized || !canTrackWithConsent(currentConsentLevel)) {
    return;
  }

  try {
    const gtagEvent = convertToGtagEvent(event);

    gtag('event', gtagEvent.event_name, gtagEvent.event_parameters);

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('GA4 Event tracked:', gtagEvent);
    }
  } catch (error) {
    console.error('Failed to track GA4 event:', error);
  }
};

// Convert our AnalyticsEvent to GA4 format
const convertToGtagEvent = (event: AnalyticsEvent): GtagEvent => {
  const eventName = mapEventCategoryToGA4(event.category, event.action);

  const eventParameters: Record<string, any> = {
    // Standard GA4 parameters
    page_title: event.page.title,
    page_location: event.page.url,
    page_referrer: event.page.referrer,

    // Custom parameters
    event_category: event.category,
    event_label: event.label,
    value: event.value,

    // Device and user context
    device_type: event.user.deviceType,
    browser_name: event.user.browserName,
    platform: event.user.platform,

    // Session info
    session_id: event.sessionId,
    is_first_visit: event.user.isFirstVisit,
    page_views_in_session: event.user.pageViews,

    // Privacy compliance
    consent_level: event.consentLevel,
    anonymized: event.anonymized
  };

  // Add event-specific parameters
  switch (event.category) {
    case 'project_view':
    case 'project_click':
      eventParameters.item_id = event.label;
      eventParameters.item_name = event.label;
      eventParameters.item_category = 'portfolio_project';
      break;

    case 'newsletter_signup':
      eventParameters.method = 'email';
      eventParameters.content_type = 'newsletter';
      eventParameters.source = event.label || 'unknown';
      break;

    case 'external_link_click':
      eventParameters.link_domain = event.customData?.domain;
      eventParameters.link_text = event.label;
      break;

    case 'performance_metric':
      eventParameters.metric_name = event.label;
      eventParameters.metric_value = event.value;
      break;
  }

  return {
    event_name: eventName,
    event_parameters: eventParameters
  };
};

// Map our event categories to GA4 recommended events
const mapEventCategoryToGA4 = (category: EventCategory, action: string): string => {
  const eventMap: Record<string, Record<string, string>> = {
    page_view: { view: 'page_view' },
    page_scroll: { scroll: 'scroll' },
    project_view: { view: 'view_item' },
    project_click: { click: 'select_item' },
    newsletter_signup: { signup: 'sign_up', success: 'conversion', error: 'exception' },
    navigation_click: { click: 'select_content' },
    external_link_click: { click: 'click' },
    social_link_click: { click: 'social_click' },
    tech_stack_click: { click: 'select_content' },
    contact_form_submit: { submit: 'form_submit' },
    error_occurred: { error: 'exception' },
    performance_metric: { metric: 'timing_complete' },
    time_on_page: { complete: 'timing_complete' },
    scroll_depth: { scroll: 'scroll' },
    cta_interaction: { click: 'select_content' }
  };

  const categoryMap = eventMap[category];
  if (categoryMap && categoryMap[action]) {
    return categoryMap[action];
  }

  // Fallback to generic event name
  return `${category}_${action}`;
};

// Track page views manually (for privacy control)
export const trackPageView = (path: string, title: string): void => {
  if (!ga4Initialized || !canTrackWithConsent(currentConsentLevel)) {
    return;
  }

  gtag('event', 'page_view', {
    page_title: title,
    page_location: window.location.href,
    page_path: path
  });

  const envConfig = getCurrentEnvConfig();
  if (envConfig.enableConsoleLogging) {
    console.log('GA4 Page view tracked:', { path, title });
  }
};

// Enhanced e-commerce tracking for portfolio projects
export const trackProjectInteraction = (
  projectId: string,
  projectName: string,
  action: 'view' | 'click',
  category?: string
): void => {
  if (!ga4Initialized || !canTrackWithConsent(currentConsentLevel)) {
    return;
  }

  const eventName = action === 'view' ? 'view_item' : 'select_item';

  gtag('event', eventName, {
    currency: 'USD',
    value: 0, // Portfolio views don't have monetary value
    items: [{
      item_id: projectId,
      item_name: projectName,
      item_category: category || 'portfolio_project',
      item_brand: 'Omar Torres',
      quantity: 1
    }]
  });

  const envConfig = getCurrentEnvConfig();
  if (envConfig.enableConsoleLogging) {
    console.log('GA4 Project interaction tracked:', { projectId, projectName, action });
  }
};

// Track conversion events (newsletter signup)
export const trackConversion = (
  conversionType: string,
  source?: string,
  value?: number
): void => {
  if (!ga4Initialized || !canTrackWithConsent(currentConsentLevel)) {
    return;
  }

  gtag('event', 'conversion', {
    event_category: 'conversion',
    event_label: conversionType,
    value: value || 0,
    source: source || 'unknown'
  });

  // Also track as sign_up for newsletter
  if (conversionType === 'newsletter_signup') {
    gtag('event', 'sign_up', {
      method: 'email',
      content_type: 'newsletter',
      source: source || 'unknown'
    });
  }

  const envConfig = getCurrentEnvConfig();
  if (envConfig.enableConsoleLogging) {
    console.log('GA4 Conversion tracked:', { conversionType, source, value });
  }
};

// Clean up GA4 resources
export const cleanupGA4 = (): void => {
  if (ga4Initialized) {
    // Clear consent
    gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });

    ga4Initialized = false;
    currentConsentLevel = 'none';

    console.log('GA4 cleaned up and consent revoked');
  }
};

export default {
  initializeGA4,
  updateConsentState,
  trackEvent,
  trackPageView,
  trackProjectInteraction,
  trackConversion,
  cleanupGA4
};