/**
 * Performance Monitoring Middleware
 *
 * Captures server-side performance metrics, real-time response monitoring,
 * and client-side performance data integration.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type { APIContext, MiddlewareNext } from 'astro';
import type { PerformanceMetrics, ConsentLevel } from '../../types/analytics';
import { debugUtils, browserUtils, dataUtils } from '../analytics/utils';
import { PERFORMANCE_THRESHOLDS } from '../analytics/config';
import { trackPerformanceEvent, trackErrorEvent } from '../analytics/events';

// Performance monitoring endpoints
const PERFORMANCE_METRICS_ENDPOINT = '/api/analytics/performance';
const PERFORMANCE_REPORT_ENDPOINT = '/api/analytics/performance/report';

// Performance measurement configuration
const PERFORMANCE_CONFIG = {
  slowThreshold: 1000, // 1 second for slow responses
  criticalThreshold: 3000, // 3 seconds for critical alerts
  responseSizeLimit: 1024 * 1024, // 1MB response size tracking
  enableMemoryMonitoring: false, // Node.js memory usage
  enableDatabaseTiming: false, // Database query timing
  customMetrics: true // Enable custom performance metrics
};

// Server-side performance metrics storage
interface ServerPerformanceMetrics {
  requestId: string;
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  responseSize: number;
  timestamp: number;
  userAgent?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  errors: Error[];
  slow: boolean;
  critical: boolean;
}

// Request timing storage
const requestTimings = new Map<string, { start: number; details: any }>();
let nextRequestId = 1;

/**
 * Generate unique request ID
 */
function getNextRequestId(): string {
  const id = `req_${nextRequestId++}`;
  if (nextRequestId > 999999) nextRequestId = 1; // Reset to prevent large numbers
  return id;
}

/**
 * Start request performance measurement
 */
function startRequestTiming(context: APIContext): string {
  const requestId = getNextRequestId();
  const startTime = process.hrtime.bigint();

  requestTimings.set(requestId, {
    start: Number(startTime),
    details: {
      url: context.url.pathname,
      method: context.request.method,
      timestamp: Date.now(),
      headers: getHeadersSummary(context.request.headers)
    }
  });

  return requestId;
}

/**
 * Complete request performance measurement
 */
function completeRequestTiming(requestId: string, response?: Response): ServerPerformanceMetrics | null {
  const timing = requestTimings.get(requestId);
  if (!timing) {
    debugUtils.log('warn', `[Performance Middleware] No timing found for request: ${requestId}`, { requestId });
    return null;
  }

  const endTime = process.hrtime.bigint();
  const responseTime = Number(endTime - BigInt(timing.start)) / 1e6; // Convert to milliseconds

  // Clean up old timing data
  requestTimings.delete(requestId);

  const metrics: ServerPerformanceMetrics = {
    requestId,
    url: timing.details.url,
    method: timing.details.method,
    statusCode: response ? response.status : 0,
    responseTime,
    responseSize: getResponseSize(response),
    timestamp: timing.details.timestamp,
    userAgent: timing.details.headers['user-agent'],
    errors: [], // Will be populated if errors occur
    slow: responseTime > PERFORMANCE_CONFIG.slowThreshold,
    critical: responseTime > PERFORMANCE_CONFIG.criticalThreshold
  };

  // Add memory usage if enabled
  if (PERFORMANCE_CONFIG.enableMemoryMonitoring) {
    try {
      metrics.memoryUsage = process.memoryUsage();
    } catch (error) {
      debugUtils.log('warn', '[Performance Middleware] Failed to get memory usage', error);
    }
  }

  return metrics;
}

/**
 * Get response size from response headers
 */
function getResponseSize(response?: Response): number {
  if (!response) return 0;

  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    return isNaN(size) ? 0 : size;
  }

  return 0; // Approximate size (could be enhanced with stream cloning)
}

/**
 * Get summary of important headers
 */
function getHeadersSummary(headers: Headers): Record<string, string> {
  const importantHeaders = [
    'user-agent',
    'accept-encoding',
    'content-type',
    'accept-language',
    'cache-control',
    'pragma'
  ];

  const summary: Record<string, string> = {};

  for (const header of importantHeaders) {
    const value = headers.get(header);
    if (value) {
      summary[header] = value.length > 100 ? value.substring(0, 100) + '...' : value;
    }
  }

  return summary;
}

