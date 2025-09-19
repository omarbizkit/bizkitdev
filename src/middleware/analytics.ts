/**
 * Analytics Middleware
 *
 * Dedicated middleware for analytics processing, data validation, and privacy enforcement.
 * Handles analytics endpoints, data sanitization, and performance monitoring.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type { APIContext, MiddlewareNext } from 'astro';
import type { AnalyticsEvent, ConsentLevel } from '../types/analytics';
import { getCurrentEnvConfig } from '../lib/analytics/config';
import { storageUtils, dataUtils, debugUtils } from '../lib/analytics/utils';
import {
  createAnalyticsEvent,
  trackPageView,
  trackProjectInteraction,
  trackNewsletterInteraction,
  trackNavigationClick,
  trackPerformanceEvent,
  trackErrorEvent,
  validateEvent
} from '../lib/analytics/events';

// Analytics endpoints
const ANALYTICS_EVENTS_ENDPOINT = '/api/analytics/events';
const ANALYTICS_PERFORMANCE_ENDPOINT = '/api/analytics/performance';
const ANALYTICS_ERRORS_ENDPOINT = '/api/analytics/errors';
const ANALYTICS_CONSENT_ENDPOINT = '/api/analytics/consent';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute
const INSPECTION_RATE_LIMIT_MAX = 100; // Higher limit for performance monitoring

// In-memory rate limit store (in production, use Redis or database)
const rateLimitStore = new Map<string, number[]>();

// Analytics data sanitization rules
const SENSITIVE_KEYS = [
  'email', 'password', 'token', 'api_key', 'apiKey', 'secret',
  'authorization', 'authToken', 'sessionId', 'userId', 'ipAddress',
  'userAgent', 'referer'
];

// Token omission patterns
const TOKEN_PATTERNS = [
  /[?&]token=[^&\s]*/,
  /[?&]api[_-]?key=[^&\s]*/,
  /Bearer\s+[A-Za-z0-9+/=]{50,}/i,
  /authorization:\s*[^\s]+/i
];

/**
 * Check if request exceeds rate limit
 */
function isRateLimitExceeded(clientIP: string, endpoint: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  if (!rateLimitStore.has(clientIP)) {
    rateLimitStore.set(clientIP, []);
  }

  const requests = rateLimitStore.get(clientIP)!;
  const validRequests = requests.filter(time => time > windowStart);

  // Use different limits for different endpoints
  const maxRequests = endpoint.includes('performance') ?
    INSPECTION_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;

  if (validRequests.length >= maxRequests) {
    return true;
  }

  // Add current request
  validRequests.push(now);
  rateLimitStore.set(clientIP, validRequests);

  // Periodic cleanup of old entries
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupOldRateLimitEntries();
  }

  return false;
}

/**
 * Clean up old rate limiting entries
 */
function cleanupOldRateLimitEntries() {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  for (const [ip, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => time > windowStart);
    if (validRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validRequests);
    }
  }
}

/**
 * Sanitize analytics data for privacy
 */
function sanitizeAnalyticsData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  // Remove sensitive keys
  SENSITIVE_KEYS.forEach(key => {
    delete sanitized[key];
  });

  // Sanitize error messages
  if (sanitized.message && typeof sanitized.message === 'string') {
    sanitized.message = dataUtils.sanitizeError(sanitized.message);
  }

  // Remove tokens from URLs or strings
  if (sanitized.url && typeof sanitized.url === 'string') {
    let sanitizedUrl = sanitized.url;
    TOKEN_PATTERNS.forEach(pattern => {
      sanitizedUrl = sanitizedUrl.replace(pattern, '[REDACTED]');
    });
    sanitized.url = sanitizedUrl;
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeAnalyticsData(sanitized[key]);
    } else if (typeof sanitized[key] === 'string') {
      // Truncate long strings
      sanitized[key] = dataUtils.truncateString(sanitized[key], 500);
    }
  }

  // Add timestamps if missing
  if (!sanitized.timestamp) {
    sanitized.timestamp = Date.now();
  }

  return sanitized;
}

/**
 * Validate analytics event structure using core validation
 */
