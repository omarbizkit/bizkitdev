/**
 * Sentry Error Tracking Integration
 *
 * Privacy-enhanced error tracking with sensitive data filtering.
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import * as Sentry from '@sentry/astro';
import type { ErrorEvent, ErrorType, ErrorSeverity } from '../../types/analytics';
import { SENTRY_CONFIG, getCurrentEnvConfig } from './config';

// Initialize Sentry with privacy-enhanced configuration
export const initializeSentry = (): boolean => {
  if (!SENTRY_CONFIG.enabled) {
    console.warn('Sentry is not enabled - missing SENTRY_DSN');
    return false;
  }

  try {
    Sentry.init({
      dsn: SENTRY_CONFIG.config.dsn,
      environment: SENTRY_CONFIG.config.environment,
      tracesSampleRate: SENTRY_CONFIG.config.tracesSampleRate,
      beforeSend: SENTRY_CONFIG.config.beforeSend,

      // Privacy enhancements
      beforeBreadcrumb(breadcrumb) {
        // Filter out sensitive breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null; // Skip console.log breadcrumbs
        }

        // Filter URLs that might contain sensitive data
        if (breadcrumb.data?.url?.includes('api/auth') ||
            breadcrumb.data?.url?.includes('subscribe')) {
          delete breadcrumb.data.url;
        }

        return breadcrumb;
      },

      // Integration configuration
      integrations: [
        Sentry.replayIntegration({
          // Disable session replay for privacy
          maskAllText: true,
          blockAllMedia: true,
          sessionSampleRate: 0, // Disable session replay
          errorSampleRate: 0    // Disable error replay
        })
      ]
    });

    console.log('Sentry initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
    return false;
  }
};

// Convert our ErrorEvent to Sentry format
export const trackError = (errorEvent: Partial<ErrorEvent>): void => {
  if (!SENTRY_CONFIG.enabled) return;

  const envConfig = getCurrentEnvConfig();

  // Skip error tracking in test environment
  if (envConfig.sampleRate === 0) return;

  try {
    // Set error context
    Sentry.withScope((scope) => {
      // Add custom tags
      scope.setTag('error_type', errorEvent.type || 'unknown');
      scope.setTag('severity', errorEvent.severity || 'medium');
      scope.setTag('page_path', errorEvent.page?.path || 'unknown');
      scope.setTag('device_type', errorEvent.user?.deviceType || 'unknown');

      // Add context data (privacy-safe)
      scope.setContext('error_details', {
        timestamp: errorEvent.timestamp || Date.now(),
        reproducible: errorEvent.reproducible || false,
        resolved: errorEvent.resolved || false
      });

      // Add page context (without sensitive data)
      if (errorEvent.page) {
        scope.setContext('page_context', {
          path: errorEvent.page.path,
          title: errorEvent.page.title,
          // Exclude referrer and URL for privacy
          loadTime: errorEvent.page.loadTime
        });
      }

      // Add user context (anonymized)
      if (errorEvent.user) {
        scope.setContext('user_context', {
          deviceType: errorEvent.user.deviceType,
          browserName: errorEvent.user.browserName,
          platform: errorEvent.user.platform,
          timezone: errorEvent.user.timezone,
          language: errorEvent.user.language,
          // Exclude screen resolution and user agent for privacy
          isFirstVisit: errorEvent.user.isFirstVisit
        });
      }

      // Set error level based on severity
      const sentryLevel = mapSeverityToSentryLevel(errorEvent.severity);
      scope.setLevel(sentryLevel);

      // Capture the error
      if (errorEvent.stack) {
        // Create error with stack trace
        const error = new Error(errorEvent.message || 'Unknown error');
        error.stack = errorEvent.stack;
        error.name = errorEvent.type || 'Error';

        Sentry.captureException(error);
      } else {
        // Capture as message if no stack trace
        Sentry.captureMessage(
          errorEvent.message || 'Unknown error occurred',
          sentryLevel
        );
      }
    });

    if (envConfig.enableConsoleLogging) {
      console.log('Error tracked to Sentry:', {
        type: errorEvent.type,
        message: errorEvent.message,
        severity: errorEvent.severity
      });
    }
  } catch (error) {
    console.error('Failed to track error to Sentry:', error);
  }
};

// Map our ErrorSeverity to Sentry levels
const mapSeverityToSentryLevel = (severity?: ErrorSeverity): Sentry.SeverityLevel => {
  switch (severity) {
    case 'critical':
      return 'fatal';
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'info';
    default:
      return 'error';
  }
};

// Track JavaScript errors
export const trackJavaScriptError = (
  error: Error,
  filename?: string,
  lineNumber?: number,
  columnNumber?: number
): void => {
  const errorEvent: Partial<ErrorEvent> = {
    type: 'javascript_error',
    severity: 'high',
    message: error.message,
    stack: error.stack,
    filename,
    lineNumber,
    columnNumber,
    timestamp: Date.now(),
    reproducible: true,
    resolved: false
  };

  trackError(errorEvent);
};

// Track network errors
export const trackNetworkError = (
  url: string,
  status: number,
  statusText: string
): void => {
  const errorEvent: Partial<ErrorEvent> = {
    type: 'network_error',
    severity: status >= 500 ? 'high' : 'medium',
    message: `Network error: ${status} ${statusText}`,
    customData: {
      url: url.replace(/[?&](api_key|token|password)=[^&]*/gi, ''), // Remove sensitive params
      status,
      statusText
    },
    timestamp: Date.now(),
    reproducible: true,
    resolved: false
  };

  trackError(errorEvent);
};

