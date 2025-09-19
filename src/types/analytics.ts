/**
 * Analytics Types and Interfaces
 *
 * This file contains all TypeScript interfaces and enums for the
 * Advanced Analytics & Performance Monitoring system.
 *
 * Based on: specs/057-advanced-analytics-monitoring/data-model.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

// =============================================================================
// CORE ANALYTICS ENTITIES
// =============================================================================

/**
 * Event categories for analytics tracking
 */
export enum EventCategory {
  // Page Navigation
  PAGE_VIEW = 'page_view',
  PAGE_SCROLL = 'page_scroll',
  PAGE_EXIT = 'page_exit',

  // Portfolio Interactions
  PROJECT_VIEW = 'project_view',
  PROJECT_CLICK = 'project_click',
  PROJECT_FILTER = 'project_filter',
  TECH_STACK_CLICK = 'tech_stack_click',

  // Newsletter & Contact
  NEWSLETTER_SIGNUP = 'newsletter_signup',
  NEWSLETTER_SUCCESS = 'newsletter_success',
  NEWSLETTER_ERROR = 'newsletter_error',
  CONTACT_FORM_VIEW = 'contact_form_view',
  CONTACT_FORM_SUBMIT = 'contact_form_submit',

  // Navigation & Links
  NAVIGATION_CLICK = 'navigation_click',
  EXTERNAL_LINK_CLICK = 'external_link_click',
  SOCIAL_LINK_CLICK = 'social_link_click',

  // Performance & Errors
  PERFORMANCE_METRIC = 'performance_metric',
  ERROR_OCCURRED = 'error_occurred',
  SLOW_LOADING = 'slow_loading',

  // Engagement
  TIME_ON_PAGE = 'time_on_page',
  SCROLL_DEPTH = 'scroll_depth',
  CTA_INTERACTION = 'cta_interaction'
}

/**
 * Device types for analytics segmentation
 */
export enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
  UNKNOWN = 'unknown'
}

/**
 * Page context information for analytics events
 */
export interface PageContext {
  path: string;                  // Current page path
  title: string;                 // Page title
  referrer?: string;             // Previous page or external referrer
  url: string;                   // Full URL including query params
  queryParams?: Record<string, string>; // Parsed query parameters
  hash?: string;                 // URL hash/fragment
  loadTime?: number;             // Page load time in milliseconds
}

/**
 * User context information for analytics events
 */
export interface UserContext {
  // Device Information
  deviceType: DeviceType;        // Desktop, tablet, mobile
  screenResolution: string;      // e.g., "1920x1080"
  viewportSize: string;          // e.g., "1440x900"

  // Browser Information
  userAgent: string;             // Full user agent string
  browserName: string;           // Chrome, Firefox, Safari, etc.
  browserVersion: string;        // Browser version
  platform: string;             // Operating system

  // Location (Privacy-Safe)
  country?: string;              // Country code (if consented)
  region?: string;               // State/region (if consented)
  timezone: string;              // User's timezone
  language: string;              // Primary language

  // Session Information
  isFirstVisit: boolean;         // Is this user's first visit
  sessionStartTime: number;      // Session start timestamp
  pageViews: number;             // Page views in current session
  previousVisits?: number;       // Number of previous visits (if available)
}

/**
 * Core analytics event structure
 */
export interface AnalyticsEvent {
  // Core Properties
  id: string;                    // Unique event identifier
  timestamp: number;             // Unix timestamp in milliseconds
  sessionId: string;             // User session identifier
  userId?: string;               // Optional user identifier (for returning visitors)

  // Event Classification
  category: EventCategory;       // Event category enum
  action: string;                // Specific action taken
  label?: string;                // Optional event label
  value?: number;                // Optional numeric value

  // Context Data
  page: PageContext;             // Current page information
  user: UserContext;             // User agent and device info
  performance?: PerformanceMetrics; // Performance data when relevant

  // Privacy & Compliance
  consentLevel: ConsentLevel;    // User's consent level
  anonymized: boolean;           // Whether PII has been anonymized
}

// =============================================================================
// PERFORMANCE MONITORING ENTITIES
// =============================================================================

/**
 * Core Web Vitals ratings
 */
export enum VitalRating {
  GOOD = 'good',
  NEEDS_IMPROVEMENT = 'needs-improvement',
  POOR = 'poor'
}

/**
 * Layout shift source information
 */
export interface LayoutShiftSource {
  element: string;               // CSS selector of shifted element
  previousRect: DOMRect;         // Previous element position
  currentRect: DOMRect;          // Current element position
  impactScore: number;           // Impact on CLS score
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  // Largest Contentful Paint
  lcp?: {
    value: number;               // LCP time in milliseconds
    rating: VitalRating;         // good, needs-improvement, poor
    element?: string;            // LCP element selector (if available)
  };

