/**
 * POST /api/analytics/events/batch
 * Track multiple analytics events in batch
 *
 * Handles batch processing of analytics events with comprehensive validation,
 * consent checking, and partial success handling.
 *
 * Based on: specs/057-advanced-analytics-monitoring/t071-t075-api-implementation.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-18
 */

import type { APIRoute } from 'astro';
import type { AnalyticsEvent } from '../../../../types/analytics';
import { DeviceType } from '../../../../types/analytics';
import { trackEvent as trackGA4Event } from '../../../../lib/analytics/ga4';
import { validationUtils, debugUtils } from '../../../../lib/analytics/utils';

interface BatchRequest {
  events: AnalyticsEvent[];
}

interface BatchResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: string[];
  event_ids?: string[];
  message?: string;
  timestamp: number;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body: BatchRequest = await request.json().catch(() => null);
    if (!body || !body.events) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body. Expected { events: AnalyticsEvent[] }',
          code: 'INVALID_REQUEST_BODY',
          timestamp: Date.now()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate batch size and format
    if (!Array.isArray(body.events)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Events must be an array',
          code: 'INVALID_EVENTS_FORMAT',
          timestamp: Date.now()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (body.events.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'EMPTY_BATCH',
          message: 'Batch must contain at least one event',
          timestamp: Date.now()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (body.events.length > 100) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'BATCH_SIZE_EXCEEDED',
          message: 'Batch size exceeds maximum of 100 events',
          provided: body.events.length,
          maximum: 100,
          timestamp: Date.now()
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Process events in batch
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];
    const eventIds: string[] = [];

    for (let i = 0; i < body.events.length; i++) {
      try {
        const event = body.events[i];

        // Auto-generate missing fields
        const analyticsEvent: AnalyticsEvent = {
          id: event.id || crypto.randomUUID(),
          timestamp: event.timestamp || Date.now(),
          sessionId: event.sessionId || crypto.randomUUID(),
          userId: event.userId,
          category: event.category,
          action: event.action,
          label: event.label,
          value: event.value,
          page: event.page || {
            path: '/',
            title: 'Unknown Page',
            url: request.url,
            referrer: request.headers.get('referer') || undefined
          },
          user: event.user || {
            deviceType: DeviceType.UNKNOWN,
            screenResolution: '1920x1080',
            viewportSize: '1440x900',
            userAgent: request.headers.get('user-agent') || 'unknown',
            browserName: 'unknown',
            browserVersion: 'unknown',
            platform: 'unknown',
            timezone: 'UTC',
            language: 'en',
            isFirstVisit: true,
            sessionStartTime: Date.now(),
            pageViews: 1
          },
          performance: event.performance,
          consentLevel: event.consentLevel,
          anonymized: true
        };

        // Validate event structure
        const validationResult = validationUtils.validateAnalyticsEvent(analyticsEvent);
        if (!validationResult.isValid) {
          failed++;
          errors.push(`Event ${i}: ${validationResult.errors.join(', ')}`);
          continue;
        }

        // Check consent level for analytics tracking
        const consentValidation = validationUtils.validateConsentForAnalytics(analyticsEvent.consentLevel);
        if (!consentValidation.isValid) {
          failed++;
          errors.push(`Event ${i}: ${consentValidation.errors.join(', ')}`);
          continue;
        }

        // Track event with GA4 if consent allows
        if (['analytics', 'marketing', 'full'].includes(analyticsEvent.consentLevel)) {
          await trackGA4Event(analyticsEvent);
        }

        // Log successful processing in development
        debugUtils.log('info', `Batch event ${i} processed successfully`, {
          eventId: analyticsEvent.id,
          category: analyticsEvent.category,
          action: analyticsEvent.action
        }, analyticsEvent.consentLevel);

        // Track successful event ID
        eventIds.push(analyticsEvent.id);
        processed++;

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Event ${i}: Processing error - ${errorMessage}`);

        debugUtils.log('error', `Batch event ${i} processing failed`, {
          error: errorMessage,
          index: i
        });
      }
    }

    // Return batch processing results
    const response: BatchResponse = {
      success: processed > 0,
      processed,
      failed,
      errors,
      event_ids: eventIds.length > 0 ? eventIds : undefined,
      message: processed > 0 && failed > 0 ? 'Batch partially processed' :
               processed > 0 ? 'Batch processed successfully' :
               'Batch processing failed',
      timestamp: Date.now()
    };

    // Use 207 Multi-Status for partial success, 201 for full success, 400 for full failure
    const statusCode = processed > 0 && failed > 0 ? 207 :
                      processed > 0 ? 201 : 400;

    return new Response(
      JSON.stringify(response),
      {
        status: statusCode,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    debugUtils.log('error', 'Analytics batch API error', error);

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

// Handle unsupported methods
export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Method not allowed. Use POST to submit batch analytics events.',
      code: 'METHOD_NOT_ALLOWED',
      timestamp: Date.now()
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    }
  );
};

export const PUT: APIRoute = GET;
export const DELETE: APIRoute = GET;
export const PATCH: APIRoute = GET;