/**
 * Check if request should be monitored
 */
function shouldMonitorRequest(context: APIContext): boolean {
  const { request, url } = context;
  const pathname = url.pathname;

  // Skip static assets unless large files
  if (pathname.includes('/assets/') ||
      pathname.includes('/_astro/') ||
      pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
    // Still monitor large assets for performance issues
    return false; // For now, skip all static assets
  }

  // Skip favicon requests
  if (pathname === '/favicon.ico') {
    return false;
  }

  // Skip health check endpoints
  if (pathname === '/api/health') {
    return false;
  }

  // Monitor all other requests
  return true;
}

/**
 * Check consent level for performance monitoring
 */
function hasPerformanceConsent(context: APIContext): boolean {
  // Check consent via context locals (set by consent middleware)
  const consent: ConsentLevel = (context.locals.consent?.level as ConsentLevel) || 'none';

  return consent === 'analytics' || consent === 'marketing';
}

/**
 * Send performance metrics to analytics endpoint using core functions
 */
async function sendPerformanceMetrics(metrics: ServerPerformanceMetrics, context: APIContext): Promise<void> {
  try {
    // Add consent level to metrics
    const consentLevel: ConsentLevel = (context.locals.consent?.level as ConsentLevel) || 'none';

    const performanceData: PerformanceMetrics = {
      coreWebVitals: {},
      navigationTiming: {},
      resourceTiming: [],
      timestamp: metrics.timestamp,
      url: metrics.url,
      deviceType: 'desktop', // Server-side, so assume desktop
      serverMetrics: {
        requestId: metrics.requestId,
        responseTime: metrics.responseTime,
        responseSize: metrics.responseSize,
        statusCode: metrics.statusCode,
        userAgent: metrics.userAgent,
        url: metrics.url,
        method: metrics.method,
        consentLevel,
        slowResponse: metrics.slow,
        criticalResponse: metrics.critical
      }
    };

    // Store in context for analytics middleware
    context.locals.performanceMetrics = performanceData;

    // Use core analytics function to track performance events
    if (metrics.critical) {
      trackPerformanceEvent('critical_response_time', metrics.responseTime, {
        url: metrics.url,
        threshold: PERFORMANCE_CONFIG.criticalThreshold,
        statusCode: metrics.statusCode,
        responseSize: metrics.responseSize
      });
    } else if (metrics.slow) {
      trackPerformanceEvent('slow_response_time', metrics.responseTime, {
        url: metrics.url,
        threshold: PERFORMANCE_CONFIG.slowThreshold,
        statusCode: metrics.statusCode,
        responseSize: metrics.responseSize
      });
    } else {
      // Track normal performance metrics
      trackPerformanceEvent('response_time', metrics.responseTime, {
        url: metrics.url,
        statusCode: metrics.statusCode,
        responseSize: metrics.responseSize,
        method: metrics.method
      });
    }

    // Log performance metrics for debugging
    debugUtils.log('info', '[Performance] Performance event tracked', {
      url: metrics.url,
      time: metrics.responseTime,
      status: metrics.statusCode,
      critical: metrics.critical,
      slow: metrics.slow
    }, consentLevel);

  } catch (error) {
    debugUtils.log('error', '[Performance] Failed to send performance metrics', error);
  }
}

/**
 * Capture error information for performance monitoring using core functions
 */
function captureRequestError(context: APIContext, error: Error): void {
  const requestId = (context.locals as any).performanceRequestId;

  if (requestId && error) {
    const sanitizedError = dataUtils.sanitizeError(error.message);

    // Use core analytics function to track error
    trackErrorEvent(error, 'performance_middleware', {
      requestId,
      url: context.url.pathname,
      method: context.request.method,
      userAgent: context.request.headers.get('user-agent'),
      timestamp: Date.now()
    });

    debugUtils.log('error', '[Performance] Request error captured and tracked', {
      requestId,
      error: sanitizedError,
      url: context.url.pathname
    });

    // Store error in context for performance metrics
    if (!context.locals.errors) {
      (context.locals as any).errors = [];
    }
    (context.locals as any).errors.push({
      message: sanitizedError,
      timestamp: Date.now(),
      url: context.url.pathname
    });
  }
}

/**
 * Main performance monitoring middleware
 */
