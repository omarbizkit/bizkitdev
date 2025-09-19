/**
 * Analytics Events Module
 *
 * Central event tracking and dispatch system for user interactions,
 * performance metrics, and conversion tracking.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type {
  AnalyticsEvent as AnalyticsEventInterface,
  EventCategory,
  ConsentLevel,
  PageContext,
  UserContext,
  DeviceType,
  validateAnalyticsEvent
} from '../../types/analytics';
import { getCurrentEnvConfig } from './config';
import { v4 as uuidv4 } from 'uuid';
import { debugUtils } from './utils';

// Event types for analytics tracking
export interface AnalyticsEvent {
  eventName: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  consentLevel: ConsentLevel;
  userAgent: string;
  deviceType: string;
  url: string;
  sessionId?: string;
}

// Event queue for batch processing
let eventQueue: AnalyticsEvent[] = [];
let eventCallback: ((event: AnalyticsEvent) => void) | null = null;

// Track user interaction events
export const trackEvent = (
  eventName: string,
  category: string,
  action: string,
  options?: {
    label?: string;
    value?: number;
    consentLevel?: ConsentLevel;
  }
): void => {
  try {
    const consentLevel = options?.consentLevel ?? 'essential';

    // Check consent for tracking
    if (!canTrackEvents(consentLevel)) {
      debugUtils.log('info', `[Events] Skipping event due to insufficient consent`, {
        event: eventName,
        consentLevel,
        required: 'analytics'
      });
      return;
    }

    const event: AnalyticsEvent = {
      eventName,
      category,
      action,
      label: options?.label,
      value: options?.value,
      timestamp: Date.now(),
      consentLevel,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      url: window.location.href
    };

    eventQueue.push(event);

    // Call callback if available
    if (eventCallback) {
      eventCallback(event);
    }

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('Analytics Event:', event);
    }
  } catch (error) {
    debugUtils.log('error', '[Events] Error tracking event', error);
  }
};

// Check if events can be tracked based on consent
const canTrackEvents = (consentLevel: ConsentLevel): boolean => {
  const consentHierarchy = ['none', 'essential', 'functional', 'analytics', 'marketing'];
  const currentIndex = consentHierarchy.indexOf(consentLevel);
  const analyticsIndex = consentHierarchy.indexOf('analytics');
  return currentIndex >= analyticsIndex;
};

// Simple device type detection
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Set event processing callback
export const setEventCallback = (callback: (event: AnalyticsEvent) => void): void => {
  eventCallback = callback;
};

// Get queued events
export const getEventQueue = (): AnalyticsEvent[] => {
  return [...eventQueue];
};

// Clear event queue (for testing or batch processing)
export const clearEventQueue = (): void => {
  eventQueue = [];
};

// Track specific conversion events
export const trackConversion = (goalId: string, value?: number): void => {
  trackEvent('conversion', 'goal', goalId, {
    value: value ?? 1,
    consentLevel: 'marketing'
  });
};

// Track form interactions
export const trackFormInteraction = (
  formId: string,
  interaction: 'start' | 'complete' | 'error',
  error?: string
): void => {
  trackEvent('form_interaction', 'engagement', interaction, {
    label: formId + (error ? `:${error}` : ''),
    consentLevel: 'analytics'
  });
};

// Server-side event tracking (for API endpoints)
export const trackEventServer = async (eventData: any): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    // Convert API request format to internal AnalyticsEvent format
    const analyticsEvent: AnalyticsEvent = {
      eventName: eventData.type,
      category: eventData.type,
      action: eventData.data?.action || 'event',
      label: eventData.data?.label,
      value: eventData.data?.value,
      timestamp: new Date(eventData.timestamp).getTime(),
      consentLevel: eventData.consent_level,
      userAgent: eventData.data?.user_agent || 'unknown',
      deviceType: getDeviceTypeFromUA(eventData.data?.user_agent || ''),
      url: eventData.data?.page || 'unknown',
      sessionId: eventData.session_id
    };

    // Add to event queue for processing (only in browser environment)
    if (typeof window !== 'undefined') {
      eventQueue.push(analyticsEvent);

      // Call callback if available
      if (eventCallback) {
        eventCallback(analyticsEvent);
      }
    }

    // Server-side logging
    console.log('Server Analytics Event:', analyticsEvent);

    return {
      success: true,
      eventId: generateEventId()
    };
  } catch (error) {
    console.error('[Events] Error tracking server event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Server-safe event ID generation
const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'evt_' + Math.random().toString(36).substr(2) + '_' + Date.now().toString(36);
};

// Helper function to detect device type from user agent
const getDeviceTypeFromUA = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  return 'desktop';
};

export default {
  trackEvent,
  trackEventServer,
  setEventCallback,
  getEventQueue,
  clearEventQueue,
  trackConversion,
  trackFormInteraction,
  createAnalyticsEvent,
  trackPageView,
  trackProjectInteraction,
  trackNewsletterInteraction,
  trackNavigationClick,
  trackPerformanceEvent,
  trackErrorEvent,
  validateEvent
};

// =============================================================================
// T076-T083: Core Analytics Functions Implementation
// =============================================================================

/**
 * T076: Create a standardized analytics event with full validation and context
 *
 * Factory function for generating AnalyticsEvent objects according to the data model
 * Includes validation, ID generation, timestamp assignment, and consent checking
 */
