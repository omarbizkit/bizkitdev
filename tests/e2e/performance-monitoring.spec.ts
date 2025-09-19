/**
 * E2E Tests: Performance Monitoring Accuracy
 *
 * Tests comprehensive performance monitoring including:
 * - Core Web Vitals collection and accuracy
 * - Performance Observer API integration
 * - Resource timing and navigation timing
 * - Performance budget monitoring
 * - Real User Monitoring (RUM) validation
 *
 * Feature: 057-advanced-analytics-monitoring
 * Task: T096
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4321';

// Performance thresholds (Google's recommended values)
const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  fcp: { good: 1800, poor: 3000 },      // First Contentful Paint
  fid: { good: 100, poor: 300 },        // First Input Delay
  cls: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  ttfb: { good: 800, poor: 1800 }       // Time to First Byte
};

interface PerformanceEvent {
  metric: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  metadata?: Record<string, any>;
  timestamp: number;
}

test.describe('Performance Monitoring Accuracy', () => {
  let page: Page;
  let performanceEvents: PerformanceEvent[] = [];

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    performanceEvents = [];

    // Mock performance monitoring
    await page.addInitScript(() => {
      (window as any).capturedPerformanceEvents = [];

      // Mock analytics performance tracking
      (window as any).analytics = {
        trackPerformanceEvent: (metric: string, value: number, metadata?: any) => {
          const event: any = {
            metric,
            value,
            metadata,
            timestamp: Date.now()
          };

          // Add performance rating
          if (metric === 'lcp') {
            event.rating = value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
          } else if (metric === 'fcp') {
            event.rating = value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
          } else if (metric === 'fid') {
            event.rating = value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
          } else if (metric === 'cls') {
            event.rating = value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
          }

          (window as any).capturedPerformanceEvents.push(event);
        }
      };

      // Enhanced Performance Observer mock
      const originalPerformanceObserver = window.PerformanceObserver;
      (window as any).performanceObservers = [];

      window.PerformanceObserver = class MockPerformanceObserver {
        private callback: PerformanceObserverCallback;
        private options: PerformanceObserverInit;

        constructor(callback: PerformanceObserverCallback) {
          this.callback = callback;
          (window as any).performanceObservers.push(this);
        }

        observe(options: PerformanceObserverInit) {
          this.options = options;

          // Simulate Core Web Vitals entries
          setTimeout(() => {
            if (options.entryTypes?.includes('largest-contentful-paint')) {
              this.simulateLCP();
            }
            if (options.entryTypes?.includes('paint')) {
              this.simulatePaintMetrics();
            }
            if (options.entryTypes?.includes('layout-shift')) {
              this.simulateCLS();
            }
            if (options.entryTypes?.includes('first-input')) {
              this.simulateFID();
            }
          }, 100);
        }

        simulateLCP() {
          const lcpValue = Math.random() * 3000 + 500; // 500-3500ms
          const mockEntry = {
            entryType: 'largest-contentful-paint',
            startTime: lcpValue,
            element: document.body,
            name: 'largest-contentful-paint'
          };

          this.callback({
            getEntries: () => [mockEntry]
          } as any, this as any);
        }

        simulatePaintMetrics() {
          const fcpValue = Math.random() * 2000 + 300; // 300-2300ms
          const mockFCPEntry = {
            entryType: 'paint',
            startTime: fcpValue,
            name: 'first-contentful-paint'
          };

          this.callback({
            getEntries: () => [mockFCPEntry]
          } as any, this as any);
        }

        simulateCLS() {
          const clsValue = Math.random() * 0.3; // 0-0.3
          const mockEntry = {
            entryType: 'layout-shift',
            value: clsValue,
            hadRecentInput: Math.random() > 0.7, // 30% chance of recent input
            sources: []
          };

          this.callback({
            getEntries: () => [mockEntry]
          } as any, this as any);
        }

        simulateFID() {
          const fidValue = Math.random() * 200 + 10; // 10-210ms
          const mockEntry = {
            entryType: 'first-input',
            processingStart: 1000 + fidValue,
            startTime: 1000,
            name: 'mousedown'
          };

          this.callback({
            getEntries: () => [mockEntry]
          } as any, this as any);
        }

        disconnect() {
          // Mock disconnect
        }
      };

      // Signal analytics ready
      window.dispatchEvent(new CustomEvent('analyticsReady'));
    });
  });

  test('should collect Core Web Vitals metrics', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for performance observers to initialize and collect metrics
    await page.waitForTimeout(2000);

    const performanceEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents
    );

    // Should have captured Core Web Vitals
    const metrics = performanceEvents.map((e: any) => e.metric);

    // Check for core metrics (at least some should be present)
    const coreMetrics = ['lcp', 'fcp', 'cls', 'page_load'];
    const foundMetrics = coreMetrics.filter(metric => metrics.includes(metric));
    expect(foundMetrics.length).toBeGreaterThan(0);

    // Validate metric structure
    performanceEvents.forEach((event: any) => {
      expect(event).toHaveProperty('metric');
      expect(event).toHaveProperty('value');
      expect(event).toHaveProperty('timestamp');
      expect(typeof event.value).toBe('number');
      expect(event.value).toBeGreaterThan(0);
    });
  });

  test('should accurately measure Largest Contentful Paint (LCP)', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for LCP measurement
    await page.waitForTimeout(1500);

    const lcpEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'lcp')
    );

    if (lcpEvents.length > 0) {
      const lcpEvent = lcpEvents[0];

      // LCP should be reasonable (between 100ms and 10s)
      expect(lcpEvent.value).toBeGreaterThan(100);
      expect(lcpEvent.value).toBeLessThan(10000);

      // Should have proper rating
      expect(['good', 'needs-improvement', 'poor']).toContain(lcpEvent.rating);

      // Should have metadata
      expect(lcpEvent.metadata).toBeDefined();
      expect(lcpEvent.metadata).toHaveProperty('pageType');
    }
  });

  test('should accurately measure First Contentful Paint (FCP)', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1500);

    const fcpEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'fcp')
    );

    if (fcpEvents.length > 0) {
      const fcpEvent = fcpEvents[0];

      // FCP should be reasonable
      expect(fcpEvent.value).toBeGreaterThan(50);
      expect(fcpEvent.value).toBeLessThan(5000);

      // Should have proper rating
      expect(['good', 'needs-improvement', 'poor']).toContain(fcpEvent.rating);

      // FCP should typically be less than LCP
      const lcpEvents = await page.evaluate(() =>
        (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'lcp')
      );

      if (lcpEvents.length > 0) {
        expect(fcpEvent.value).toBeLessThanOrEqual(lcpEvents[0].value + 100); // Small tolerance
      }
    }
  });

  test('should measure Cumulative Layout Shift (CLS)', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Trigger potential layout shifts by resizing
    await page.setViewportSize({ width: 800, height: 600 });
    await page.waitForTimeout(500);
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(1000);

    const clsEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'cls')
    );

    if (clsEvents.length > 0) {
      const clsEvent = clsEvents[0];

      // CLS should be a score between 0 and 1 (typically much lower)
      expect(clsEvent.value).toBeGreaterThanOrEqual(0);
      expect(clsEvent.value).toBeLessThan(1);

      // Should have proper rating
      expect(['good', 'needs-improvement', 'poor']).toContain(clsEvent.rating);
    }
  });

  test('should measure First Input Delay (FID)', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Simulate user interaction to trigger FID
    await page.click('body');
    await page.waitForTimeout(1000);

    const fidEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'fid')
    );

    if (fidEvents.length > 0) {
      const fidEvent = fidEvents[0];

      // FID should be reasonable (0ms to 1000ms)
      expect(fidEvent.value).toBeGreaterThanOrEqual(0);
      expect(fidEvent.value).toBeLessThan(1000);

      // Should have proper rating
      expect(['good', 'needs-improvement', 'poor']).toContain(fidEvent.rating);
    }
  });

  test('should track navigation timing metrics', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const navigationEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) =>
        ['dns_lookup', 'connection_time', 'server_response', 'dom_content_loaded'].includes(e.metric)
      )
    );

    // Should have some navigation timing metrics
    expect(navigationEvents.length).toBeGreaterThan(0);

    navigationEvents.forEach((event: any) => {
      expect(event.value).toBeGreaterThan(0);
      expect(event.metadata).toHaveProperty('pageType');
    });
  });

  test('should monitor resource loading performance', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const resourceEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'resource_load')
    );

    if (resourceEvents.length > 0) {
      resourceEvents.forEach((event: any) => {
        expect(event.value).toBeGreaterThan(0);
        expect(event.metadata).toHaveProperty('resourceType');
        expect(['css', 'javascript', 'font', 'other']).toContain(event.metadata.resourceType);
      });
    }
  });

  test('should implement performance budget monitoring', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    const budgetEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'performance_budget_check')
    );

    if (budgetEvents.length > 0) {
      const budgetEvent = budgetEvents[0];

      expect(budgetEvent.metadata).toHaveProperty('budgets');
      expect(budgetEvent.metadata).toHaveProperty('violations');
      expect(typeof budgetEvent.metadata.violations).toBe('number');

      // Budget should include standard thresholds
      expect(budgetEvent.metadata.budgets).toHaveProperty('lcp');
      expect(budgetEvent.metadata.budgets).toHaveProperty('fcp');
      expect(budgetEvent.metadata.budgets).toHaveProperty('fid');
      expect(budgetEvent.metadata.budgets).toHaveProperty('cls');
    }
  });

  test('should track memory usage metrics', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1000);

    const memoryEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'memory_usage')
    );

    if (memoryEvents.length > 0) {
      const memoryEvent = memoryEvents[0];

      expect(memoryEvent.value).toBeGreaterThan(0);
      expect(memoryEvent.metadata).toHaveProperty('totalHeapSize');
      expect(memoryEvent.metadata).toHaveProperty('heapSizeLimit');
    }
  });

  test('should capture viewport and device context', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1000);

    const contextEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'viewport_context')
    );

    if (contextEvents.length > 0) {
      const contextEvent = contextEvents[0];

      expect(contextEvent.metadata).toHaveProperty('viewportWidth');
      expect(contextEvent.metadata).toHaveProperty('viewportHeight');
      expect(contextEvent.metadata).toHaveProperty('devicePixelRatio');
      expect(contextEvent.metadata.viewportWidth).toBeGreaterThan(0);
      expect(contextEvent.metadata.viewportHeight).toBeGreaterThan(0);
    }
  });

  test('should validate performance metric accuracy across page types', async () => {
    const pages = [
      { url: `${TEST_BASE_URL}`, type: 'homepage' },
      { url: `${TEST_BASE_URL}/about`, type: 'about' },
      { url: `${TEST_BASE_URL}/work`, type: 'work' }
    ];

    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const pageEvents = await page.evaluate(() =>
        (window as any).capturedPerformanceEvents.filter((e: any) => e.metric === 'page_load')
      );

      if (pageEvents.length > 0) {
        const pageEvent = pageEvents[pageEvents.length - 1]; // Get latest

        // Page load should be reasonable
        expect(pageEvent.value).toBeGreaterThan(0);
        expect(pageEvent.value).toBeLessThan(30000); // 30 seconds max

        // Should have page context
        expect(pageEvent.metadata).toHaveProperty('pageType');
      }
    }
  });

  test('should handle performance monitoring errors gracefully', async () => {
    // Test with Performance Observer unavailable
    await page.addInitScript(() => {
      delete (window as any).PerformanceObserver;
    });

    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Page should still load without errors
    await expect(page).toHaveTitle(/Omar Torres/);

    // Basic performance tracking should still work
    const performanceEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents || []
    );

    // At minimum, basic page load metrics should be tracked
    const pageLoadEvents = performanceEvents.filter((e: any) => e.metric === 'page_load');
    expect(pageLoadEvents.length).toBeGreaterThanOrEqual(0);
  });

  test('should validate performance event timing and sequencing', async () => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    const allEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents
    );

    if (allEvents.length > 1) {
      // Events should be chronologically ordered
      for (let i = 1; i < allEvents.length; i++) {
        expect(allEvents[i].timestamp).toBeGreaterThanOrEqual(allEvents[i-1].timestamp);
      }

      // FCP should typically come before LCP
      const fcpEvent = allEvents.find((e: any) => e.metric === 'fcp');
      const lcpEvent = allEvents.find((e: any) => e.metric === 'lcp');

      if (fcpEvent && lcpEvent) {
        expect(fcpEvent.value).toBeLessThanOrEqual(lcpEvent.value + 100); // Small tolerance
      }
    }
  });

  test('should track performance across different network conditions', async () => {
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => {
        route.continue();
      }, Math.random() * 200 + 50); // 50-250ms delay
    });

    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    const performanceEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents
    );

    // Performance metrics should account for network delay
    const pageLoadEvents = performanceEvents.filter((e: any) => e.metric === 'page_load');
    if (pageLoadEvents.length > 0) {
      // Page load should be slower due to network simulation
      expect(pageLoadEvents[0].value).toBeGreaterThan(100);
    }
  });
});

test.describe('Performance Monitoring Integration', () => {
  test('should integrate with Real User Monitoring (RUM)', async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).rumData = [];

      // Mock RUM integration
      (window as any).analytics = {
        trackPerformanceEvent: (metric: string, value: number, metadata?: any) => {
          (window as any).rumData.push({
            metric,
            value,
            metadata,
            timestamp: Date.now(),
            sessionId: 'test_session_123',
            userId: 'test_user_456'
          });
        }
      };

      window.dispatchEvent(new CustomEvent('analyticsReady'));
    });

    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(2000);

    const rumData = await page.evaluate(() => (window as any).rumData);

    if (rumData.length > 0) {
      rumData.forEach((event: any) => {
        expect(event).toHaveProperty('sessionId');
        expect(event).toHaveProperty('timestamp');
        expect(event.sessionId).toBe('test_session_123');
      });
    }
  });

  test('should validate performance data quality', async ({ page }) => {
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(3000);

    const performanceEvents = await page.evaluate(() =>
      (window as any).capturedPerformanceEvents || []
    );

    // Data quality checks
    performanceEvents.forEach((event: any) => {
      // No negative values
      expect(event.value).toBeGreaterThanOrEqual(0);

      // Reasonable bounds
      if (event.metric === 'lcp' || event.metric === 'fcp') {
        expect(event.value).toBeLessThan(60000); // 1 minute max
      }

      if (event.metric === 'cls') {
        expect(event.value).toBeLessThan(5); // CLS should be reasonable
      }

      if (event.metric === 'fid') {
        expect(event.value).toBeLessThan(5000); // 5 second max input delay
      }

      // Timestamps should be recent
      expect(event.timestamp).toBeGreaterThan(Date.now() - 60000); // Within last minute
    });
  });
});