export async function performanceMonitoringMiddleware(
  context: APIContext,
  next: MiddlewareNext
): Promise<Response> {
  const { request, url } = context;
  const pathname = url.pathname;

  // Skip monitoring for certain requests
  if (!shouldMonitorRequest(context)) {
    return next();
  }

  try {
    // Start timing measurement
    const requestId = startRequestTiming(context);
    context.locals.performanceRequestId = requestId;

    debugUtils.log('info', '[Performance] Request started', {
      requestId,
      url: pathname,
      method: request.method
    });

    // Process the request
    const response = await next();

    // Complete timing measurement
    const metrics = completeRequestTiming(requestId, response);

    if (metrics) {
      // Check if user has consented to performance monitoring
      const hasConsent = hasPerformanceConsent(context);

      if (hasConsent) {
        await sendPerformanceMetrics(metrics, context);
      } else {
        debugUtils.log('info', '[Performance] Performance monitoring skipped - no consent', {
          requestId,
          url: pathname
        });
      }
    }

    return response;

  } catch (error) {
    // Capture request errors
    if (error instanceof Error) {
      captureRequestError(context, error);
    }

    // Ensure timing cleanup even on errors
    const requestId = (context.locals as any).performanceRequestId;
    if (requestId) {
      const metrics = completeRequestTiming(requestId);
      if (metrics) {
        metrics.statusCode = 500;
        metrics.errors.push(error instanceof Error ? error : new Error('Unknown error'));
        await sendPerformanceMetrics(metrics, context);
      }
    }

    // Re-throw the error to maintain middleware chain
    throw error;
  }
}

/**
 * Post-response monitoring for client-side performance
 */
export function createClientPerformanceMonitor(): {
  trackInteraction: (interactionName: string) => void;
  trackCustomMetric: (name: string, value: number) => void;
  getMetrics: () => Record<string, number>;
} {
  const customMetrics: Record<string, number[]> = {};

  return {
    trackInteraction: (interactionName: string) => {
      if (!customMetrics[interactionName]) {
        customMetrics[interactionName] = [];
      }
      customMetrics[interactionName].push(Date.now());
      debugUtils.log('info', `[Client Performance] Interaction tracked: ${interactionName}`);
    },

    trackCustomMetric: (name: string, value: number) => {
      if (!customMetrics[name]) {
        customMetrics[name] = [];
      }
      customMetrics[name].push(value);
      debugUtils.log('info', `[Client Performance] Custom metric tracked: ${name}`, { value });
    },

    getMetrics: () => {
      const latestMetrics: Record<string, number> = {};

      for (const [name, values] of Object.entries(customMetrics)) {
        if (values.length > 0) {
          // Get the most recent value or average for timing arrays
          if (name.includes('interaction') || name.includes('click')) {
            latestMetrics[name] = values[values.length - 1];
          } else {
            latestMetrics[name] = values.reduce((a, b) => a + b, 0) / values.length;
          }
        }
      }

      return latestMetrics;
    }
  };
}

/**
 * Performance monitoring configuration
 */
export const performanceMonitoringConfig = {
  middleware: performanceMonitoringMiddleware,
  priority: 17, // After analytics middleware (15) but before general middleware

  // Enable/disable performance monitoring features
  features: {
    serverSideMonitoring: true,
    clientSideMonitoring: true,
    slowRequestAlerting: true,
    criticalRequestAlerting: true,
    errorTracking: true,
    memoryMonitoring: PERFORMANCE_CONFIG.enableMemoryMonitoring,
    databaseTiming: PERFORMANCE_CONFIG.enableDatabaseTiming
  },

  // Thresholds and limits
  thresholds: {
    slow: PERFORMANCE_CONFIG.slowThreshold,
    critical: PERFORMANCE_CONFIG.criticalThreshold,
    responseSize: PERFORMANCE_CONFIG.responseSizeLimit
  },

  // Privacy and consent settings
  privacy: {
    requiresConsent: 'analytics' as ConsentLevel,
    dataRetention: 30, // days
    anonymizeMetrics: true,
    excludeSensitiveRoutes: true
  }
};

// Extend Astro context with performance locals
declare global {
  namespace App {
    interface Locals {
      performanceRequestId?: string;
      performanceMetrics?: PerformanceMetrics;
      errors?: Array<{
        message: string;
        timestamp: number;
        url: string;
      }>;
    }
  }
}

// Export default middleware function
export default performanceMonitoringMiddleware;