  // First Input Delay / Interaction to Next Paint
  fid?: {
    value: number;               // FID time in milliseconds
    rating: VitalRating;
  };

  inp?: {
    value: number;               // INP time in milliseconds
    rating: VitalRating;
  };

  // Cumulative Layout Shift
  cls?: {
    value: number;               // CLS score
    rating: VitalRating;
    sources?: LayoutShiftSource[];
  };

  // First Contentful Paint
  fcp?: {
    value: number;               // FCP time in milliseconds
    rating: VitalRating;
  };

  // Time to First Byte
  ttfb?: {
    value: number;               // TTFB time in milliseconds
    rating: VitalRating;
  };
}

/**
 * Navigation timing metrics
 */
export interface NavigationTimingMetrics {
  domainLookupTime: number;      // DNS lookup time
  connectionTime: number;        // TCP connection time
  requestTime: number;           // Request time
  responseTime: number;          // Response time
  domProcessingTime: number;     // DOM processing time
  loadEventTime: number;         // Load event time
  totalLoadTime: number;         // Total page load time
}

/**
 * Resource timing metrics
 */
export interface ResourceTimingMetrics {
  name: string;                  // Resource URL
  type: string;                  // Resource type
  size: number;                  // Resource size in bytes
  duration: number;              // Load duration in milliseconds
  startTime: number;             // Start time relative to navigation
}

/**
 * Complete performance metrics structure
 */
export interface PerformanceMetrics {
  // Core Web Vitals
  coreWebVitals: CoreWebVitals;

  // Navigation Timing
  navigationTiming: NavigationTimingMetrics;

  // Resource Timing
  resourceTiming?: ResourceTimingMetrics[];

  // Custom Metrics
  customMetrics?: Record<string, number>;

  // Context
  timestamp: number;
  url: string;
  deviceType: DeviceType;
}

// =============================================================================
// ERROR TRACKING ENTITIES
// =============================================================================

/**
 * Error types for categorization
 */
export enum ErrorType {
  JAVASCRIPT_ERROR = 'javascript_error',
  NETWORK_ERROR = 'network_error',
  RESOURCE_ERROR = 'resource_error',
  PROMISE_REJECTION = 'promise_rejection',
  CUSTOM_ERROR = 'custom_error',
  ANALYTICS_ERROR = 'analytics_error',
  PERFORMANCE_ERROR = 'performance_error'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error event structure
 */
export interface ErrorEvent {
  // Error Classification
  id: string;                    // Unique error identifier
  timestamp: number;             // When error occurred
  type: ErrorType;               // Type of error
  severity: ErrorSeverity;       // Error severity level

  // Error Details
  message: string;               // Error message
  stack?: string;                // Stack trace (if available)
  filename?: string;             // File where error occurred
  lineNumber?: number;           // Line number of error
  columnNumber?: number;         // Column number of error

  // Context
  page: PageContext;             // Page where error occurred
  user: UserContext;             // User context when error occurred
  userAgent: string;             // User agent string

  // Additional Data
  customData?: Record<string, any>; // Custom error context
  reproducible: boolean;         // Whether error is reproducible
  resolved: boolean;             // Whether error has been resolved
}

// =============================================================================
// PRIVACY & CONSENT ENTITIES
// =============================================================================

/**
 * Consent levels for privacy compliance
 */
export enum ConsentLevel {
  NONE = 'none',                 // No consent given
  ESSENTIAL = 'essential',       // Only essential cookies
  FUNCTIONAL = 'functional',     // Essential + functional cookies
  ANALYTICS = 'analytics',       // Essential + functional + analytics
  MARKETING = 'marketing',       // All cookies including marketing
  FULL = 'full'                  // Full consent with all features
}

/**
 * Granular consent preferences
 */
export interface GranularConsent {
  essential: boolean;            // Required for site functionality
  functional: boolean;           // Enhance user experience
  analytics: boolean;            // Anonymous usage analytics
  performance: boolean;          // Performance monitoring
  marketing: boolean;            // Marketing and advertising
  personalization: boolean;      // Personalized content
  thirdParty: boolean;           // Third-party integrations
}

/**
 * Consent collection methods
 */
export enum ConsentMethod {
  BANNER_ACCEPT = 'banner_accept',
  BANNER_REJECT = 'banner_reject',
  SETTINGS_UPDATE = 'settings_update',
  AUTO_ESSENTIAL = 'auto_essential',
  GDPR_REQUEST = 'gdpr_request'
}

/**
 * Complete consent data structure
 */
export interface ConsentData {
  // Consent Identification
  consentId: string;             // Unique consent record ID
  timestamp: number;             // When consent was given/updated
  version: string;               // Privacy policy version

  // Consent Levels
  level: ConsentLevel;           // Overall consent level
  granularConsent: GranularConsent; // Detailed consent preferences