// Track promise rejections
export const trackPromiseRejection = (reason: any): void => {
  const errorEvent: Partial<ErrorEvent> = {
    type: 'promise_rejection',
    severity: 'medium',
    message: reason?.message || 'Unhandled promise rejection',
    stack: reason?.stack,
    timestamp: Date.now(),
    reproducible: false,
    resolved: false
  };

  trackError(errorEvent);
};

// Track custom application errors
export const trackCustomError = (
  message: string,
  severity: ErrorSeverity = 'medium',
  customData?: Record<string, any>
): void => {
  const errorEvent: Partial<ErrorEvent> = {
    type: 'custom_error',
    severity,
    message,
    customData,
    timestamp: Date.now(),
    reproducible: true,
    resolved: false
  };

  trackError(errorEvent);
};

// Track analytics-specific errors
export const trackAnalyticsError = (
  provider: string,
  operation: string,
  error: Error
): void => {
  const errorEvent: Partial<ErrorEvent> = {
    type: 'analytics_error',
    severity: 'low', // Analytics errors shouldn't be critical
    message: `Analytics error in ${provider}: ${error.message}`,
    stack: error.stack,
    customData: {
      provider,
      operation,
      analyticsError: true
    },
    timestamp: Date.now(),
    reproducible: true,
    resolved: false
  };

  trackError(errorEvent);
};

// Performance error tracking
export const trackPerformanceError = (
  metric: string,
  value: number,
  threshold: number
): void => {
  const errorEvent: Partial<ErrorEvent> = {
    type: 'performance_error',
    severity: 'low',
    message: `Performance threshold exceeded: ${metric} = ${value}ms (threshold: ${threshold}ms)`,
    customData: {
      metric,
      value,
      threshold,
      performanceError: true
    },
    timestamp: Date.now(),
    reproducible: false,
    resolved: false
  };

  trackError(errorEvent);
};

// Set up global error handlers
export const setupGlobalErrorHandlers = (): void => {
  if (typeof window === 'undefined') return;

  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    trackJavaScriptError(
      event.error || new Error(event.message),
      event.filename,
      event.lineno,
      event.colno
    );
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    trackPromiseRejection(event.reason);
  });

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const element = event.target as HTMLElement;
      const errorEvent: Partial<ErrorEvent> = {
        type: 'resource_error',
        severity: 'medium',
        message: `Failed to load resource: ${element.tagName}`,
        customData: {
          tagName: element.tagName,
          src: (element as any).src || (element as any).href,
          resourceError: true
        },
        timestamp: Date.now(),
        reproducible: true,
        resolved: false
      };

      trackError(errorEvent);
    }
  }, true); // Use capture phase for resource errors
};

export default {
  initializeSentry,
  trackError,
  trackJavaScriptError,
  trackNetworkError,
  trackPromiseRejection,
  trackCustomError,
  trackAnalyticsError,
  trackPerformanceError,
  setupGlobalErrorHandlers
};