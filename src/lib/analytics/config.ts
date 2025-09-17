/**
 * Analytics Configuration
 *
 * Central configuration for all analytics providers with privacy-first settings.
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type {
  AnalyticsConfig,
  AnalyticsProvider,
  ConsentLevel,
  DeviceType
} from '../../types/analytics';

// Environment variables with fallbacks
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Analytics Provider Configurations
export const GA4_CONFIG: AnalyticsProvider = {
  name: 'Google Analytics 4',
  enabled: !!import.meta.env.PUBLIC_GA4_MEASUREMENT_ID,
  config: {
    measurementId: import.meta.env.PUBLIC_GA4_MEASUREMENT_ID || '',
    // Privacy-enhanced configuration per research.md
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    cookie_expires: 30 * 24 * 60 * 60, // 30 days
    cookie_update: false,
    send_page_view: false, // Manual page view tracking for privacy control
    debug_mode: isDev
  },
  consentRequired: 'analytics' as ConsentLevel,
  dataRetention: 26 * 30 // 26 months (GDPR compliant)
};

export const SENTRY_CONFIG: AnalyticsProvider = {
  name: 'Sentry Error Tracking',
  enabled: !!import.meta.env.PUBLIC_SENTRY_DSN,
  config: {
    dsn: import.meta.env.PUBLIC_SENTRY_DSN || '',
    environment: import.meta.env.PUBLIC_ENVIRONMENT || 'development',
    tracesSampleRate: isProd ? 0.1 : 1.0, // 10% sampling in production
    beforeSend: (event: any) => {
      // Filter sensitive data per research.md
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      // Skip analytics-related errors in development
      if (isDev && event.exception?.[0]?.value?.includes('analytics')) {
        return null;
      }
      return event;
    },
    integrations: [
      // Astro-specific integrations will be configured in setup
    ]
  },
  consentRequired: 'essential' as ConsentLevel, // Error tracking is essential
  dataRetention: 90 // 90 days for error data
};

// Core Analytics Configuration
export const ANALYTICS_CONFIG: AnalyticsConfig = {
  // Provider Configuration
  providers: [GA4_CONFIG, SENTRY_CONFIG],

  // Privacy Settings (privacy-first per research.md)
  privacyMode: true,
  anonymizeIp: true,
  respectDnt: true, // Honor Do Not Track headers
  consentRequired: true, // Explicit consent required

  // Data Collection Settings
  sessionTimeout: 30, // 30 minutes
  sampleRate: isProd ? 0.8 : 1.0, // 80% sampling in production
  enablePerformance: true,
  enableErrors: true,

  // Custom Dimensions for Portfolio Analytics
  customDimensions: {
    'project_category': 'string',
    'device_type': 'string',
    'user_journey': 'string',
    'conversion_source': 'string'
  },

  // Custom Metrics for Performance
  customMetrics: {
    'time_to_project_view': 0,
    'newsletter_conversion_time': 0,
    'portfolio_engagement_score': 0
  },

  // Debug mode in development
  debugMode: isDev
};

// Device Type Detection
export const detectDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;

  // Mobile detection
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent) || screenWidth < 768) {
    return 'mobile';
  }

  // Tablet detection
  if (/tablet|ipad/i.test(userAgent) || (screenWidth >= 768 && screenWidth < 1024)) {
    return 'tablet';
  }

  // Desktop
  if (screenWidth >= 1024) {
    return 'desktop';
  }

  return 'unknown';
};

// Generate unique session ID
export const generateSessionId = (): string => {
  // Use crypto.randomUUID() if available, fallback to timestamp-based ID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback session ID generation
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get user's timezone
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
};

// Get user's primary language
export const getUserLanguage = (): string => {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language || 'en';
};

// Environment-specific configurations
export const ENV_CONFIG = {
  development: {
    enableConsoleLogging: true,
    enableDebugMode: true,
    sampleRate: 1.0,
    retryAttempts: 1
  },
  production: {
    enableConsoleLogging: false,
    enableDebugMode: false,
    sampleRate: 0.8,
    retryAttempts: 3
  },
  test: {
    enableConsoleLogging: false,
    enableDebugMode: false,
    sampleRate: 0,
    retryAttempts: 0
  }
} as const;

// Get current environment configuration
export const getCurrentEnvConfig = () => {
  const env = import.meta.env.MODE as keyof typeof ENV_CONFIG;
  return ENV_CONFIG[env] || ENV_CONFIG.development;
};

// Core Web Vitals thresholds (from research.md)
export const PERFORMANCE_THRESHOLDS = {
  lcp: {
    good: 2500,        // < 2.5 seconds
    needsImprovement: 4000  // < 4 seconds
  },
  fid: {
    good: 100,         // < 100ms
    needsImprovement: 300   // < 300ms
  },
  inp: {
    good: 200,         // < 200ms
    needsImprovement: 500   // < 500ms
  },
  cls: {
    good: 0.1,         // < 0.1
    needsImprovement: 0.25  // < 0.25
  },
  fcp: {
    good: 1800,        // < 1.8 seconds
    needsImprovement: 3000  // < 3 seconds
  },
  ttfb: {
    good: 800,         // < 800ms
    needsImprovement: 1800  // < 1.8 seconds
  }
} as const;

// Performance budget limits (from research.md)
export const PERFORMANCE_BUDGET = {
  javascript: 250 * 1024,  // 250KB gzipped
  css: 50 * 1024,          // 50KB gzipped
  totalPageWeight: 1024 * 1024, // 1MB initial load
  analyticsImpact: 50 * 1024     // < 50KB analytics overhead
} as const;

// Enhanced GA4 Configuration with Advanced Privacy Settings
export const ENHANCED_GA4_CONFIG = {
  ...GA4_CONFIG,
  config: {
    ...GA4_CONFIG.config,

    // Advanced privacy settings (GDPR/CCPA enhanced)
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    allow_ad_features: false,
    enable_custom_audiences: false,
    use_enhanced_link_attribution: false,

    // Attribution and data collection exclusions
    global_exclusions: {
      // Traffic exclusions for privacy compliance
      referrers: [
        'localhost',
        '127.0.0.1',
        '192.168.*',
        '10.0.0.0/8',
        '172.16.0.0/12',
        'fd00:*'  // IPv6 private ranges
      ],

      // Attribution exclusions
      attribution: {
        source_medium: [
          '(not set)/(not set)',
          'localhost/localhost'
        ],
        campaign_names: [
          'testing',
          'development'
        ]
      }
    },

    // Cookie settings with privacy constraints
    cookie_settings: {
      expires: 30 * 24 * 60 * 60, // 30 days
      update: false,
      secure: true,
      samesite: 'lax',
      restrictions: {
        consent_required: true,
        cross_domain: false,
        third_party: false
      }
    },

    // Cross-domain tracking (disabled for privacy)
    cross_domain: {
      enabled: false,
      domains: [], // Empty array for maximum privacy
      linker_parameter: '_gl'
    },

    // Measurement Protocol settings
    measurement_protocol: {
      enabled: false, // Disabled for privacy compliance
      validate_events: false,
      secret: null // Must be set via environment for security
    },

    // Enhanced e-commerce (portfolio enhanced)
    ecommerce: {
      enabled: true,
      enhanced: true,
      promotion_attribution: true,
      checkout_steps: [
        'view',
        'interact',
        'click',
        'contact'
      ],
      custom_dimensions: {
        project_category: 'dimension1',
        user_journey_stage: 'dimension2',
        newsletter_subscription_status: 'dimension3'
      },
      exclusion_rules: {
        exclude_parameters: [
          'token',
          'api_key',
          'session_id',
          'user_id'
        ]
      }
    },

    // Link tracking and attribution
    link_tracking: {
      decorate_forms: false, // Privacy: don't decorate forms
      enable_anchor_tracking: false, // Privacy: don't track anchors
      track_page_fragment: false, // Privacy: don't track URL fragments
      outbound_link_tracking: {
        enabled: true,
        exclusions: [
          'mailto:',
          'tel:',
          'file:',
          'steam:',
          '*.local',
          '*.private'
        ]
      }
    },

    // Search term tracking with privacy filters
    search_term_tracking: {
      enabled: true,
      exclusions: [
        '/search?q=',
        '?s=',
        '/find?'
      ],
      privacy_filters: [
        'password',
        'token',
        'key',
        'secret',
        'email',
        'phone'
      ]
    },

    // Firestore integration (disabled for privacy)
    firestore: {
      enabled: false,
      settings: {
        host: 'firestore.googleapis.com',
        persistence_enabled: false
      }
    },

    // Google Ads linking (disabled for privacy)
    google_ads: {
      enabled: false,
      auto_tagging: false,
      remarketing_enabled: false,
      conversions_enabled: false
    },

    // Data import and export settings
    data_import: {
      enabled: false,
      exclusions: {
        offline_events: false,
        user_data: false,
        crm_data: false
      }
    },

    // Server-side tagging (available but not used for privacy)
    server_side: {
      enabled: false,
      measurement_subdomain: null
    },

    // Advanced privacy features
    privacy_features: {
      // Cookieless tracking (future compliance)
      cookieless_measurement: false,

      // Server-side consent management
      server_consent_mode: true,

      // Enhanced debugging (development only)
      enhanced_debug_mode: false,

      // Consent signals for Ads and Analytics
      consent_signals: {
        ads_data_redaction: true,
        ads_storage_restriction: true,
        analytics_storage_restriction: false, // Analytics consents managed separately
        personalization_restriction: true,
        functionality_restriction: false,
        security_restriction: false // Essential features always allowed
      }
    },

    // Event settings with privacy constraints
    event_settings: {
      defaults: {
        send_to: 'default',
        event_category: 'engagement',
        non_interaction: false
      },
      exclusions: {
        // Exclude sensitive event names
        exclude_events: [
          'user_login',
          'user_logout',
          'form_submit',
          'file_download',
          'video_interaction'
        ],
        // Skip processing for certain parameters
        parameter_exclusions: [
          'user_id',
          'user_email',
          'api_token',
          'session_token'
        ]
      }
    },

    // Audience definitions (privacy-compliant)
    audiences: {
      enabled: true,
      automatic_creation: false, // Manual audience creation only
      privacy_mode: true,
      exclusion_rules: {
        pii_filters: true,
        sensitive_data_detection: true,
        consent_based_audiences: [
          'newsletter_subscribers',
          'project_engagement_high',
          'portfolio_visitors'
        ]
      }
    }
  }
};

// Enhanced consent management for GA4
export const GA4_CONSENT_STATES = {
  none: {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted' // Always allowed for security
  },
  essential: {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted'
  },
  functional: {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  },
  analytics: {
    ad_storage: 'denied',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  },
  marketing: {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  },
  full: {
    ad_storage: 'granted',
    analytics_storage: 'granted',
    functionality_storage: 'granted',
    personalization_storage: 'granted',
    security_storage: 'granted'
  }
} as const;

// GA4 consent mode configuration
export const GA4_CONSENT_MODE = {
  url_passthrough: false, // Privacy: don't pass consent in URL
  ads_data_redaction: true, // Privacy: redact ads data without consent
  analytics_storage_restriction: true, // Privacy: restrict analytics storage
  feature_consent: {
    ad_personalization: false,
    ad_user_data: false,
    ad_customization: false
  }
};

// Privacy-compliant custom dimensions and metrics
export const GA4_CUSTOM_DIMENSIONS = {
  user_segment: '2',           // Privacy-safe user categorization
  device_type: '3',           // Device type detection
  user_journey_stage: '4',    // Journey stage without PII
  session_consent_level: '5', // Consent level at session start
  portfolio_section: '6',     // Section of portfolio visited
  engagement_type: '7',       // Type of engagement (safe)
  newsletter_interest: '8'    // Interest level (aggregated)
} as const;

export const GA4_CUSTOM_METRICS = {
  time_to_first_engagement: '1', // Time to first safe interaction
  project_view_depth: '2',       // How deeply user explores projects
  newsletter_conversion_time: '3', // Time to newsletter signup
  portfolio_engagement_score: '4' // Aggregated engagement score
} as const;

// Export enhanced configuration as default GA4 provider
export const ENHANCED_GA4_PROVIDER: AnalyticsProvider = {
  ...ENHANCED_GA4_CONFIG,
  name: 'Google Analytics 4 (Enhanced Privacy)',
  config: ENHANCED_GA4_CONFIG.config
};

export default ANALYTICS_CONFIG;