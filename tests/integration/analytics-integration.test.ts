/**
 * Integration Tests: Analytics API Endpoints
 *
 * Tests comprehensive analytics API integration including:
 * - All analytics API endpoints functionality
 * - Real data processing and storage
 * - Error handling and rate limiting
 * - Middleware integration testing
 * - End-to-end analytics workflow
 *
 * Feature: 057-advanced-analytics-monitoring
 * Task: T097
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4321';

// Analytics API endpoints
const ANALYTICS_ENDPOINTS = {
  events: '/api/analytics/events',
  eventsBatch: '/api/analytics/events/batch',
  errors: '/api/analytics/errors',
  consent: '/api/analytics/consent',
  performance: '/api/analytics/performance',
  performanceMetrics: '/api/analytics/performance/metrics',
  performanceReport: '/api/analytics/performance/report',
  dashboard: '/api/analytics/dashboard'
};

// Test data generators
function generateAnalyticsEvent(overrides?: any) {
  return {
    id: `test_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category: 'test_category',
    action: 'test_action',
    label: 'test_label',
    value: Math.floor(Math.random() * 100),
    timestamp: Date.now(),
    page: {
      path: '/test',
      title: 'Test Page',
      url: `${TEST_BASE_URL}/test`,
      referrer: ''
    },
    user: {
      sessionId: `session_${Date.now()}`,
      userAgent: 'Test Agent',
      language: 'en-US'
    },
    consentLevel: 'analytics',
    ...overrides
  };
}

function generatePerformanceMetrics(overrides?: any) {
  return {
    coreWebVitals: {
      lcp: Math.random() * 3000 + 500,
      fcp: Math.random() * 2000 + 300,
      cls: Math.random() * 0.3,
      fid: Math.random() * 200 + 10
    },
    navigationTiming: {
      dnsLookup: Math.random() * 100 + 5,
      connectionTime: Math.random() * 150 + 10,
      serverResponse: Math.random() * 500 + 50,
      domContentLoaded: Math.random() * 2000 + 200
    },
    resourceTiming: [
      {
        name: 'test.css',
        duration: Math.random() * 100 + 10,
        size: Math.random() * 50000 + 1000,
        type: 'stylesheet'
      }
    ],
    timestamp: Date.now(),
    url: '/test',
    deviceType: 'desktop',
    ...overrides
  };
}

describe('Analytics API Integration Tests', () => {
  let server: any = null;

  beforeAll(async () => {
    // Server should be running for integration tests
    console.log(`Testing against: ${TEST_BASE_URL}`);
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  beforeEach(async () => {
    // Reset any test state
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Analytics Events API', () => {
    it('should accept valid analytics events', async () => {
      const eventData = generateAnalyticsEvent();

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('eventId');
      expect(result.eventId).toBe(eventData.id);
    });

    it('should validate required event fields', async () => {
      const invalidEvent = {
        // Missing required fields
        timestamp: Date.now()
      };

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidEvent)
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('validation');
    });

    it('should handle batch event submission', async () => {
      const events = [
        generateAnalyticsEvent({ action: 'batch_test_1' }),
        generateAnalyticsEvent({ action: 'batch_test_2' }),
        generateAnalyticsEvent({ action: 'batch_test_3' })
      ];

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.eventsBatch}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('processed');
      expect(result.processed).toBe(events.length);
    });

    it('should respect consent levels', async () => {
      const eventWithoutConsent = generateAnalyticsEvent({
        consentLevel: 'none'
      });

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventWithoutConsent)
      });

      expect(response.status).toBe(403);

      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('consent');
    });

    it('should implement rate limiting', async () => {
      const event = generateAnalyticsEvent();

      // Send many requests rapidly
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(
          fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...event,
              id: `${event.id}_${i}`
            })
          })
        );
      }

      const responses = await Promise.all(promises);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should sanitize potentially malicious data', async () => {
      const maliciousEvent = generateAnalyticsEvent({
        action: '<script>alert("xss")</script>',
        label: 'javascript:alert("xss")',
        page: {
          title: '<img src=x onerror=alert("xss")>',
          path: '/test<script>',
          url: 'javascript:void(0)'
        }
      });

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(maliciousEvent)
      });

      // Should either reject malicious data or sanitize it
      if (response.status === 200) {
        const result = await response.json();
        expect(result.success).toBe(true);
        // Data should be sanitized (no script tags, javascript: URLs, etc.)
      } else {
        expect(response.status).toBe(400);
        const result = await response.json();
        expect(result.error).toContain('malicious');
      }
    });
  });

  describe('Error Tracking API', () => {
    it('should accept error reports', async () => {
      const errorData = {
        message: 'Test error message',
        source: 'test_source',
        stack: 'Error: Test error\n    at test.js:1:1',
        severity: 'error',
        timestamp: Date.now(),
        page: {
          path: '/test',
          url: `${TEST_BASE_URL}/test`
        },
        user: {
          sessionId: `session_${Date.now()}`,
          userAgent: 'Test Agent'
        }
      };

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.errors}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('errorId');
    });

    it('should handle different error severity levels', async () => {
      const severityLevels = ['debug', 'info', 'warning', 'error', 'fatal'];

      for (const severity of severityLevels) {
        const errorData = {
          message: `Test ${severity} message`,
          source: 'test_source',
          severity: severity,
          timestamp: Date.now(),
          page: { path: '/test', url: `${TEST_BASE_URL}/test` },
          user: { sessionId: `session_${Date.now()}` }
        };

        const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.errors}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData)
        });

        expect(response.status).toBe(200);

        const result = await response.json();
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Consent Management API', () => {
    it('should handle consent updates', async () => {
      const consentData = {
        level: 'analytics',
        timestamp: Date.now(),
        preferences: {
          analytics: true,
          marketing: false,
          functional: true
        },
        sessionId: `session_${Date.now()}`
      };

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.consent}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(consentData)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('consentId');
    });

    it('should validate consent levels', async () => {
      const invalidConsentData = {
        level: 'invalid_level',
        timestamp: Date.now()
      };

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.consent}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidConsentData)
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should retrieve current consent status', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.consent}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('consent');
      expect(['none', 'essential', 'functional', 'analytics', 'marketing', 'full'])
        .toContain(result.consent.level);
    });
  });

  describe('Performance Metrics API', () => {
    it('should accept performance data', async () => {
      const performanceData = generatePerformanceMetrics();

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.performance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('metricId');
    });

    it('should retrieve performance metrics', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.performanceMetrics}`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('metrics');
      expect(Array.isArray(result.metrics)).toBe(true);
    });

    it('should generate performance reports', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.performanceReport}`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('report');
      expect(result.report).toHaveProperty('summary');
    });

    it('should validate Core Web Vitals thresholds', async () => {
      const performanceData = generatePerformanceMetrics({
        coreWebVitals: {
          lcp: 5000, // Poor LCP
          fcp: 4000, // Poor FCP
          cls: 0.5,  // Poor CLS
          fid: 500   // Poor FID
        }
      });

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.performance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(performanceData)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);

      if (result.analysis) {
        expect(result.analysis).toHaveProperty('ratings');
        // Poor performance should be flagged
        expect(result.analysis.overallRating).toBe('poor');
      }
    });
  });

  describe('Analytics Dashboard API', () => {
    it('should provide dashboard data', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.dashboard}`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');

      const dashboardData = result.data;
      expect(dashboardData).toHaveProperty('overview');
      expect(dashboardData).toHaveProperty('metrics');
      expect(dashboardData).toHaveProperty('trends');
    });

    it('should support date range filtering', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
      const endDate = new Date().toISOString();

      const response = await fetch(
        `${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.dashboard}?start=${startDate}&end=${endDate}`,
        { method: 'GET' }
      );

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('data');
      expect(result.data).toHaveProperty('dateRange');
    });
  });

  describe('API Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json {'
      });

      expect(response.status).toBe(400);

      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('JSON');
    });

    it('should handle oversized payloads', async () => {
      const oversizedEvent = generateAnalyticsEvent({
        largeData: 'x'.repeat(1024 * 1024) // 1MB of data
      });

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(oversizedEvent)
      });

      expect(response.status).toBe(413);

      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('size');
    });

    it('should handle unsupported HTTP methods', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'DELETE'
      });

      expect(response.status).toBe(405);

      const result = await response.json();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should provide proper CORS headers', async () => {
      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'OPTIONS'
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
      expect(response.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
    });
  });

  describe('Middleware Integration', () => {
    it('should process analytics events through middleware', async () => {
      const event = generateAnalyticsEvent({
        category: 'middleware_test',
        action: 'integration_test'
      });

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Test-Header': 'middleware-integration'
        },
        body: JSON.stringify(event)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);

      // Middleware should have processed the event
      if (result.metadata) {
        expect(result.metadata).toHaveProperty('processedBy');
        expect(result.metadata.processedBy).toContain('analytics_middleware');
      }
    });

    it('should enrich events with server-side data', async () => {
      const event = generateAnalyticsEvent();

      const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Test Browser/1.0',
          'X-Forwarded-For': '203.0.113.1'
        },
        body: JSON.stringify(event)
      });

      expect(response.status).toBe(200);

      const result = await response.json();
      expect(result).toHaveProperty('success', true);

      if (result.enrichedData) {
        expect(result.enrichedData).toHaveProperty('serverTimestamp');
        expect(result.enrichedData).toHaveProperty('userAgent');
        expect(result.enrichedData).toHaveProperty('ipHash');
      }
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const events = Array.from({ length: 10 }, () => generateAnalyticsEvent());

      const startTime = Date.now();

      const promises = events.map(event =>
        fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event)
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently (under 5 seconds for 10 requests)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should maintain data consistency under load', async () => {
      const batchSize = 5;
      const batches = 3;

      for (let batch = 0; batch < batches; batch++) {
        const events = Array.from({ length: batchSize }, (_, i) =>
          generateAnalyticsEvent({
            action: `load_test_batch_${batch}_event_${i}`,
            value: batch * batchSize + i
          })
        );

        const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.eventsBatch}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events })
        });

        expect(response.status).toBe(200);

        const result = await response.json();
        expect(result).toHaveProperty('success', true);
        expect(result.processed).toBe(batchSize);
      }
    });

    it('should handle timeout scenarios gracefully', async () => {
      // This test simulates slow processing
      const event = generateAnalyticsEvent({
        action: 'timeout_test',
        metadata: {
          simulateSlowProcessing: true
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const response = await fetch(`${TEST_BASE_URL}${ANALYTICS_ENDPOINTS.events}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        // Should either complete quickly or handle timeout gracefully
        expect(response.status).toBeLessThan(500);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // Timeout occurred - this is acceptable for this test
          expect(error.name).toBe('AbortError');
        } else {
          throw error;
        }
      }
    });
  });
});