export const createAnalyticsEvent = (
  category: EventCategory,
  action: string,
  options?: {
    label?: string;
    value?: number;
    pageContext?: Partial<PageContext>;
    userContext?: Partial<UserContext>;
    sessionId?: string;
    userId?: string;
    consentLevel?: ConsentLevel;
    anonymized?: boolean;
  }
): AnalyticsEventInterface | null => {
  try {
    const timestamp = Date.now();
    const sessionId = options?.sessionId || getOrCreateSessionId();
    const consentLevel = options?.consentLevel ?? ConsentLevel.ANALYTICS;

    // Check if we have sufficient consent for this event category
    if (!hasSufficientConsent(category, consentLevel)) {
      debugUtils.log('info', `[Events] Insufficient consent for event category: ${category}`, {
        required: getRequiredConsentLevel(category),
        provided: consentLevel
      });
      return null;
    }

    // Build complete page context
    const pageContext: PageContext = {
      path: options?.pageContext?.path ?? window.location.pathname,
      title: options?.pageContext?.title ?? document.title,
      url: options?.pageContext?.url ?? window.location.href,
      referrer: options?.pageContext?.referrer ?? document.referrer,
      queryParams: options?.pageContext?.queryParams ?? getQueryParams(),
      hash: options?.pageContext?.hash ?? window.location.hash,
      loadTime: options?.pageContext?.loadTime ?? getPageLoadTime(),
      ...options?.pageContext
    };

    // Build complete user context
    const userContext: UserContext = {
      deviceType: options?.userContext?.deviceType ?? getDeviceTypeFromWindow(),
      screenResolution: options?.userContext?.screenResolution ?? getScreenResolution(),
      viewportSize: options?.userContext?.viewportSize ?? getViewportSize(),
      userAgent: options?.userContext?.userAgent ?? navigator.userAgent,
      browserName: options?.userContext?.browserName ?? getBrowserName(),
      browserVersion: options?.userContext?.browserVersion ?? getBrowserVersion(),
      platform: options?.userContext?.platform ?? navigator.platform,
      timezone: options?.userContext?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: options?.userContext?.language ?? navigator.language,
      isFirstVisit: options?.userContext?.isFirstVisit ?? checkIfFirstVisit(),
      sessionStartTime: options?.userContext?.sessionStartTime ?? getSessionStartTime(),
      pageViews: options?.userContext?.pageViews ?? incrementPageViewCount(),
      ...options?.userContext
    };

    // Create the analytics event
    const event: AnalyticsEventInterface = {
      id: uuidv4(),
      timestamp,
      sessionId,
      userId: options?.userId,
      category,
      action,
      label: options?.label,
      value: options?.value,
      page: pageContext,
      user: userContext,
      consentLevel,
      anonymized: options?.anonymized ?? shouldAnonymizeEvent(category, consentLevel)
    };

    // Validate the event structure
    if (!validateAnalyticsEvent(event)) {
      debugUtils.log('error', '[Events] Event validation failed', { event });
      return null;
    }

    // Log event creation in debug mode
    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('Analytics Event Created:', event);
    }

    return event;
  } catch (error) {
    debugUtils.log('error', '[Events] Error creating analytics event', error);
    return null;
  }
};

/**
 * T077: Track page view events with comprehensive context
 */
