/**
 * Error Analytics API Endpoint
 *
 * Accepts error events from client-side monitoring,
 * validates consent, integrates with Sentry for high/critical errors,
 * and stores data for analytics.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Endpoint: POST /api/analytics/errors
 */

import type { APIRoute } from 'astro';
import type { ErrorEvent, ConsentLevel, PageContext, UserContext } from '../../../types/analytics';
import { ErrorType, ErrorSeverity } from '../../../types/analytics';
import { debugUtils, dataUtils, browserUtils } from '../../../lib/analytics/utils';
import { trackError } from '../../../lib/analytics/sentry';

// Error data storage (in production, use database)
const errorEvents: Array<{ timestamp: number; data: ErrorEvent; clientInfo: any; sentryTracked: boolean }> = [];
const MAX_ERROR_STORAGE = 500; // Store up to 500 errors in memory

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check consent level
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (consentLevel === 'none') {
      debugUtils.log('warn', '[Error API] Request blocked - no consent', {
        ip: request.headers.get('x-forwarded-for'),
        ua: request.headers.get('user-agent')?.substring(0, 100)
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error tracking requires consent',
          code: 'CONSENT_REQUIRED',
          timestamp: Date.now()
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for sufficient consent for error tracking
    if (consentLevel === 'essential') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Error analytics requires analytics consent',
          code: 'INSUFFICIENT_CONSENT',
          timestamp: Date.now()
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body with JSON error handling
    let errorData: Partial<ErrorEvent>;
    try {
      errorData = await request.json();
    } catch (parseError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON format in request body',
          code: 'INVALID_JSON',
          timestamp: Date.now()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!errorData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No error data provided',
          code: 'MISSING_DATA',
          timestamp: Date.now()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate error data structure
    const validationResult = validateErrorData(errorData);

    if (!validationResult.isValid) {
      debugUtils.log('warn', '[Error API] Invalid error data', {
        errors: validationResult.errors
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid error data format',
          details: validationResult.errors,
          code: 'VALIDATION_FAILED',
          timestamp: Date.now()
        }),
        {
          status: 400, // Contract tests expect 400 for validation errors
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize and enhance error data
    const sanitizedData = sanitizeErrorData(errorData, consentLevel, request);

    // Generate auto-fields if missing
    const completeErrorEvent: ErrorEvent = {
      id: sanitizedData.id || dataUtils.generateSafeId(),
      timestamp: sanitizedData.timestamp || Date.now(),
      type: sanitizedData.type!,
      severity: sanitizedData.severity!,
      message: sanitizedData.message!,
      stack: sanitizedData.stack,
      filename: sanitizedData.filename,
      lineNumber: sanitizedData.lineNumber,
      columnNumber: sanitizedData.columnNumber,
      page: sanitizedData.page!,
      user: sanitizedData.user!,
      userAgent: sanitizedData.userAgent || request.headers.get('user-agent') || '',
      customData: sanitizedData.customData,
      reproducible: sanitizedData.reproducible ?? true,
      resolved: sanitizedData.resolved ?? false
    };

    // Integrate with Sentry for high/critical errors
    let sentryTracked = false;
    if (completeErrorEvent.severity === 'high' || completeErrorEvent.severity === 'critical') {
      try {
        trackError(completeErrorEvent);
        sentryTracked = true;
        debugUtils.log('info', '[Error API] High/critical error sent to Sentry', {
          id: completeErrorEvent.id,
          severity: completeErrorEvent.severity,
          type: completeErrorEvent.type
        });
      } catch (sentryError) {
        debugUtils.log('warn', '[Error API] Failed to send error to Sentry', sentryError);
      }
    }

    // Store error event (in production, send to analytics service)
    const errorEntry = {
      timestamp: Date.now(),
      data: completeErrorEvent,
      consentLevel,
      clientInfo: getClientInfo(request),
      sentryTracked
    };

    // Store in memory (for demo purposes)
    storeErrorEvent(errorEntry);

    debugUtils.log('info', '[Error API] Error event collected successfully', {
      id: completeErrorEvent.id,
      type: completeErrorEvent.type,
      severity: completeErrorEvent.severity,
      sentryTracked,
      page: completeErrorEvent.page.path
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          errorId: completeErrorEvent.id
        },
        message: 'Error event collected successfully',
        timestamp: Date.now(),
        consentLevel,
        sentryTracked,
        stored: true
      }),
      {
        status: 201, // Created status as expected by contract tests
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Tracked': 'true'
        }
      }
    );

  } catch (error) {
    debugUtils.log('error', '[Error API] Processing error', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error processing error data',
        code: 'PROCESSING_ERROR',
        timestamp: Date.now()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Store error event (in-memory for demo)
 */
function storeErrorEvent(entry: any): void {
  errorEvents.push(entry);

  // Maintain storage limit
  if (errorEvents.length > MAX_ERROR_STORAGE) {
    errorEvents.shift();
  }
}

/**
 * Get client information from request headers
 */
function getClientInfo(request: Request): Record<string, any> {
  return {
    ip: hashClientIP(request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'),
    userAgent: request.headers.get('user-agent')?.substring(0, 200),
    language: request.headers.get('accept-language')?.substring(0, 50),
    encoding: request.headers.get('accept-encoding'),
    deviceType: browserUtils.getDeviceType(),
    env: import.meta.env.PROD ? 'production' : 'development'
  };
}

/**
 * Hash client IP for privacy while maintaining uniqueness
 */
function hashClientIP(ip: string): string {
  if (ip === 'unknown') return 'unknown';

  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}

/**
 * Validate error data structure
 */
function validateErrorData(data: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Error data must be an object');
    return { isValid: false, errors };
  }

  // Required fields validation
  if (!data.type || typeof data.type !== 'string') {
    errors.push('Error type is required and must be a string');
  } else {
    // Validate error type enum
    const validTypes = Object.values(ErrorType);
    if (!validTypes.includes(data.type as ErrorType)) {
      errors.push(`Invalid error type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  if (!data.severity || typeof data.severity !== 'string') {
    errors.push('Error severity is required and must be a string');
  } else {
    // Validate severity levels
    const validSeverities = Object.values(ErrorSeverity);
    if (!validSeverities.includes(data.severity as ErrorSeverity)) {
      errors.push(`Invalid error severity. Must be one of: ${validSeverities.join(', ')}`);
    }
  }

  if (!data.message || typeof data.message !== 'string' || data.message.trim().length === 0) {
    errors.push('Error message is required and must be a non-empty string');
  }

  if (!data.page || typeof data.page !== 'object') {
    errors.push('Page context is required and must be an object');
  } else {
    if (!data.page.path || typeof data.page.path !== 'string') {
      errors.push('Page path is required in page context');
    }
    if (!data.page.title || typeof data.page.title !== 'string') {
      errors.push('Page title is required in page context');
    }
    if (!data.page.url || typeof data.page.url !== 'string') {
      errors.push('Page URL is required in page context');
    }
  }

  // Optional fields validation
  if (data.timestamp && (typeof data.timestamp !== 'number' || data.timestamp <= 0)) {
    errors.push('Timestamp must be a positive number if provided');
  }

  if (data.lineNumber && typeof data.lineNumber !== 'number') {
    errors.push('Line number must be a number if provided');
  }

  if (data.columnNumber && typeof data.columnNumber !== 'number') {
    errors.push('Column number must be a number if provided');
  }

  if (data.reproducible !== undefined && typeof data.reproducible !== 'boolean') {
    errors.push('Reproducible must be a boolean if provided');
  }

  if (data.resolved !== undefined && typeof data.resolved !== 'boolean') {
    errors.push('Resolved must be a boolean if provided');
  }

  // Check timestamp reasonableness
  if (data.timestamp) {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (data.timestamp > now + 60000) { // Allow 1 minute clock skew
      errors.push('Timestamp appears to be in the future');
    }

    if (data.timestamp < now - maxAge) {
      errors.push('Error event appears too old');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Sanitize error data for privacy compliance
 */
function sanitizeErrorData(data: Partial<ErrorEvent>, consentLevel: ConsentLevel, request: Request): Partial<ErrorEvent> {
  const sanitized: Partial<ErrorEvent> = {
    ...data
  };

  // Sanitize error message for privacy
  if (sanitized.message) {
    sanitized.message = dataUtils.sanitizeError(sanitized.message);
    // Truncate very long messages
    sanitized.message = dataUtils.truncateString(sanitized.message, 500);
  }

  // Sanitize stack trace
  if (sanitized.stack) {
    sanitized.stack = dataUtils.sanitizeError(sanitized.stack);
    // Truncate very long stack traces
    sanitized.stack = dataUtils.truncateString(sanitized.stack, 2000);
  }

  // Sanitize filename paths
  if (sanitized.filename) {
    // Remove potential file system paths, keep only relative paths
    sanitized.filename = sanitized.filename.replace(/^.*[\\\/]/, '');
  }

  // Remove PII from custom data
  if (sanitized.customData) {
    sanitized.customData = dataUtils.removePII(sanitized.customData);
  }

  // Sanitize page context
  if (sanitized.page) {
    const page: PageContext = {
      path: sanitized.page.path,
      title: sanitized.page.title,
      url: sanitized.page.url,
      // Remove query params that might contain sensitive data
      queryParams: undefined,
      hash: sanitized.page.hash,
      loadTime: sanitized.page.loadTime
    };

    // Remove referrer for privacy unless high consent level
    if (consentLevel === 'marketing' && sanitized.page.referrer) {
      page.referrer = sanitized.page.referrer;
    }

    sanitized.page = page;
  }

  // Sanitize user context
  if (sanitized.user) {
    const user: Partial<UserContext> = {
      deviceType: sanitized.user.deviceType,
      browserName: sanitized.user.browserName,
      browserVersion: sanitized.user.browserVersion,
      platform: sanitized.user.platform,
      timezone: sanitized.user.timezone,
      language: sanitized.user.language,
      isFirstVisit: sanitized.user.isFirstVisit
    };

    // Include more details only with higher consent levels
    if (consentLevel === 'analytics' || consentLevel === 'marketing') {
      user.viewportSize = sanitized.user.viewportSize;
      user.pageViews = sanitized.user.pageViews;
    }

    // Screen resolution and user agent only with marketing consent
    if (consentLevel === 'marketing') {
      user.screenResolution = sanitized.user.screenResolution;
      user.userAgent = sanitized.user.userAgent;
      user.sessionStartTime = sanitized.user.sessionStartTime;
      user.previousVisits = sanitized.user.previousVisits;
    }

    sanitized.user = user as UserContext;
  }

  // Set user agent from headers if not provided
  if (!sanitized.userAgent) {
    const headerUA = request.headers.get('user-agent');
    if (headerUA && consentLevel === 'marketing') {
      sanitized.userAgent = headerUA.substring(0, 200); // Truncate for privacy
    } else {
      sanitized.userAgent = 'hidden'; // Hide for lower consent levels
    }
  }

  return sanitized;
}

// GET endpoint for retrieving error metrics summary
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check consent level for viewing error metrics
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (!request.headers.get('user-agent')) {
      // No programmatic access without proper auth
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized request',
          code: 'UNAUTHORIZED',
          timestamp: Date.now()
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (consentLevel !== 'marketing') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access to error metrics requires marketing consent',
          code: 'INSUFFICIENT_CONSENT',
          timestamp: Date.now()
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate error statistics
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    const lastDay = now - (24 * 60 * 60 * 1000);

    const recentErrors = errorEvents.filter(error => error.timestamp > lastHour);
    const dailyErrors = errorEvents.filter(error => error.timestamp > lastDay);

    // Error distribution by severity
    const severityDistribution = errorEvents.reduce((acc, error) => {
      const severity = error.data.severity;
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Error distribution by type
    const typeDistribution = errorEvents.reduce((acc, error) => {
      const type = error.data.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top error messages
    const errorMessages = errorEvents.reduce((acc, error) => {
      const message = error.data.message.substring(0, 100); // Truncate for summary
      acc[message] = (acc[message] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topErrors = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([message, count]) => ({ message, count }));

    // Return sanitized summary statistics
    const summary = {
      totalErrors: errorEvents.length,
      recentErrors: recentErrors.length,
      dailyErrors: dailyErrors.length,
      errorRate: errorEvents.length > 0 ? (dailyErrors.length / errorEvents.length * 100).toFixed(2) : '0.00',
      severityDistribution,
      typeDistribution,
      topErrors,
      sentryTrackedCount: errorEvents.filter(error => error.sentryTracked).length,
      lastErrorTime: errorEvents.length > 0 ?
        errorEvents[errorEvents.length - 1].timestamp : null,
      recentErrorSample: recentErrors.slice(-5).map(error => ({
        id: error.data.id,
        type: error.data.type,
        severity: error.data.severity,
        message: error.data.message.substring(0, 100),
        page: error.data.page.path,
        timestamp: error.timestamp,
        sentryTracked: error.sentryTracked
      }))
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: summary
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    debugUtils.log('error', '[Error API] GET request error', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: Date.now()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};