# Data Model: Advanced Analytics & Performance Monitoring

**Feature**: 057-advanced-analytics-monitoring
**Last Updated**: 2025-09-17

## Overview

This document defines the data structures, interfaces, and entities for the advanced analytics and performance monitoring system. All models are TypeScript-first with full type safety.

## Core Analytics Entities

### AnalyticsEvent Interface

```typescript
interface AnalyticsEvent {
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
```

### EventCategory Enum

```typescript
enum EventCategory {
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
```

### PageContext Interface

```typescript
interface PageContext {
  path: string;                  // Current page path
  title: string;                 // Page title
  referrer?: string;             // Previous page or external referrer
  url: string;                   // Full URL including query params
  queryParams?: Record<string, string>; // Parsed query parameters
  hash?: string;                 // URL hash/fragment
  loadTime?: number;             // Page load time in milliseconds
}
```

### UserContext Interface

```typescript
interface UserContext {
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
```

### DeviceType Enum

```typescript
enum DeviceType {
  DESKTOP = 'desktop',
  TABLET = 'tablet',
  MOBILE = 'mobile',
  UNKNOWN = 'unknown'
}
```

## Performance Monitoring Entities

### PerformanceMetrics Interface

```typescript
interface PerformanceMetrics {
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
```

### CoreWebVitals Interface

```typescript
interface CoreWebVitals {
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
```

### VitalRating Enum

```typescript
enum VitalRating {
  GOOD = 'good',
  NEEDS_IMPROVEMENT = 'needs-improvement',
  POOR = 'poor'
}
```

### NavigationTimingMetrics Interface

```typescript
interface NavigationTimingMetrics {
  domainLookupTime: number;      // DNS lookup time
  connectionTime: number;        // TCP connection time
  requestTime: number;           // Request time
  responseTime: number;          // Response time
  domProcessingTime: number;     // DOM processing time
  loadEventTime: number;         // Load event time
  totalLoadTime: number;         // Total page load time
}
```

### LayoutShiftSource Interface

```typescript
interface LayoutShiftSource {
  element: string;               // CSS selector of shifted element
  previousRect: DOMRect;         // Previous element position
  currentRect: DOMRect;          // Current element position
  impactScore: number;           // Impact on CLS score
}
```

## Error Tracking Entities

### ErrorEvent Interface

```typescript
interface ErrorEvent {
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
```

### ErrorType Enum

```typescript
enum ErrorType {
  JAVASCRIPT_ERROR = 'javascript_error',
  NETWORK_ERROR = 'network_error',
  RESOURCE_ERROR = 'resource_error',
  PROMISE_REJECTION = 'promise_rejection',
  CUSTOM_ERROR = 'custom_error',
  ANALYTICS_ERROR = 'analytics_error',
  PERFORMANCE_ERROR = 'performance_error'
}
```

### ErrorSeverity Enum

```typescript
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}
```

## Privacy & Consent Entities

### ConsentData Interface

```typescript
interface ConsentData {
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
```

### ConsentLevel Enum

```typescript
enum ConsentLevel {
  NONE = 'none',                 // No consent given
  ESSENTIAL = 'essential',       // Only essential cookies
  FUNCTIONAL = 'functional',     // Essential + functional cookies
  ANALYTICS = 'analytics',       // Essential + functional + analytics
  MARKETING = 'marketing',       // All cookies including marketing
  FULL = 'full'                  // Full consent with all features
}
```

### GranularConsent Interface

```typescript
interface GranularConsent {
  essential: boolean;            // Required for site functionality
  functional: boolean;           // Enhance user experience
  analytics: boolean;            // Anonymous usage analytics
  performance: boolean;          // Performance monitoring
  marketing: boolean;            // Marketing and advertising
  personalization: boolean;      // Personalized content
  thirdParty: boolean;           // Third-party integrations
}
```

### ConsentMethod Enum

```typescript
enum ConsentMethod {
  BANNER_ACCEPT = 'banner_accept',
  BANNER_REJECT = 'banner_reject',
  SETTINGS_UPDATE = 'settings_update',
  AUTO_ESSENTIAL = 'auto_essential',
  GDPR_REQUEST = 'gdpr_request'
}
```

## Analytics Configuration Entities

### AnalyticsConfig Interface

```typescript
interface AnalyticsConfig {
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
```

### AnalyticsProvider Interface

```typescript
interface AnalyticsProvider {
  name: string;                  // Provider name (GA4, Sentry, etc.)
  enabled: boolean;              // Whether provider is active
  config: Record<string, any>;   // Provider-specific configuration
  consentRequired: ConsentLevel; // Minimum consent level required
  dataRetention: number;         // Data retention period in days
}
```

## Database Schema (Optional - for server-side analytics)

### AnalyticsEventRecord (if storing server-side)

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  category VARCHAR(100) NOT NULL,
  action VARCHAR(255) NOT NULL,
  label VARCHAR(255),
  value INTEGER,
  page_path VARCHAR(500) NOT NULL,
  page_title VARCHAR(255),
  referrer VARCHAR(500),
  user_agent TEXT,
  device_type VARCHAR(50),
  browser_name VARCHAR(100),
  country VARCHAR(2),
  consent_level VARCHAR(50) NOT NULL,
  anonymized BOOLEAN DEFAULT true,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_category ON analytics_events(category);
CREATE INDEX idx_analytics_events_page ON analytics_events(page_path);
```

### PerformanceRecord (if storing server-side)

```sql
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  page_path VARCHAR(500) NOT NULL,
  lcp_value INTEGER,
  lcp_rating VARCHAR(20),
  fid_value INTEGER,
  fid_rating VARCHAR(20),
  cls_value DECIMAL(10,6),
  cls_rating VARCHAR(20),
  fcp_value INTEGER,
  fcp_rating VARCHAR(20),
  ttfb_value INTEGER,
  ttfb_rating VARCHAR(20),
  total_load_time INTEGER,
  device_type VARCHAR(50),
  connection_type VARCHAR(50),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX idx_performance_metrics_page ON performance_metrics(page_path);
```

## Validation Rules

### Data Validation

```typescript
// Analytics Event Validation
const validateAnalyticsEvent = (event: AnalyticsEvent): boolean => {
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

// Performance Metrics Validation
const validatePerformanceMetrics = (metrics: PerformanceMetrics): boolean => {
  return (
    metrics.timestamp > 0 &&
    metrics.url.length > 0 &&
    Object.values(DeviceType).includes(metrics.deviceType) &&
    // At least one Core Web Vital should be present
    (metrics.coreWebVitals.lcp || metrics.coreWebVitals.fid || metrics.coreWebVitals.cls)
  );
};
```

## Type Safety & Exports

```typescript
// Export all interfaces and enums for use across the application
export {
  // Core Analytics
  AnalyticsEvent,
  EventCategory,
  PageContext,
  UserContext,
  DeviceType,

  // Performance Monitoring
  PerformanceMetrics,
  CoreWebVitals,
  VitalRating,
  NavigationTimingMetrics,
  LayoutShiftSource,

  // Error Tracking
  ErrorEvent,
  ErrorType,
  ErrorSeverity,

  // Privacy & Consent
  ConsentData,
  ConsentLevel,
  GranularConsent,
  ConsentMethod,

  // Configuration
  AnalyticsConfig,
  AnalyticsProvider,

  // Validation
  validateAnalyticsEvent,
  validatePerformanceMetrics
};
```

This comprehensive data model ensures type safety, privacy compliance, and extensibility for the advanced analytics and performance monitoring system.