export const trackPageView = (
  path?: string,
  title?: string,
  options?: {
    referrer?: string;
    loadTime?: number;
    consentLevel?: ConsentLevel;
    customData?: Record<string, any>;
  }
): void => {
  const event = createAnalyticsEvent(
    EventCategory.PAGE_VIEW,
    'view',
    {
      label: path ?? window.location.pathname,
      pageContext: {
        path: path ?? window.location.pathname,
        title: title ?? document.title,
        url: window.location.href,
        referrer: options?.referrer ?? document.referrer,
        loadTime: options?.loadTime
      },
      consentLevel: options?.consentLevel ?? ConsentLevel.ANALYTICS
    }
  );

  if (event) {
    // Track the event using existing infrastructure
    trackEvent('page_view', EventCategory.PAGE_VIEW, 'view', {
      label: event.page.path,
      consentLevel: event.consentLevel
    });

    debugUtils.log('info', '[Events] Page view tracked', {
      path: event.page.path,
      title: event.page.title
    });
  }
};

/**
 * T078: Track project interactions (clicks, views, engagement)
 */
export const trackProjectInteraction = (
  projectId: string,
  projectName: string,
  interactionType: 'view' | 'click' | 'hover' | 'expand',
  techStack?: string[],
  options?: {
    category?: string;
    consentLevel?: ConsentLevel;
    customData?: Record<string, any>;
  }
): void => {
  const event = createAnalyticsEvent(
    EventCategory.PROJECT_CLICK,
    interactionType,
    {
      label: `${projectId}:${interactionType}`,
      value: interactionType === 'click' ? 1 : undefined,
      pageContext: {
        path: window.location.pathname,
        title: document.title,
        url: window.location.href
      },
      userContext: {
        // Add tech stack to user context for segmentation
        ...options?.customData
      },
      consentLevel: options?.consentLevel ?? ConsentLevel.ANALYTICS
    }
  );

  if (event) {
    // Add project-specific metadata
    const enrichedEvent = {
      ...event,
      customData: {
        projectId,
        projectName,
        techStack: techStack ?? [],
        interactionType,
        ...options?.customData
      }
    };

    trackEvent('project_interaction', EventCategory.PROJECT_CLICK, interactionType, {
      label: `${projectName}:${interactionType}`,
      value: interactionType === 'click' ? 1 : undefined,
      consentLevel: event.consentLevel
    });

    debugUtils.log('info', '[Events] Project interaction tracked', {
      projectId,
      projectName,
      interactionType
    });
  }
};

/**
 * T079: Track newsletter signup funnel events
 */
export const trackNewsletterInteraction = (
  interactionType: 'view' | 'start' | 'email_input' | 'submit' | 'success' | 'error' | 'validation_error',
  email?: string,
  errorMessage?: string,
  options?: {
    formId?: string;
    consentLevel?: ConsentLevel;
    customData?: Record<string, any>;
  }
): void => {
  const event = createAnalyticsEvent(
    EventCategory.NEWSLETTER_SIGNUP,
    interactionType,
    {
      label: interactionType === 'error' || interactionType === 'validation_error'
        ? `${interactionType}:${errorMessage ?? 'unknown'}`
        : interactionType,
      value: interactionType === 'success' ? 1 : undefined,
      pageContext: {
        path: window.location.pathname,
        title: document.title,
        url: window.location.href
      },
      consentLevel: options?.consentLevel ?? ConsentLevel.MARKETING
    }
  );

  if (event) {
    // Add newsletter-specific metadata
    const enrichedEvent = {
      ...event,
      customData: {
        formId: options?.formId ?? 'default',
        interactionType,
        emailDomain: email ? email.split('@')[1] : undefined,
        errorMessage: errorMessage,
        ...options?.customData
      }
    };

    trackEvent('newsletter_interaction', EventCategory.NEWSLETTER_SIGNUP, interactionType, {
      label: interactionType,
      value: interactionType === 'success' ? 1 : undefined,
      consentLevel: event.consentLevel
    });

    debugUtils.log('info', '[Events] Newsletter interaction tracked', {
      interactionType,
      formId: options?.formId
    });
  }
};

/**
 * T080: Track navigation clicks and user journey patterns
 */
