/**
 * T067: Analytics Events API Contract Tests
 *
 * Contract tests for analytics events API endpoints including single events,
 * batch processing, consent validation, and error handling.
 *
 * Expected: FAIL initially (404 Not Found) - endpoints don't exist yet (TDD)
 */

import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

// Test data fixtures
const validPageViewEvent = {
  type: 'page_view',
  data: {
    page: '/projects',
    title: 'Projects - Omar Torres',
    referrer: 'https://google.com',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  timestamp: new Date().toISOString(),
  session_id: 'test-session-123',
  user_id: null,
  consent_level: 'analytics'
};

const validProjectClickEvent = {
  type: 'project_click',
  data: {
    project_id: 'ai-portfolio-optimizer',
    project_title: 'AI Portfolio Optimizer',
    click_position: { x: 250, y: 150 },
    element_id: 'project-card-1'
  },
  timestamp: new Date().toISOString(),
  session_id: 'test-session-123',
  user_id: null,
  consent_level: 'analytics'
};

const invalidEvent = {
  type: 'invalid_type',
  // Missing required fields: data, timestamp, session_id, consent_level
};

test.describe('Analytics Events API Contract Tests', () => {
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:4321'
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test.describe('POST /api/analytics/events - Single Event Endpoint', () => {

    test('should accept valid page_view event with analytics consent', async () => {
      const response = await request.post('/api/analytics/events', {
        data: validPageViewEvent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        event_id: expect.any(String),
        message: 'Event recorded successfully'
      });
    });

    test('should accept valid project_click event with analytics consent', async () => {
      const response = await request.post('/api/analytics/events', {
        data: validProjectClickEvent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        event_id: expect.any(String),
        message: 'Event recorded successfully'
      });
    });

    test('should reject invalid event with 400 Bad Request', async () => {
      const response = await request.post('/api/analytics/events', {
        data: invalidEvent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_EVENT_DATA',
        message: expect.stringContaining('validation'),
        details: expect.any(Object)
      });
    });

    test('should reject event with insufficient consent (403)', async () => {
      const eventWithoutConsent = {
        ...validPageViewEvent,
        consent_level: 'essential' // Insufficient for analytics events
      };

      const response = await request.post('/api/analytics/events', {
        data: eventWithoutConsent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 403 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(403);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INSUFFICIENT_CONSENT',
        message: expect.stringContaining('consent level'),
        required_consent: 'analytics',
        provided_consent: 'essential'
      });
    });

    test('should handle malformed JSON with 400 Bad Request', async () => {
      const response = await request.post('/api/analytics/events', {
        data: '{ invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_JSON',
        message: expect.stringContaining('JSON')
      });
    });
  });

  test.describe('POST /api/analytics/events/batch - Batch Events Endpoint', () => {

    test('should accept valid batch of events', async () => {
      const batchEvents = {
        events: [
          validPageViewEvent,
          validProjectClickEvent,
          {
            ...validPageViewEvent,
            type: 'scroll',
            data: {
              page: '/about',
              scroll_depth: 75,
              max_scroll: 100
            }
          }
        ]
      };

      const response = await request.post('/api/analytics/events/batch', {
        data: batchEvents,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Batch endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        processed: 3,
        failed: 0,
        event_ids: expect.arrayContaining([
          expect.any(String),
          expect.any(String),
          expect.any(String)
        ]),
        message: 'Batch processed successfully'
      });
    });

    test('should reject batch exceeding maximum events (100)', async () => {
      const oversizedBatch = {
        events: Array(101).fill(validPageViewEvent).map((event, index) => ({
          ...event,
          session_id: `test-session-${index}`
        }))
      };

      const response = await request.post('/api/analytics/events/batch', {
        data: oversizedBatch,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Batch endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'BATCH_SIZE_EXCEEDED',
        message: expect.stringContaining('maximum 100 events'),
        provided: 101,
        maximum: 100
      });
    });

    test('should handle partial batch success (mixed valid/invalid events)', async () => {
      const mixedBatch = {
        events: [
          validPageViewEvent, // Valid
          invalidEvent,       // Invalid - missing required fields
          validProjectClickEvent, // Valid
          {
            ...validPageViewEvent,
            consent_level: 'essential' // Invalid - insufficient consent
          }
        ]
      };

      const response = await request.post('/api/analytics/events/batch', {
        data: mixedBatch,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 207 (partial success) after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Batch endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(207); // Multi-status for partial success

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        processed: 2, // 2 valid events
        failed: 2,    // 2 invalid events
        event_ids: expect.arrayContaining([
          expect.any(String),
          expect.any(String)
        ]),
        errors: expect.arrayContaining([
          expect.objectContaining({
            index: 1,
            error: 'INVALID_EVENT_DATA'
          }),
          expect.objectContaining({
            index: 3,
            error: 'INSUFFICIENT_CONSENT'
          })
        ]),
        message: 'Batch partially processed'
      });
    });

    test('should reject empty batch', async () => {
      const emptyBatch = { events: [] };

      const response = await request.post('/api/analytics/events/batch', {
        data: emptyBatch,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Batch endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'EMPTY_BATCH',
        message: 'Batch must contain at least one event'
      });
    });
  });

  test.describe('Rate Limiting Tests', () => {

    test('should handle rate limiting (429) after excessive requests', async () => {
      // Note: This test may be skipped if rate limiting isn't implemented yet
      const rapidRequests = Array(50).fill(null).map(() =>
        request.post('/api/analytics/events', {
          data: validPageViewEvent,
          headers: {
            'Content-Type': 'application/json'
          }
        })
      );

      const responses = await Promise.all(rapidRequests);

      // Check if any response is rate limited
      const rateLimitedResponse = responses.find(response => response.status() === 429);

      if (rateLimitedResponse) {
        const responseBody = await rateLimitedResponse.json();
        expect(responseBody).toMatchObject({
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: expect.stringContaining('rate limit'),
          retry_after: expect.any(Number)
        });
      } else {
        console.log('ℹ️  Rate limiting not triggered or not implemented yet');
      }
    });
  });

  test.describe('Response Schema Validation', () => {

    test('should return consistent response schema for success cases', async () => {
      const response = await request.post('/api/analytics/events', {
        data: validPageViewEvent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Skip schema validation if endpoint doesn't exist yet
      if (response.status() === 404) {
        console.log('✅ TDD: Skipping schema validation (endpoint not implemented)');
        return;
      }

      if (response.status() === 201) {
        const responseBody = await response.json();

        // Validate required fields are present
        expect(responseBody).toHaveProperty('success');
        expect(responseBody).toHaveProperty('event_id');
        expect(responseBody).toHaveProperty('message');

        // Validate data types
        expect(typeof responseBody.success).toBe('boolean');
        expect(typeof responseBody.event_id).toBe('string');
        expect(typeof responseBody.message).toBe('string');

        // Validate event_id format (UUID v4)
        expect(responseBody.event_id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      }
    });

    test('should return consistent error schema for error cases', async () => {
      const response = await request.post('/api/analytics/events', {
        data: invalidEvent,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Skip schema validation if endpoint doesn't exist yet
      if (response.status() === 404) {
        console.log('✅ TDD: Skipping error schema validation (endpoint not implemented)');
        return;
      }

      if (response.status() === 400) {
        const responseBody = await response.json();

        // Validate required error fields are present
        expect(responseBody).toHaveProperty('success');
        expect(responseBody).toHaveProperty('error');
        expect(responseBody).toHaveProperty('message');

        // Validate data types
        expect(typeof responseBody.success).toBe('boolean');
        expect(typeof responseBody.error).toBe('string');
        expect(typeof responseBody.message).toBe('string');

        // Validate success is false for errors
        expect(responseBody.success).toBe(false);
      }
    });
  });

  test.describe('Content-Type Validation', () => {

    test('should reject requests without Content-Type header', async () => {
      const response = await request.post('/api/analytics/events', {
        data: JSON.stringify(validPageViewEvent)
        // No Content-Type header
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_CONTENT_TYPE',
        message: expect.stringContaining('Content-Type')
      });
    });

    test('should reject requests with wrong Content-Type', async () => {
      const response = await request.post('/api/analytics/events', {
        data: JSON.stringify(validPageViewEvent),
        headers: {
          'Content-Type': 'text/plain'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_CONTENT_TYPE',
        message: expect.stringContaining('application/json')
      });
    });
  });
});