/**
 * Consent Management Middleware
 *
 * Server-side consent validation and privacy compliance.
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type { APIContext, MiddlewareNext } from 'astro';
import type { ConsentData, ConsentLevel } from '../types/analytics';

// Consent cookie name
const CONSENT_COOKIE_NAME = 'analytics_consent';
const DNT_HEADER = 'dnt';

/**
 * Parse consent data from cookies
 */
function parseConsentFromCookies(cookies: string): ConsentData | null {
  try {
    // Look for consent cookie in the cookie string
    const cookiePairs = cookies.split(';').map(pair => pair.trim());

    for (const pair of cookiePairs) {
      const [name, value] = pair.split('=');
      if (name === CONSENT_COOKIE_NAME && value) {
        const decodedValue = decodeURIComponent(value);
        return JSON.parse(decodedValue) as ConsentData;
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to parse consent cookie:', error);
    return null;
  }
}

/**
 * Check if consent is valid and not expired
 */
function isConsentValid(consent: ConsentData): boolean {
  // Check if consent has expired (1 year)
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - consent.timestamp > oneYearMs;

  if (isExpired) return false;

  // Check if consent was withdrawn
  if (consent.withdrawnAt) return false;

  // Check if consent structure is valid
  return !!(
    consent.consentId &&
    consent.timestamp &&
    consent.level &&
    consent.granularConsent &&
    consent.method
  );
}

/**
 * Check Do Not Track header
 */
function respectsDoNotTrack(request: Request): boolean {
  const dnt = request.headers.get(DNT_HEADER);
  return dnt === '1' || dnt === 'yes';
}

/**
 * Get consent level from request
 */
function getConsentLevel(request: Request): ConsentLevel {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return 'none';
  }

  const consent = parseConsentFromCookies(cookieHeader);

  if (!consent || !isConsentValid(consent)) {
    return 'none';
  }

  // Respect Do Not Track even if consent is given
  if (respectsDoNotTrack(request)) {
    return 'essential';
  }

  return consent.level;
}

/**
 * Check if specific tracking is allowed
 */
function canTrack(request: Request, requiredLevel: ConsentLevel): boolean {
  const currentLevel = getConsentLevel(request);

  const consentHierarchy: ConsentLevel[] = [
    'none',
    'essential',
    'functional',
    'analytics',
    'marketing',
    'full'
  ];

  const currentIndex = consentHierarchy.indexOf(currentLevel);
  const requiredIndex = consentHierarchy.indexOf(requiredLevel);

  return currentIndex >= requiredIndex;
}

/**
 * Get user's consent preferences
 */
function getConsentPreferences(request: Request): ConsentData | null {
  const cookieHeader = request.headers.get('cookie');

  if (!cookieHeader) {
    return null;
  }

  const consent = parseConsentFromCookies(cookieHeader);

  if (!consent || !isConsentValid(consent)) {
    return null;
  }

  return consent;
}

/**
 * Add privacy headers to response
 */
function addPrivacyHeaders(response: Response): Response {
  // Add privacy-related headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Add Permissions Policy to control browser features
  const permissionsPolicy = [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()'
  ].join(', ');

  response.headers.set('Permissions-Policy', permissionsPolicy);

  return response;
}

/**
 * Log consent-related events (privacy-safe)
 */
function logConsentEvent(
  request: Request,
  event: string,
  details?: Record<string, any>
): void {
  // Only log in development mode
  if (import.meta.env.DEV) {
    const url = new URL(request.url);
    const consentLevel = getConsentLevel(request);
    const dnt = respectsDoNotTrack(request);

    console.log(`[Consent Middleware] ${event}:`, {
      path: url.pathname,
      consentLevel,
      dnt,
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

/**
 * Main consent middleware function
 */
export async function consentMiddleware(
  context: APIContext,
  next: MiddlewareNext
): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  // Skip middleware for static assets
  if (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/_astro/') ||
      url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf)$/)) {
    return next();
  }

  // Get consent information
  const consentLevel = getConsentLevel(request);
  const consentData = getConsentPreferences(request);
  const dnt = respectsDoNotTrack(request);

  // Add consent context to Astro context
  context.locals.consent = {
    level: consentLevel,
    data: consentData,
    dnt,
    canTrack: (level: ConsentLevel) => canTrack(request, level),
    canTrackAnalytics: () => canTrack(request, 'analytics'),
    canTrackMarketing: () => canTrack(request, 'marketing'),
    canTrackPerformance: () => canTrack(request, 'analytics'), // Performance tied to analytics
    isFirstVisit: !consentData,
    hasConsented: !!consentData
  };

  // Log consent status
  logConsentEvent(request, 'consent_check', {
    hasConsent: !!consentData,
    isFirstVisit: !consentData
  });

  // Block analytics endpoints if consent is not sufficient
  if (url.pathname.startsWith('/api/analytics/')) {
    const endpoint = url.pathname.split('/').pop();

    switch (endpoint) {
      case 'events':
      case 'performance':
        if (!canTrack(request, 'analytics')) {
          logConsentEvent(request, 'analytics_blocked', { endpoint });
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Analytics tracking not consented',
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
        break;

      case 'errors':
        // Error tracking is allowed with essential consent (for debugging)
        if (!canTrack(request, 'essential')) {
          logConsentEvent(request, 'error_tracking_blocked');
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Error tracking not allowed',
              code: 'CONSENT_REQUIRED'
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'X-Consent-Required': 'essential'
              }
            }
          );
        }
        break;

      case 'consent':
        // Consent management is always allowed
        break;

      default:
        // Unknown analytics endpoint
        logConsentEvent(request, 'unknown_analytics_endpoint', { endpoint });
        break;
    }
  }

  // Handle Do Not Track
  if (dnt && !url.pathname.startsWith('/api/analytics/consent')) {
    // Add DNT compliance header
    const response = await next();
    response.headers.set('X-DNT-Compliant', '1');
    return addPrivacyHeaders(response);
  }

  // Process the request
  const response = await next();

  // Add privacy headers to all responses
  return addPrivacyHeaders(response);
}