export const trackNavigationClick = (
  navigationItem: string,
  navigationType: 'main_menu' | 'mobile_menu' | 'footer' | 'breadcrumb' | 'external',
  url?: string,
  isExternal: boolean = false,
  options?: {
    consentLevel?: ConsentLevel;
    customData?: Record<string, any>;
  }
): void => {
  const action = isExternal ? 'external_click' : 'internal_click';
  const event = createAnalyticsEvent(
    EventCategory.NAVIGATION_CLICK,
    action,
    {
      label: `${navigationType}:${navigationItem}`,
      pageContext: {
        path: window.location.pathname,
        title: document.title,
        url: window.location.href
      },
      consentLevel: options?.consentLevel ?? ConsentLevel.ANALYTICS
    }
  );

  if (event) {
    // Add navigation-specific metadata
    const enrichedEvent = {
      ...event,
      customData: {
        navigationItem,
        navigationType,
        destinationUrl: url,
        isExternal,
        ...options?.customData
      }
    };

    trackEvent('navigation_click', EventCategory.NAVIGATION_CLICK, action, {
      label: `${navigationType}:${navigationItem}`,
      consentLevel: event.consentLevel
    });

    debugUtils.log('info', '[Events] Navigation click tracked', {
      navigationItem,
      navigationType,
      isExternal
    });
  }
};

/**
 * T081: Track performance events and Core Web Vitals
 */
export const trackPerformanceEvent = (
  metricName: string,
  value: number,
  rating: 'good' | 'needs-improvement' | 'poor',
  options?: {
    unit?: string;
    deviceType?: DeviceType;
    connectionType?: string;
    consentLevel?: ConsentLevel;
    customData?: Record<string, any>;
  }
): void => {
  const event = createAnalyticsEvent(
    EventCategory.PERFORMANCE_METRIC,
    'metric_recorded',
    {
      label: metricName,
      value,
      pageContext: {
        path: window.location.pathname,
        title: document.title,
        url: window.location.href
      },
      userContext: {
        deviceType: options?.deviceType ?? getDeviceTypeFromWindow(),
        ...options?.customData
      },
      consentLevel: options?.consentLevel ?? ConsentLevel.ANALYTICS
    }
  );

  if (event) {
    // Add performance-specific metadata
    const enrichedEvent = {
      ...event,
      customData: {
        metricName,
        value,
        rating,
        unit: options?.unit ?? 'ms',
        connectionType: options?.connectionType ?? getConnectionType(),
        ...options?.customData
      }
    };

    trackEvent('performance_metric', EventCategory.PERFORMANCE_METRIC, 'metric_recorded', {
      label: metricName,
      value,
      consentLevel: event.consentLevel
    });

    debugUtils.log('info', '[Events] Performance metric tracked', {
      metricName,
      value,
      rating
    });
  }
};

/**
 * T082: Track error events with comprehensive context
 */
export const trackErrorEvent = (
  errorType: 'javascript_error' | 'network_error' | 'promise_rejection' | 'resource_error',
  errorMessage: string,
  errorStack?: string,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  options?: {
    filename?: string;
    lineNumber?: number;
    columnNumber?: number;
    consentLevel?: ConsentLevel;
    customData?: Record<string, any>;
  }
): void => {
  const event = createAnalyticsEvent(
    EventCategory.ERROR_OCCURRED,
    errorType,
    {
      label: `${errorType}:${severity}`,
      pageContext: {
        path: window.location.pathname,
        title: document.title,
        url: window.location.href
      },
      consentLevel: options?.consentLevel ?? ConsentLevel.ANALYTICS
    }
  );

  if (event) {
    // Add error-specific metadata
    const enrichedEvent = {
      ...event,
      customData: {
        errorType,
        errorMessage,
        errorStack: errorStack ? sanitizeStackTrace(errorStack) : undefined,
        severity,
        filename: options?.filename,
        lineNumber: options?.lineNumber,
        columnNumber: options?.columnNumber,
        userAgent: navigator.userAgent.substring(0, 200), // Truncate for privacy
        ...options?.customData
      }
    };

    trackEvent('error_occurred', EventCategory.ERROR_OCCURRED, errorType, {
      label: `${errorType}:${severity}`,
      consentLevel: event.consentLevel
    });

    debugUtils.log('error', '[Events] Error event tracked', {
      errorType,
      errorMessage,
      severity
    });
  }
};

/**
 * T083: Enhanced validation function for analytics events
 */