function validateAnalyticsEvent(event: any): { isValid: boolean; errors?: string[] } {
  try {
    // Use the core validateEvent function for comprehensive validation
    const validation = validateEvent(event);

    return {
      isValid: validation.valid,
      errors: validation.valid ? undefined : validation.errors
    };
  } catch (error) {
    // Fallback validation if core function fails
    const errors: string[] = [];

    if (!event) {
      errors.push('Event is required');
      return { isValid: false, errors };
    }

    if (!event.category || typeof event.category !== 'string') {
      errors.push('Event category must be a non-empty string');
    }

    if (!event.action || typeof event.action !== 'string') {
      errors.push('Event action must be a non-empty string');
    }

    // Check for malicious patterns
    if (event.action && /[<>{}[\]]|javascript:|data:|vbscript:/i.test(event.action)) {
      errors.push('Event action contains potentially malicious content');
    }

    const maxEventSize = 1024 * 10; // 10KB
    if (JSON.stringify(event).length > maxEventSize) {
      errors.push(`Event size exceeds maximum (${maxEventSize} bytes)`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

/**
 * Create cache key for analytics requests
 */
function createCacheKey(request: Request, data?: any): string {
  const url = new URL(request.url);
  const method = request.method;
  const key = `${method}:${url.pathname}`;

  // Include content-based fingerprint for POST requests with data
  if (data && method === 'POST') {
    return `${key}:${hashCode(JSON.stringify(data))}`;
  }

  return key;
}

/**
 * Simple hash function for cache fingerprinting
 */
function hashCode(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Process analytics payload
 */
function processAnalyticsPayload(request: Request): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    let data: any = null;

    request.text()
      .then(text => {
        body = text;
        try {
          data = body ? JSON.parse(body) : null;
          resolve(data);
        } catch (parseError) {
          reject(new Error(`Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`));
        }
      })
      .catch(error => {
        reject(new Error(`Failed to read request body: ${error.message}`));
      });
  });
}


/**
 * Enrichment middleware for analytics data
 */
function enrichAnalyticsData(data: any, request: Request): any {
  const enriched = { ...data };

  if (!enriched.userAgent) {
    enriched.userAgent = request.headers.get('user-agent') || 'Unknown';
  }

  if (!enriched.referer) {
    enriched.referer = request.headers.get('referer') || undefined;
  }

  if (!enriched.language) {
    enriched.language = request.headers.get('accept-language') || 'en';
  }

  // Add privacy-safe client information
  const clientIP = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  request.headers.get('cf-connecting-ip') ||
                  'unknown';

  // Hash IP for privacy while maintaining uniqueness
  enriched.clientId = hashCode(clientIP + (enriched.sessionId || ''));

  return enriched;
}

/**
 * Create server-side analytics event using core functions
 */
function createServerAnalyticsEvent(
  eventData: any,
  request: Request,
  consentLevel: ConsentLevel
): AnalyticsEvent | null {
  try {
    // Extract event components
    const category = eventData.category || 'server_event';
    const action = eventData.action || 'middleware_processed';

    // Create page context from request
    const url = new URL(request.url);
    const pageContext = {
      path: url.pathname,
      title: eventData.pageTitle || 'Server Event',
      url: url.href,
      referrer: request.headers.get('referer') || undefined
    };

    // Create user context from request
    const userContext = {
      userAgent: request.headers.get('user-agent') || 'Unknown',
      language: request.headers.get('accept-language') || 'en'
    };

    // Use createAnalyticsEvent function
    const analyticsEvent = createAnalyticsEvent(category, action, {
      label: eventData.label,
      value: eventData.value,
      pageContext,
      userContext,
      sessionId: eventData.sessionId,
      userId: eventData.userId,
      consentLevel,
      anonymized: true // Server events are always anonymized
    });

    return analyticsEvent;
  } catch (error) {
    debugUtils.log('error', 'Failed to create server analytics event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventData
    });
    return null;
  }
}

/**
 * Track middleware activity using core analytics functions
 */
function trackMiddlewareEvent(
  activity: string,
  request: Request,
  consentLevel: ConsentLevel,
  details?: Record<string, any>
) {
  try {
    const event = createServerAnalyticsEvent({
      category: 'middleware',
      action: activity,
      label: new URL(request.url).pathname,
      ...details
    }, request, consentLevel);

    if (event) {
      // Log the event for server-side analytics
      debugUtils.log('info', `[Analytics Middleware] ${activity}`, {
        eventId: event.id,
        path: event.page.path,
        consentLevel: event.consentLevel
      });
    }
  } catch (error) {
    debugUtils.log('error', 'Failed to track middleware event', {
      activity,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Main analytics middleware function
 */
export async function analyticsMiddleware(
  context: APIContext,
  next: MiddlewareNext
): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Only process analytics endpoints
  if (!pathname.startsWith('/api/analytics/')) {
    return next();
  }

  const clientIP = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  request.headers.get('cf-connecting-ip') ||
                  'unknown';

  // Get consent level from context (set by consent middleware)
  const consentLevel: ConsentLevel =
    (context.locals.consent?.level as ConsentLevel) || 'none';

  // Check consent at endpoint level
  if (consentLevel === 'none' && pathname !== ANALYTICS_CONSENT_ENDPOINT) {
    trackMiddlewareEvent('consent_blocked', request, consentLevel, { pathname });
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Analytics tracking requires consent',
        code: 'CONSENT_REQUIRED'
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          'X-Consent-Required': 'analytics'
        }
      }
    );
  }

  // Rate limiting
  if (isRateLimitExceeded(clientIP, pathname)) {
    trackMiddlewareEvent('rate_limit_exceeded', request, consentLevel, { pathname, clientIP });
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60'
        }
      }
    );
  }

  // Handle OPTIONS requests for CORS
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Consent-Level',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Validate HTTP method
  const allowedMethods = ['GET', 'POST', 'PUT', 'OPTIONS'];
  if (!allowedMethods.includes(request.method)) {
    trackMiddlewareEvent('method_not_allowed', request, consentLevel, {
      method: request.method,
      pathname
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: `Method ${request.method} not allowed`,
        allowed: allowedMethods,
        code: 'METHOD_NOT_ALLOWED'
      }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Allow': allowedMethods.join(', ')
        }
      }
    );
  }

  // Process request body for POST/PUT requests
  let payload: any = null;
  if (request.method === 'POST' || request.method === 'PUT') {
    try {
      payload = await processAnalyticsPayload(request);
      trackMiddlewareEvent('payload_processed', request, consentLevel, {
        size: JSON.stringify(payload).length
      });
    } catch (error) {
      trackMiddlewareEvent('payload_error', request, consentLevel, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid analytics data format',
          details: error instanceof Error ? error.message : 'Unknown error',
          code: 'INVALID_PAYLOAD'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate analytics event
    if (payload) {
      const validation = validateAnalyticsEvent(payload);
      if (!validation.isValid) {
        trackMiddlewareEvent('validation_failed', request, consentLevel, {
          errors: validation.errors
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Analytics event validation failed',
            details: validation.errors,
            code: 'VALIDATION_FAILED'
          }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Sanitize and enrich data
      payload = enrichAnalyticsData(payload, request);
      payload = sanitizeAnalyticsData(payload);
    }
  }

  // Add context to Astro locals
  context.locals.analyticsPayload = payload;
  context.locals.analyticsClientIP = clientIP;

  // Process the request
  const response = await next();

  // Add analytics-specific headers to response
  response.headers.set('X-Analytics-Processed', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*');

  // Add cache headers for GET requests when appropriate
  if (request.method === 'GET' && pathname !== ANALYTICS_EVENTS_ENDPOINT) {
    response.headers.set('Cache-Control', 'public, max-age=300'); // 5 minutes
  }

  // Log successful processing
  trackMiddlewareEvent('request_completed', request, consentLevel, {
    status: response.status,
    pathname
  });

  return response;
}

/**
 * Analytics endpoints configuration
 */
export const analyticsEndpoints = {
  events: ANALYTICS_EVENTS_ENDPOINT,
  performance: ANALYTICS_PERFORMANCE_ENDPOINT,
  errors: ANALYTICS_ERRORS_ENDPOINT,
  consent: ANALYTICS_CONSENT_ENDPOINT
};

/**
 * Export middleware configuration for Astro
 */
export const analyticsMiddlewareConfig = {
  middleware: analyticsMiddleware,
  priority: 15 // After consent middleware (10) but before others
};

// Extend Astro context with analytics locals
export type AnalyticsMiddlewareContext = {
  locals: {
    analyticsPayload?: AnalyticsEvent;
    analyticsClientIP?: string;
  };
};