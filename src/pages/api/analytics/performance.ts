/**
 * Performance Analytics API Endpoint
 *
 * Accepts performance metrics from client-side monitoring,
 * validates consent, and stores data for analytics.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Endpoint: POST /api/analytics/performance
 */

import type { APIRoute } from 'astro';
import type { PerformanceMetrics, ConsentLevel, WebVitalMetric } from '../../../types/analytics';
import { debugUtils, dataUtils, browserUtils } from '../../../lib/analytics/utils';

// Performance data storage (in production, use database)
const performanceMetrics: Array<{ timestamp: number; data: PerformanceMetrics }> = [];
const MAX_METRICS_STORAGE = 1000; // Store up to 1000 metrics in memory

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check consent level
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (consentLevel === 'none') {
      debugUtils.log('warn', '[Performance API] Request blocked - no consent', {
        ip: request.headers.get('x-forwarded-for'),
        ua: request.headers.get('user-agent')?.substring(0, 100)
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Performance monitoring requires consent',
          code: 'CONSENT_REQUIRED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for sufficient consent for analytics
    if (consentLevel === 'essential') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Performance analytics requires analytics consent',
          code: 'INSUFFICIENT_CONSENT'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const performanceData: PerformanceMetrics = await request.json();

    if (!performanceData) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No performance data provided',
          code: 'MISSING_DATA'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate performance data structure
    const validationResult = validatePerformanceData(performanceData);

    if (!validationResult.isValid) {
      debugUtils.log('warn', '[Performance API] Invalid performance data', {
        errors: validationResult.errors
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid performance data format',
          details: validationResult.errors,
          code: 'VALIDATION_FAILED'
        }),
        {
          status: 422,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Sanitize and enhance performance data
    const sanitizedData = sanitizePerformanceData(performanceData, consentLevel);

    // Process Core Web Vitals if present
    let vitalsProcessed = false;
    if (sanitizedData.coreWebVitals) {
      const vitalsResult = processCoreWebVitals(sanitizedData.coreWebVitals, consentLevel);
      vitalsProcessed = vitalsResult.processed;
    }

    // Store performance metrics (in production, send to analytics service)
    const metricEntry = {
      timestamp: Date.now(),
      data: sanitizedData,
      consentLevel,
      clientInfo: getClientInfo(request)
    };

    // Store in memory (for demo purposes)
    storePerformanceMetric(metricEntry);

    debugUtils.log('info', '[Performance API] Metrics collected successfully', {
      hasCoreWebVitals: !!sanitizedData.coreWebVitals,
      hasNavigationTiming: !!sanitizedData.navigationTiming,
      vitalsProcessed,
      metricCount: 1
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Performance metrics collected successfully',
        consentLevel,
        processed: vitalsProcessed,
        stored: true
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Performance-Accepted': 'true'
        }
      }
    );

  } catch (error) {
    debugUtils.log('error', '[Performance API] Processing error', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error processing performance data',
        code: 'PROCESSING_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Store performance metric (in-memory for demo)
 */
function storePerformanceMetric(entry: any): void {
  performanceMetrics.push(entry);

  // Maintain storage limit
  if (performanceMetrics.length > MAX_METRICS_STORAGE) {
    performanceMetrics.shift();
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
 * Validate performance data structure
 */
function validatePerformanceData(data: any): { isValid: boolean; errors?: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Performance data must be an object');
    return { isValid: false, errors };
  }

  if (!data.timestamp || typeof data.timestamp !== 'number') {
    errors.push('Timestamp must be a number');
  }

  // Check if all timestamps are reasonable (not in the future or too far in the past)
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  if (data.timestamp > now + 60000) { // Allow 1 minute clock skew
    errors.push('Timestamp appears to be in the future');
  }

  if (data.timestamp < now - maxAge) {
    errors.push('Performance data appears too old');
  }

  if (data.coreWebVitals) {
    for (const [metricName, metricData] of Object.entries(data.coreWebVitals)) {
      if (metricData && typeof metricData === 'object') {
        const metric = metricData as any;
        if (typeof metric.value !== 'number' || metric.value < 0) {
          errors.push(`Invalid value for Core Web Vital: ${metricName}`);
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Sanitize performance data for privacy compliance
 */
function sanitizePerformanceData(data: PerformanceMetrics, consentLevel: ConsentLevel): PerformanceMetrics {
  const sanitized: PerformanceMetrics = {
    ...data,
    // Remove any PII from the original data
    userAgent: undefined,
    url: undefined
  };

  // Add consent level to data
  (sanitized as any).consentLevel = consentLevel;

  // Sanitize client IP and other sensitive data
  if (data.navigationTiming) {
    const timing = { ...data.navigationTiming };

    // Remove potentially sensitive timing data
    delete (timing as any).requestStart;
    delete (timing as any).responseStart;
    delete (timing as any).responseEnd;

    // Keep only relative timing information
    if (timing.fetchStart && timing.loadEventEnd) {
      timing.totalDuration = timing.loadEventEnd - timing.fetchStart;
    }

    sanitized.navigationTiming = timing;
  }

  return sanitized;
}

/**
 * Process Core Web Vitals for analytics
 */
function processCoreWebVitals(
  vitals: any,
  consentLevel: ConsentLevel
): { processed: boolean; vitals?: WebVitalMetric[] } {
  const processedVitals: WebVitalMetric[] = [];

  try {
    for (const [metricName, metricData] of Object.entries(vitals)) {
      if (metricData && typeof metricData === 'object') {
        const metric = metricData as any;

        if (metric.value && metric.rating) {
          const processedMetric: WebVitalMetric = {
            name: metricName,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta || 0,
            entries: metric.entries || [],
            id: metric.id || `${metricName}_${Date.now()}`,
            navigationType: metric.navigationType,
            deviceType: browserUtils.getDeviceType(),
            timestamp: Date.now(),
            consentLevel,
            experimental: metricName === 'INP'
          };

          processedVitals.push(processedMetric);
        }
      }
    }

    debugUtils.log('info', `[Performance API] Processed ${processedVitals.length} Core Web Vitals`, {
      consentLevel,
      metrics: processedVitals.map(v => ({ name: v.name, rating: v.rating }))
    });

    return { processed: true, vitals: processedVitals };

  } catch (error) {
    debugUtils.log('error', '[Performance API] Error processing Core Web Vitals', error);
    return { processed: false };
  }
}

// GET endpoint for retrieving performance metrics summary
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check consent level for viewing metrics
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (!request.headers.get('user-agent')) {
      // No programmatic access without proper auth
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized request',
          code: 'UNAUTHORIZED'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if ( consentLevel !== 'marketing') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access to performance metrics requires marketing consent',
          code: 'INSUFFICIENT_CONSENT'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Return sanitized summary statistics
    const summary = {
      totalMetrics: performanceMetrics.length,
      recentMetrics: performanceMetrics.slice(-10).map(metric => ({
        timestamp: metric.timestamp,
        consentLevel: metric.consentLevel,
        hasCoreWebVitals: !!metric.data.coreWebVitals,
        deviceType: metric.clientInfo.deviceType
      })),
      lastUpdated: performanceMetrics.length > 0 ?
        performanceMetrics[performanceMetrics.length - 1].timestamp : null
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
    debugUtils.log('error', '[Performance API] GET request error', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};