  // Context
  ipAddress?: string;            // IP address (hashed for privacy)
  userAgent: string;             // User agent when consent given
  method: ConsentMethod;         // How consent was obtained

  // Expiry & Updates
  expiresAt?: number;            // When consent expires
  lastUpdated: number;           // Last consent update
  withdrawnAt?: number;          // When consent was withdrawn
}

// =============================================================================
// ANALYTICS CONFIGURATION
// =============================================================================

/**
 * Analytics provider configuration
 */
export interface AnalyticsProvider {
  name: string;                  // Provider name (GA4, Sentry, etc.)
  enabled: boolean;              // Whether provider is active
  config: Record<string, any>;   // Provider-specific configuration
  consentRequired: ConsentLevel; // Minimum consent level required
  dataRetention: number;         // Data retention period in days
}

/**
 * Complete analytics configuration
 */
export interface AnalyticsConfig {
  // Provider Configuration
  providers: AnalyticsProvider[];

  // Privacy Settings
  privacyMode: boolean;          // Enable privacy-first mode
  anonymizeIp: boolean;          // Anonymize IP addresses
  respectDnt: boolean;           // Respect Do Not Track
  consentRequired: boolean;      // Require explicit consent

  // Data Collection
  sessionTimeout: number;        // Session timeout in minutes
  sampleRate: number;           // Sampling rate (0-1)
  enablePerformance: boolean;    // Collect performance metrics
  enableErrors: boolean;         // Collect error data

  // Custom Settings
  customDimensions?: Record<string, string>;
  customMetrics?: Record<string, number>;
  debugMode: boolean;           // Enable debug logging
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates an analytics event structure
 */
export const validateAnalyticsEvent = (event: AnalyticsEvent): boolean => {
  return (
    event.id.length > 0 &&
    event.timestamp > 0 &&
    event.sessionId.length > 0 &&
    Object.values(EventCategory).includes(event.category) &&
    event.action.length > 0 &&
    event.page.path.length > 0 &&
    Object.values(ConsentLevel).includes(event.consentLevel)
  );
};

/**
 * Validates performance metrics structure
 */
export const validatePerformanceMetrics = (metrics: PerformanceMetrics): boolean => {
  return (
    metrics.timestamp > 0 &&
    metrics.url.length > 0 &&
    Object.values(DeviceType).includes(metrics.deviceType) &&
    // At least one Core Web Vital should be present
    (!!metrics.coreWebVitals.lcp || !!metrics.coreWebVitals.fid || !!metrics.coreWebVitals.cls)
  );
};

/**
 * Validates consent data structure
 */
export const validateConsentData = (consent: ConsentData): boolean => {
  return (
    consent.consentId.length > 0 &&
    consent.timestamp > 0 &&
    consent.version.length > 0 &&
    Object.values(ConsentLevel).includes(consent.level) &&
    Object.values(ConsentMethod).includes(consent.method) &&
    consent.lastUpdated > 0
  );
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Google Analytics gtag data layer event
 */
export interface GtagEvent {
  event_name: string;
  event_parameters?: Record<string, any>;
}

/**
 * Sentry error context
 */
export interface SentryContext {
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    username?: string;
    email?: string;
  };
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

/**
 * Web Vitals metric interface (from web-vitals library)
 */
export interface WebVitalMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: any[];
  id: string;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender';
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: number;
}

/**
 * Analytics API error response
 */
export interface AnalyticsError {
  success: false;
  error: string;
  code: string;
  timestamp: number;
}

/**
 * Dashboard data response
 */
export interface DashboardData {
  summary: {
    totalPageViews: number;
    uniqueVisitors: number;
    averageSessionDuration: number;
    bounceRate: number;
  };
  topPages: Array<{
    path: string;
    pageViews: number;
    averageTime: number;
  }>;
  topProjects: Array<{
    projectId: string;
    name: string;
    views: number;
    clicks: number;
  }>;
  performanceMetrics: {
    averageLCP: number;
    averageFID: number;
    averageCLS: number;
  };
  errorSummary: {
    totalErrors: number;
    errorRate: number;
    topErrors: Array<{
      message: string;
      count: number;
      severity: ErrorSeverity;
    }>;
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  // Core Analytics
  AnalyticsEvent,
  PageContext,
  UserContext,

  // Performance Monitoring
  PerformanceMetrics,
  CoreWebVitals,
  NavigationTimingMetrics,
  ResourceTimingMetrics,
  LayoutShiftSource,

  // Error Tracking
  ErrorEvent,

  // Privacy & Consent
  ConsentData,
  GranularConsent,

  // Configuration
  AnalyticsConfig,
  AnalyticsProvider,

  // Utilities
  GtagEvent,
  SentryContext,
  WebVitalMetric,

  // API Types
  ApiResponse,
  AnalyticsError,
  DashboardData
};

// Note: Enums and functions are already exported above with their declarations
// The export type block above handles all type exports