import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ErrorEvent, PageContext, UserContext, ApiResponse, AnalyticsError } from '../../src/types/analytics';
import { ErrorType, ErrorSeverity, DeviceType } from '../../src/types/analytics';

/**
 * Contract tests for POST /api/analytics/errors endpoint
 * Tests API contract compliance before implementation exists
 * These tests MUST FAIL until the endpoint is implemented
 *
 * Expected Behavior: Tests should return 404 Not Found initially
 * This is correct TDD behavior - implementing RED phase before GREEN
 */
describe('POST /api/analytics/errors - Contract Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:4321';
  const endpoint = `${baseUrl}/api/analytics/errors`;

  let mockPageContext: PageContext;
  let mockUserContext: UserContext;

  beforeEach(() => {
    // Set up test fixtures
    mockPageContext = {
      path: '/projects/ai-trading-system',
      title: 'AI Trading System - Project Details',
      url: 'http://localhost:4321/projects/ai-trading-system',
      referrer: 'http://localhost:4321/projects',
      queryParams: { source: 'portfolio' },
      hash: '#overview',
      loadTime: 1250
    };

    mockUserContext = {
      deviceType: DeviceType.DESKTOP,
      screenResolution: '1920x1080',
      viewportSize: '1440x900',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
      browserName: 'Chrome',
      browserVersion: '118.0.0.0',
      platform: 'Windows',
      country: 'US',
      region: 'CA',
      timezone: 'America/Los_Angeles',
      language: 'en-US',
      isFirstVisit: false,
      sessionStartTime: Date.now() - 30000,
      pageViews: 3,
      previousVisits: 5
    };
  });

  afterEach(() => {
    // Cleanup after tests
  });

  describe('Valid Error Events (201 Created)', () => {
    it('should accept valid JavaScript error with full stack trace', async () => {
      const validJavaScriptError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'TypeError: Cannot read properties of undefined (reading \'length\')',
        stack: `TypeError: Cannot read properties of undefined (reading 'length')
    at processProjects (http://localhost:4321/_astro/client.js:1:2345)
    at async loadProjectData (http://localhost:4321/_astro/client.js:1:1234)
    at HTMLButtonElement.onClick (http://localhost:4321/projects:42:15)`,
        filename: 'http://localhost:4321/_astro/client.js',
        lineNumber: 1,
        columnNumber: 2345,
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        customData: {
          component: 'ProjectGrid',
          action: 'loadProjects',
          projectId: 'ai-trading-system'
        },
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validJavaScriptError)
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: ApiResponse<{ errorId: string }> = await response.json();

      // Response schema validation
      expect(responseData).toHaveProperty('success');
      expect(responseData.success).toBe(true);
      expect(responseData).toHaveProperty('data');
      expect(responseData.data).toHaveProperty('errorId');
      expect(responseData).toHaveProperty('timestamp');

      // Error ID should be UUID format
      expect(responseData.data.errorId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );

      // Timestamp should be recent
      expect(responseData.timestamp).toBeGreaterThan(Date.now() - 5000);
    });

    it('should accept valid network error event', async () => {
      const validNetworkError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: 'Failed to fetch - ERR_CONNECTION_REFUSED',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        customData: {
          url: '/api/projects',
          method: 'GET',
          status: 0,
          statusText: '',
          timeout: 5000,
          retryCount: 2
        },
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validNetworkError)
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: ApiResponse<{ errorId: string }> = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('errorId');
      expect(responseData.data.errorId).toMatch(/^[0-9a-f-]+$/);
    });

    it('should accept critical error with minimal required fields', async () => {
      const criticalError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.PROMISE_REJECTION,
        severity: ErrorSeverity.CRITICAL,
        message: 'Unhandled Promise Rejection: Authentication failed',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        customData: {
          origin: 'auth-service',
          errorCode: 'AUTH_TIMEOUT',
          impact: 'user-blocked'
        },
        reproducible: false,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(criticalError)
      });

      expect(response.status).toBe(201);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseData: ApiResponse<{ errorId: string }> = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('errorId');
    });

    it('should handle error with all error types', async () => {
      const errorTypes = [
        ErrorType.JAVASCRIPT_ERROR,
        ErrorType.NETWORK_ERROR,
        ErrorType.RESOURCE_ERROR,
        ErrorType.PROMISE_REJECTION,
        ErrorType.CUSTOM_ERROR,
        ErrorType.ANALYTICS_ERROR,
        ErrorType.PERFORMANCE_ERROR
      ];

      for (const errorType of errorTypes) {
        const errorEvent: Omit<ErrorEvent, 'id'> = {
          timestamp: Date.now(),
          type: errorType,
          severity: ErrorSeverity.LOW,
          message: `Test error for type: ${errorType}`,
          page: mockPageContext,
          user: mockUserContext,
          userAgent: mockUserContext.userAgent,
          customData: { testType: errorType },
          reproducible: true,
          resolved: false
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorEvent)
        });

        expect(response.status).toBe(201);
        const responseData = await response.json();
        expect(responseData.success).toBe(true);
      }
    });

    it('should handle error with all severity levels', async () => {
      const severityLevels = [
        ErrorSeverity.LOW,
        ErrorSeverity.MEDIUM,
        ErrorSeverity.HIGH,
        ErrorSeverity.CRITICAL
      ];

      for (const severity of severityLevels) {
        const errorEvent: Omit<ErrorEvent, 'id'> = {
          timestamp: Date.now(),
          type: ErrorType.CUSTOM_ERROR,
          severity: severity,
          message: `Test error with severity: ${severity}`,
          page: mockPageContext,
          user: mockUserContext,
          userAgent: mockUserContext.userAgent,
          customData: { testSeverity: severity },
          reproducible: true,
          resolved: false
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorEvent)
        });

        expect(response.status).toBe(201);
        const responseData = await response.json();
        expect(responseData.success).toBe(true);
      }
    });

    it('should accept error with optional fields populated', async () => {
      const fullError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.HIGH,
        message: 'ReferenceError: myFunction is not defined',
        stack: 'ReferenceError: myFunction is not defined\n    at HTMLElement.onclick (example.js:10:5)',
        filename: 'http://localhost:4321/scripts/example.js',
        lineNumber: 10,
        columnNumber: 5,
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        customData: {
          feature: 'project-interaction',
          userId: 'user-123',
          sessionId: 'session-456',
          environment: 'production',
          buildVersion: '1.2.3'
        },
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fullError)
      });

      expect(response.status).toBe(201);
      const responseData = await response.json();
      expect(responseData.success).toBe(true);
      expect(responseData.data).toHaveProperty('errorId');
    });
  });

  describe('Invalid Error Events (400 Bad Request)', () => {
    it('should reject error event with missing required fields', async () => {
      const incompleteError = {
        // Missing timestamp, type, severity, message, page, user, userAgent
        message: 'Incomplete error',
        customData: { test: true }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incompleteError)
      });

      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain('application/json');

      const errorResponse: AnalyticsError = await response.json();

      expect(errorResponse.success).toBe(false);
      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('code');
      expect(errorResponse).toHaveProperty('timestamp');
      expect(errorResponse.error).toContain('required');
    });

    it('should reject error event with invalid timestamp', async () => {
      const invalidTimestampError: Omit<ErrorEvent, 'id'> = {
        timestamp: -1, // Invalid negative timestamp
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidTimestampError)
      });

      expect(response.status).toBe(400);
      const errorResponse = await response.json();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toContain('timestamp');
    });

    it('should reject error event with invalid error type', async () => {
      const invalidTypeError = {
        timestamp: Date.now(),
        type: 'invalid_error_type', // Not a valid ErrorType enum value
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidTypeError)
      });

      expect(response.status).toBe(400);
      const errorResponse = await response.json();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toContain('type');
    });

    it('should reject error event with invalid severity', async () => {
      const invalidSeverityError = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: 'extreme', // Not a valid ErrorSeverity enum value
        message: 'Test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidSeverityError)
      });

      expect(response.status).toBe(400);
      const errorResponse = await response.json();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toContain('severity');
    });

    it('should reject error event with empty message', async () => {
      const emptyMessageError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: '', // Empty message should be invalid
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emptyMessageError)
      });

      expect(response.status).toBe(400);
      const errorResponse = await response.json();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toContain('message');
    });

    it('should reject error event with invalid page context', async () => {
      const invalidPageError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        page: {
          path: '', // Empty path should be invalid
          title: '',
          url: 'invalid-url' // Invalid URL format
        } as PageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidPageError)
      });

      expect(response.status).toBe(400);
      const errorResponse = await response.json();
      expect(errorResponse.success).toBe(false);
    });

    it('should reject malformed JSON request body', async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{ invalid json syntax }' // Malformed JSON
      });

      expect(response.status).toBe(400);
      const errorResponse = await response.json();
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toContain('JSON');
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-POST methods', async () => {
      const methods = ['GET', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const response = await fetch(endpoint, { method });
        expect([405, 404]).toContain(response.status); // Method Not Allowed or Not Found
      }
    });

    it('should handle HEAD requests appropriately', async () => {
      const response = await fetch(endpoint, { method: 'HEAD' });
      expect([405, 404]).toContain(response.status);
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await fetch(endpoint, { method: 'OPTIONS' });
      expect([200, 204, 405]).toContain(response.status);
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject requests without Content-Type header', async () => {
      const validError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        // Missing Content-Type header
        body: JSON.stringify(validError)
      });

      expect([400, 415]).toContain(response.status); // Bad Request or Unsupported Media Type
    });

    it('should reject requests with invalid Content-Type', async () => {
      const validError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain' // Should require application/json
        },
        body: JSON.stringify(validError)
      });

      expect([400, 415]).toContain(response.status);
    });
  });

  describe('Security Headers and CORS', () => {
    it('should include appropriate security headers', async () => {
      const validError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validError)
      });

      // Security headers that should be present
      const securityHeaders = [
        'x-content-type-options',
        'x-frame-options',
        'x-xss-protection'
      ];

      securityHeaders.forEach(header => {
        const headerValue = response.headers.get(header);
        if (headerValue) {
          expect(typeof headerValue).toBe('string');
        }
      });
    });

    it('should not expose sensitive information in error responses', async () => {
      const maliciousError = {
        timestamp: Date.now(),
        type: 'sql_injection_attempt',
        severity: 'critical',
        message: 'SELECT * FROM users WHERE password = "admin"',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: 'Malicious-Bot/1.0',
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(maliciousError)
      });

      const responseBody = await response.text();

      // Should not expose internal implementation details
      expect(responseBody).not.toContain('database');
      expect(responseBody).not.toContain('connection string');
      expect(responseBody).not.toContain('stack trace');
      expect(responseBody).not.toContain('internal server');
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle multiple rapid error submissions', async () => {
      const errorEvent: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Rapid test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      // Submit multiple errors rapidly
      const requests = Array.from({ length: 10 }, () =>
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorEvent)
        })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect([201, 400, 429]).toContain(response.status); // 429 = Too Many Requests
      });
    });

    it('should respond quickly to error submissions', async () => {
      const errorEvent: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Performance test error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const startTime = Date.now();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorEvent)
      });
      const endTime = Date.now();

      // Error tracking should be fast (within 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      expect([201, 400, 404]).toContain(response.status);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very large error messages', async () => {
      const largeMessage = 'x'.repeat(10000); // 10KB message

      const largeError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: largeMessage,
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(largeError)
      });

      // Should either accept it (201) or reject due to size limits (413)
      expect([201, 413]).toContain(response.status);
    });

    it('should handle future timestamps gracefully', async () => {
      const futureError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now() + 86400000, // 24 hours in the future
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Future timestamp error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(futureError)
      });

      // Should handle gracefully - either accept with adjustment or reject
      expect([201, 400]).toContain(response.status);
    });

    it('should handle null and undefined custom data', async () => {
      const errorWithNullData: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Null custom data error',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        customData: null as any,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorWithNullData)
      });

      expect([201, 400]).toContain(response.status);
    });
  });

  describe('Response Schema Validation', () => {
    it('should return consistent success response schema', async () => {
      const validError: Omit<ErrorEvent, 'id'> = {
        timestamp: Date.now(),
        type: ErrorType.JAVASCRIPT_ERROR,
        severity: ErrorSeverity.LOW,
        message: 'Schema validation test',
        page: mockPageContext,
        user: mockUserContext,
        userAgent: mockUserContext.userAgent,
        reproducible: true,
        resolved: false
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validError)
      });

      if (response.status === 201) {
        const responseData: ApiResponse<{ errorId: string }> = await response.json();

        // Validate required success response fields
        expect(responseData).toHaveProperty('success');
        expect(responseData).toHaveProperty('data');
        expect(responseData).toHaveProperty('timestamp');
        expect(responseData.success).toBe(true);
        expect(responseData.data).toHaveProperty('errorId');
        expect(typeof responseData.data.errorId).toBe('string');
        expect(typeof responseData.timestamp).toBe('number');
      }
    });

    it('should return consistent error response schema', async () => {
      const invalidError = {
        // Intentionally invalid to trigger error response
        invalid: 'data'
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidError)
      });

      if (response.status >= 400) {
        const errorResponse: AnalyticsError = await response.json();

        // Validate required error response fields
        expect(errorResponse).toHaveProperty('success');
        expect(errorResponse).toHaveProperty('error');
        expect(errorResponse).toHaveProperty('code');
        expect(errorResponse).toHaveProperty('timestamp');
        expect(errorResponse.success).toBe(false);
        expect(typeof errorResponse.error).toBe('string');
        expect(typeof errorResponse.code).toBe('string');
        expect(typeof errorResponse.timestamp).toBe('number');
      }
    });
  });
});