export const validateEvent = (event: AnalyticsEventInterface): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Core validation
  if (!event.id || typeof event.id !== 'string' || event.id.length === 0) {
    errors.push('Event ID is required and must be a non-empty string');
  }

  if (!event.timestamp || typeof event.timestamp !== 'number' || event.timestamp <= 0) {
    errors.push('Timestamp is required and must be a positive number');
  }

  if (!event.sessionId || typeof event.sessionId !== 'string' || event.sessionId.length === 0) {
    errors.push('Session ID is required and must be a non-empty string');
  }

  // Category validation
  if (!Object.values(EventCategory).includes(event.category)) {
    errors.push(`Invalid event category: ${event.category}`);
  }

  if (!event.action || typeof event.action !== 'string' || event.action.length === 0) {
    errors.push('Action is required and must be a non-empty string');
  }

  // Page context validation
  if (!event.page || !event.page.path || typeof event.page.path !== 'string') {
    errors.push('Page path is required and must be a string');
  }

  if (!event.page.title || typeof event.page.title !== 'string') {
    errors.push('Page title is required and must be a string');
  }

  if (!event.page.url || typeof event.page.url !== 'string') {
    errors.push('Page URL is required and must be a string');
  }

  // User context validation
  if (!event.user || !event.user.deviceType || !Object.values(DeviceType).includes(event.user.deviceType)) {
    errors.push('User device type is required and must be a valid DeviceType');
  }

  if (!event.user.userAgent || typeof event.user.userAgent !== 'string') {
    errors.push('User agent is required and must be a string');
  }

  if (!event.user.timezone || typeof event.user.timezone !== 'string') {
    errors.push('User timezone is required and must be a string');
  }

  if (!event.user.language || typeof event.user.language !== 'string') {
    errors.push('User language is required and must be a string');
  }

  // Consent validation
  if (!Object.values(ConsentLevel).includes(event.consentLevel)) {
    errors.push(`Invalid consent level: ${event.consentLevel}`);
  }

  // Check consent level is sufficient for the event category
  const requiredConsent = getRequiredConsentLevel(event.category);
  if (!hasSufficientConsent(event.category, event.consentLevel)) {
    errors.push(`Insufficient consent level. Required: ${requiredConsent}, Provided: ${event.consentLevel}`);
  }

  // Privacy validation
  if (typeof event.anonymized !== 'boolean') {
    errors.push('Anonymized flag must be a boolean');
  }

  // Optional field validation
  if (event.label !== undefined && typeof event.label !== 'string') {
    errors.push('Label must be a string if provided');
  }

  if (event.value !== undefined && typeof event.value !== 'number') {
    errors.push('Value must be a number if provided');
  }

  if (event.userId !== undefined && typeof event.userId !== 'string') {
    errors.push('User ID must be a string if provided');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// =============================================================================
// HELPER FUNCTIONS FOR CORE ANALYTICS FUNCTIONS
// =============================================================================

/**
 * Get or create a session ID for analytics tracking
 */
const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem('analytics_session_id', sessionId);
    sessionStorage.setItem('session_start_time', Date.now().toString());
  }
  return sessionId;
};

/**
 * Check if current consent level is sufficient for event category
 */
const hasSufficientConsent = (category: EventCategory, currentConsent: ConsentLevel): boolean => {
  const requiredConsent = getRequiredConsentLevel(category);
  const consentHierarchy = [
    ConsentLevel.NONE,
    ConsentLevel.ESSENTIAL,
    ConsentLevel.FUNCTIONAL,
    ConsentLevel.ANALYTICS,
    ConsentLevel.MARKETING,
    ConsentLevel.FULL
  ];

  const currentIndex = consentHierarchy.indexOf(currentConsent);
  const requiredIndex = consentHierarchy.indexOf(requiredConsent);

  return currentIndex >= requiredIndex;
};

/**
 * Get the minimum consent level required for an event category
 */
