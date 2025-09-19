/**
 * POST /api/analytics/events
 * Single analytics event tracking endpoint
 *
 * Based on: T071 specification and contract tests
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-18
 */

import type { APIRoute } from 'astro';
import { trackEventServer } from '../../../lib/analytics/events';
import { validationUtils, type ValidationResult } from '../../../lib/analytics/utils';
import { sendToGA4 } from '../../../lib/analytics/ga4';

/**
 * Server-safe event ID generation
 */
const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'evt_' + Math.random().toString(36).substr(2) + '_' + Date.now().toString(36);
};

/**
 * POST /api/analytics/events
 * Track single analytics event with consent validation
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate Content-Type header
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_CONTENT_TYPE',
          message: 'Content-Type must be application/json'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body with proper JSON error detection
    let eventData: any;
    let requestText: string;

    try {
      requestText = await request.text();
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Failed to read request body'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if the request body is valid JSON
    try {
      eventData = JSON.parse(requestText);
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_JSON',
          message: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate event structure
    const validation: ValidationResult = validationUtils.validateEventRequest(eventData);
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INVALID_EVENT_DATA',
          message: `Event validation failed: ${validation.errors.join(', ')}`,
          details: { errors: validation.errors }
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate consent level for analytics
    const consentValidation = validationUtils.validateConsentForAnalytics(eventData.consent_level);
    if (!consentValidation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'INSUFFICIENT_CONSENT',
          message: 'Insufficient consent level for analytics tracking',
          required_consent: 'analytics',
          provided_consent: eventData.consent_level
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique event ID (server-safe)
    const eventId = generateEventId();

    // Add user agent from headers if not in data
    if (!eventData.data.user_agent) {
      eventData.data.user_agent = request.headers.get('user-agent') || 'unknown';
    }

    // Track event using existing analytics library
    const trackingResult = await trackEventServer(eventData);
    if (!trackingResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'TRACKING_ERROR',
          message: `Failed to track event: ${trackingResult.error || 'Unknown error'}`
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Send to GA4 if consent allows (analytics, marketing, or full)
    if (['analytics', 'marketing', 'full'].includes(eventData.consent_level)) {
      try {
        await sendToGA4(eventData);
      } catch (error) {
        // GA4 sending failure shouldn't fail the entire request
        console.warn('Failed to send event to GA4:', error);
      }
    }

    // Return success response matching contract test expectations
    return new Response(
      JSON.stringify({
        success: true,
        event_id: eventId,
        message: 'Event recorded successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Analytics events API error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * GET /api/analytics/events
 * Method not allowed - endpoint only accepts POST requests
 */
export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed. Use POST to track analytics events.'
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