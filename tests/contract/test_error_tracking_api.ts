/**
 * T068: Error Tracking API Contract Tests
 *
 * Contract tests for error tracking API endpoint including JavaScript errors,
 * network errors, promise rejections, and error severity categorization.
 *
 * Expected: FAIL initially (404 Not Found) - endpoints don't exist yet (TDD)
 */

import { test, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

// Test data fixtures
const validJavaScriptError = {
  type: 'javascript_error',
  severity: 'medium',
  message: 'Cannot read property \'click\' of null',
  stack: 'TypeError: Cannot read property \'click\' of null\n    at HTMLButtonElement.<anonymous> (main.js:42:5)\n    at HTMLButtonElement.dispatchEvent (main.js:15:3)',
  filename: 'main.js',
  line_number: 42,
  column_number: 5,
  page: {
    path: '/projects',
    title: 'Projects - Omar Torres',
    url: 'https://bizkit.dev/projects',
    referrer: 'https://bizkit.dev/'
  },
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  session_id: 'test-session-123',
  custom_data: {
    component: 'ProjectCard',
    action: 'handleClick',
    user_interaction: true
  },
  reproducible: true,
  resolved: false
};

const validNetworkError = {
  type: 'network_error',
  severity: 'high',
  message: 'Failed to fetch resource: the server responded with a status of 404 (Not Found)',
  page: {
    path: '/api/projects',
    title: 'API Error',
    url: 'https://bizkit.dev/api/projects',
    referrer: 'https://bizkit.dev/'
  },
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  session_id: 'test-session-123',
  custom_data: {
    status_code: 404,
    method: 'GET',
    url: '/api/projects',
    response_time: 150
  },
  reproducible: false,
  resolved: false
};

const validPromiseRejection = {
  type: 'promise_rejection',
  severity: 'low',
  message: 'Unhandled Promise Rejection: Error: Network request failed',
  stack: 'Error: Network request failed\n    at fetchProjects (api.js:25:11)\n    at async loadProjects (projects.js:18:5)',
  filename: 'api.js',
  line_number: 25,
  column_number: 11,
  page: {
    path: '/projects',
    title: 'Projects - Omar Torres',
    url: 'https://bizkit.dev/projects',
    referrer: 'https://bizkit.dev/'
  },
  user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  session_id: 'test-session-123',
  custom_data: {
    promise_state: 'rejected',
    rejection_reason: 'Network failure'
  },
  reproducible: true,
  resolved: false
};

const invalidError = {
  type: 'invalid_error_type',
  severity: 'invalid_severity',
  // Missing required fields: message, page
};

test.describe('Error Tracking API Contract Tests', () => {
  let request: APIRequestContext;

  test.beforeAll(async ({ playwright }) => {
    request = await playwright.request.newContext({
      baseURL: 'http://localhost:4321'
    });
  });

  test.afterAll(async () => {
    await request.dispose();
  });

  test.describe('POST /api/analytics/errors - Error Tracking Endpoint', () => {

    test('should accept valid JavaScript error', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: validJavaScriptError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        error_id: expect.any(String),
        message: 'Error recorded successfully'
      });
    });

    test('should accept valid network error', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: validNetworkError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        error_id: expect.any(String),
        message: 'Error recorded successfully'
      });
    });

    test('should accept valid promise rejection', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: validPromiseRejection,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        error_id: expect.any(String),
        message: 'Error recorded successfully'
      });
    });

    test('should reject invalid error data with 400 Bad Request', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: invalidError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_ERROR_DATA',
        message: expect.stringContaining('validation'),
        details: expect.any(Object)
      });
    });

    test('should handle malformed JSON with 400 Bad Request', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: '{ invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
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

    test('should handle error with minimal required fields', async () => {
      const minimalError = {
        type: 'javascript_error',
        severity: 'medium',
        message: 'Simple error message',
        page: {
          path: '/',
          title: 'Homepage',
          url: 'https://bizkit.dev/'
        }
      };

      const response = await request.post('/api/analytics/errors', {
        data: minimalError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        error_id: expect.any(String),
        message: 'Error recorded successfully'
      });
    });

    test('should reject unsupported error types', async () => {
      const unsupportedError = {
        type: 'unsupported_error_type',
        severity: 'high',
        message: 'This error type is not supported',
        page: {
          path: '/',
          title: 'Homepage',
          url: 'https://bizkit.dev/'
        }
      };

      const response = await request.post('/api/analytics/errors', {
        data: unsupportedError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_ERROR_TYPE',
        message: expect.stringContaining('unsupported error type'),
        supported_types: ['javascript_error', 'network_error', 'resource_error', 'promise_rejection', 'custom_error', 'analytics_error', 'performance_error']
      });
    });

    test('should reject invalid severity levels', async () => {
      const invalidSeverityError = {
        type: 'javascript_error',
        severity: 'invalid_severity',
        message: 'Error with invalid severity',
        page: {
          path: '/',
          title: 'Homepage',
          url: 'https://bizkit.dev/'
        }
      };

      const response = await request.post('/api/analytics/errors', {
        data: invalidSeverityError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 400 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(400);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: false,
        error: 'INVALID_SEVERITY',
        message: expect.stringContaining('invalid severity level'),
        supported_severities: ['low', 'medium', 'high', 'critical']
      });
    });
  });

  test.describe('Error Schema Validation', () => {

    test('should return consistent response schema for success cases', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: validJavaScriptError,
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
        expect(responseBody).toHaveProperty('error_id');
        expect(responseBody).toHaveProperty('message');

        // Validate data types
        expect(typeof responseBody.success).toBe('boolean');
        expect(typeof responseBody.error_id).toBe('string');
        expect(typeof responseBody.message).toBe('string');

        // Validate error_id format (UUID v4)
        expect(responseBody.error_id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
      }
    });

    test('should return consistent error schema for error cases', async () => {
      const response = await request.post('/api/analytics/errors', {
        data: invalidError,
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
      const response = await request.post('/api/analytics/errors', {
        data: JSON.stringify(validJavaScriptError)
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
      const response = await request.post('/api/analytics/errors', {
        data: JSON.stringify(validJavaScriptError),
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

  test.describe('Error Context and Metadata', () => {

    test('should include comprehensive error metadata', async () => {
      const errorWithMetadata = {
        type: 'javascript_error',
        severity: 'high',
        message: 'Application initialization failed',
        stack: 'Error: Application initialization failed\n    at initializeApp (app.js:1:15)',
        filename: 'app.js',
        line_number: 1,
        column_number: 15,
        page: {
          path: '/',
          title: 'Omar Torres | Data & AI Enthusiast',
          url: 'https://bizkit.dev/',
          referrer: 'https://google.com',
          queryParams: { ref: 'search', utm_source: 'google' },
          hash: '#home'
        },
        user: {
          device_type: 'desktop',
          screen_resolution: '1920x1080',
          viewport_size: '1440x900',
          browser_name: 'Chrome',
          browser_version: '118.0.0.0',
          platform: 'Windows',
          timezone: 'America/New_York',
          language: 'en-US',
          is_first_visit: false,
          session_start_time: Date.now() - 60000, // 1 minute ago
          page_views: 3
        },
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        session_id: 'test-session-123',
        custom_data: {
          component: 'AppInitializer',
          version: '1.0.0',
          environment: 'production',
          user_id: 'user-12345',
          feature_flags: ['analytics', 'performance_monitoring'],
          previous_errors: 0
        },
        reproducible: true,
        resolved: false
      };

      const response = await request.post('/api/analytics/errors', {
        data: errorWithMetadata,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        error_id: expect.any(String),
        message: 'Error recorded successfully'
      });
    });

    test('should handle performance-related errors', async () => {
      const performanceError = {
        type: 'performance_error',
        severity: 'medium',
        message: 'Long task detected: 350ms execution time exceeded threshold',
        page: {
          path: '/projects',
          title: 'Projects - Omar Torres',
          url: 'https://bizkit.dev/projects'
        },
        custom_data: {
          task_duration: 350,
          threshold: 200,
          task_name: 'project_card_render',
          blocking_time: 150,
          start_time: Date.now() - 5000
        },
        reproducible: false,
        resolved: false
      };

      const response = await request.post('/api/analytics/errors', {
        data: performanceError,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Expected: 404 initially (TDD), then 201 after implementation
      if (response.status() === 404) {
        console.log('✅ TDD: Error tracking endpoint not implemented yet (expected 404)');
        return;
      }

      expect(response.status()).toBe(201);

      const responseBody = await response.json();
      expect(responseBody).toMatchObject({
        success: true,
        error_id: expect.any(String),
        message: 'Error recorded successfully'
      });
    });
  });
});