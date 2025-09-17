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
 * Validate analytics event structure
 */
function validateAnalyticsEvent(event: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!event) {
    errors.push('Event is required');
    return { isValid: false, errors };
  }

  if (!event.name || typeof event.name !== 'string') {
    errors.push('Event name must be a non-empty string');
  }

  if (!event.category || typeof event.category !== 'string') {
    errors.push('Event category must be a non-empty string');
  }

  // Validate data integrity
  if (event.properties && typeof event.properties !== 'object') {
    errors.push('Event properties must be an object');
  }

  // Check for malicious patterns
  if (event.name && /[<>{}[\]]|javascript:|data:|vbscript:/i.test(event.name)) {
    errors.push('Event name contains potentially malicious content');
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
 * Log analytics middleware activity (privacy-safe)
 */
function logAnalyticsActivity(
  request: Request,
  activity: string,
  details?: Record<string, any>,
  consentLevel?: ConsentLevel
) {
  debugUtils.log(
    'info',
    `[Analytics Middleware] ${activity}`,
    {
      path: new URL(request.url).pathname,
      method: request.method,
      consentLevel,
      ...details
    },
    consentLevel
  );
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
    logAnalyticsActivity(request, 'consent_blocked', { pathname }, consentLevel);
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
    logAnalyticsActivity(request, 'rate_limit_exceeded', { pathname, clientIP }, consentLevel);
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
    logAnalyticsActivity(request, 'method_not_allowed', {
      method: request.method,
      pathname
    }, consentLevel);

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
      logAnalyticsActivity(request, 'payload_processed', {
        size: JSON.stringify(payload).length
      }, consentLevel);
    } catch (error) {
      logAnalyticsActivity(request, 'payload_error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }, consentLevel);

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
        logAnalyticsActivity(request, 'validation_failed', {
          errors: validation.errors
        }, consentLevel);

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
  logAnalyticsActivity(request, 'request_completed', {
    status: response.status,
    pathname
  }, consentLevel);

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