const getRequiredConsentLevel = (category: EventCategory): ConsentLevel => {
  switch (category) {
    case EventCategory.PAGE_VIEW:
    case EventCategory.PAGE_SCROLL:
    case EventCategory.PAGE_EXIT:
      return ConsentLevel.ESSENTIAL;

    case EventCategory.PROJECT_VIEW:
    case EventCategory.PROJECT_CLICK:
    case EventCategory.PROJECT_FILTER:
    case EventCategory.TECH_STACK_CLICK:
    case EventCategory.NAVIGATION_CLICK:
    case EventCategory.EXTERNAL_LINK_CLICK:
    case EventCategory.SOCIAL_LINK_CLICK:
    case EventCategory.CONTACT_FORM_VIEW:
    case EventCategory.CONTACT_FORM_SUBMIT:
      return ConsentLevel.ANALYTICS;

    case EventCategory.NEWSLETTER_SIGNUP:
    case EventCategory.NEWSLETTER_SUCCESS:
    case EventCategory.NEWSLETTER_ERROR:
      return ConsentLevel.MARKETING;

    case EventCategory.PERFORMANCE_METRIC:
    case EventCategory.ERROR_OCCURRED:
    case EventCategory.SLOW_LOADING:
      return ConsentLevel.ANALYTICS;

    case EventCategory.TIME_ON_PAGE:
    case EventCategory.SCROLL_DEPTH:
    case EventCategory.CTA_INTERACTION:
      return ConsentLevel.ANALYTICS;

    default:
      return ConsentLevel.ANALYTICS;
  }
};

/**
 * Determine if an event should be anonymized based on category and consent
 */
const shouldAnonymizeEvent = (category: EventCategory, consentLevel: ConsentLevel): boolean => {
  // Always anonymize if consent level is below analytics
  if (consentLevel === ConsentLevel.NONE || consentLevel === ConsentLevel.ESSENTIAL) {
    return true;
  }

  // Anonymize error events by default for privacy
  if (category === EventCategory.ERROR_OCCURRED) {
    return true;
  }

  // Default to false for analytics and above
  return false;
};

/**
 * Get device type from window size
 */
const getDeviceTypeFromWindow = (): DeviceType => {
  if (typeof window === 'undefined') return DeviceType.UNKNOWN;

  const width = window.innerWidth;
  if (width < 768) return DeviceType.MOBILE;
  if (width < 1024) return DeviceType.TABLET;
  return DeviceType.DESKTOP;
};

/**
 * Get screen resolution
 */
const getScreenResolution = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  return `${window.screen.width}x${window.screen.height}`;
};

/**
 * Get viewport size
 */
const getViewportSize = (): string => {
  if (typeof window === 'undefined') return 'unknown';
  return `${window.innerWidth}x${window.innerHeight}`;
};

/**
 * Get browser name from user agent
 */
const getBrowserName = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Unknown';
};

/**
 * Get browser version from user agent
 */
const getBrowserVersion = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';

  const ua = navigator.userAgent;
  const matches = ua.match(/(chrome|firefox|safari|edge|opera)\/(\d+\.\d+)/i);
  return matches ? matches[2] : 'unknown';
};

/**
 * Get query parameters from current URL
 */
const getQueryParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};

  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    result[key] = value;
  }

  return result;
};

/**
 * Get page load time
 */
const getPageLoadTime = (): number | undefined => {
  if (typeof performance === 'undefined' || !performance.timing) return undefined;

  const timing = performance.timing;
  return timing.loadEventEnd - timing.navigationStart;
};

/**
 * Check if this is the user's first visit
 */
const checkIfFirstVisit = (): boolean => {
  if (typeof localStorage === 'undefined') return true;

  const hasVisited = localStorage.getItem('has_visited');
  if (!hasVisited) {
    localStorage.setItem('has_visited', 'true');
    return true;
  }
  return false;
};

/**
 * Get session start time
 */
const getSessionStartTime = (): number => {
  if (typeof sessionStorage === 'undefined') return Date.now();

  const stored = sessionStorage.getItem('session_start_time');
  if (stored) {
    return parseInt(stored, 10);
  }

  const now = Date.now();
  sessionStorage.setItem('session_start_time', now.toString());
  return now;
};

/**
 * Increment and return page view count for current session
 */
const incrementPageViewCount = (): number => {
  if (typeof sessionStorage === 'undefined') return 1;

  const count = parseInt(sessionStorage.getItem('page_view_count') || '0', 10) + 1;
  sessionStorage.setItem('page_view_count', count.toString());
  return count;
};

/**
 * Get connection type (simplified)
 */
const getConnectionType = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';

  // @ts-ignore - connection may not be available in all browsers
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection) {
    return connection.effectiveType || 'unknown';
  }

  return 'unknown';
};

/**
 * Sanitize stack trace for privacy
 */
const sanitizeStackTrace = (stack: string): string => {
  // Remove file paths and line numbers for privacy
  return stack
    .replace(/\(https?:\/\/[^)]+\)/g, '(source)')
    .replace(/:\d+:\d+/g, ':line:col')
    .substring(0, 1000); // Limit length
};