/**
 * Analytics-specific middleware for enhanced validation
 */
export async function analyticsMiddleware(
  context: APIContext,
  next: MiddlewareNext
): Promise<Response> {
  const { request } = context;
  const url = new URL(request.url);

  // Only apply to analytics API routes
  if (!url.pathname.startsWith('/api/analytics/')) {
    return next();
  }

  // Rate limiting for analytics endpoints
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  // Simple rate limiting (in production, use Redis or similar)
  const rateLimitKey = `analytics_rate_limit_${clientIP}`;

  // Check for rate limiting headers (would be implemented with proper storage)
  const rateLimitExceeded = false; // Placeholder for actual rate limiting logic

  if (rateLimitExceeded) {
    logConsentEvent(request, 'rate_limit_exceeded', { clientIP });
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
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

  // Validate request method for analytics endpoints
  const allowedMethods = ['POST', 'GET', 'OPTIONS'];
  if (!allowedMethods.includes(request.method)) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed',
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

  // Handle CORS for analytics endpoints
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': allowedMethods.join(', '),
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Proceed with request
  const response = await next();

  // Add CORS headers to response
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', allowedMethods.join(', '));

  return response;
}

/**
 * Export middleware configurations
 */
export const consentConfig = {
  middleware: consentMiddleware,
  priority: 10 // High priority to run early
};

export const analyticsConfig = {
  middleware: analyticsMiddleware,
  priority: 5 // Lower priority, after consent middleware
};

// Type declarations for Astro locals
declare global {
  namespace App {
    interface Locals {
      consent: {
        level: ConsentLevel;
        data: ConsentData | null;
        dnt: boolean;
        canTrack: (level: ConsentLevel) => boolean;
        canTrackAnalytics: () => boolean;
        canTrackMarketing: () => boolean;
        canTrackPerformance: () => boolean;
        isFirstVisit: boolean;
        hasConsented: boolean;
      };
    }
  }
}

export default consentMiddleware;