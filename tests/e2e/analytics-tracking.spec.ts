/**
 * E2E Tests: Analytics Event Tracking Workflow
 *
 * Tests comprehensive analytics event tracking across components including:
 * - Project card interactions and tracking
 * - Newsletter form analytics workflow
 * - Navigation click tracking
 * - Performance event monitoring
 * - Cross-component analytics integration
 *
 * Feature: 057-advanced-analytics-monitoring
 * Task: T094
 */

import { test, expect, type Page } from '@playwright/test';

// Test configuration
const TEST_BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:4321';

// Mock analytics events collector
interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

test.describe('Analytics Event Tracking', () => {
  let page: Page;
  let analyticsEvents: AnalyticsEvent[] = [];

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    analyticsEvents = [];

    // Mock analytics functions to capture events
    await page.addInitScript(() => {
      (window as any).capturedAnalyticsEvents = [];

      // Mock analytics functions
      (window as any).analytics = {
        trackProjectInteraction: (projectId: string, action: string, metadata?: any) => {
          (window as any).capturedAnalyticsEvents.push({
            category: 'project_interaction',
            action: action,
            label: projectId,
            metadata: metadata,
            timestamp: Date.now()
          });
        },
        trackNewsletterInteraction: (action: string, metadata?: any) => {
          (window as any).capturedAnalyticsEvents.push({
            category: 'newsletter_interaction',
            action: action,
            metadata: metadata,
            timestamp: Date.now()
          });
        },
        trackNavigationClick: (href: string, external: boolean, metadata?: any) => {
          (window as any).capturedAnalyticsEvents.push({
            category: 'navigation_click',
            action: external ? 'external_link' : 'internal_link',
            label: href,
            metadata: metadata,
            timestamp: Date.now()
          });
        },
        trackPerformanceEvent: (metric: string, value: number, metadata?: any) => {
          (window as any).capturedAnalyticsEvents.push({
            category: 'performance_metric',
            action: metric,
            value: value,
            metadata: metadata,
            timestamp: Date.now()
          });
        },
        trackPageView: (pageData: any) => {
          (window as any).capturedAnalyticsEvents.push({
            category: 'page_view',
            action: 'view',
            label: pageData.path,
            metadata: pageData,
            timestamp: Date.now()
          });
        }
      };

      // Signal analytics is ready
      window.dispatchEvent(new CustomEvent('analyticsReady'));
    });

    // Navigate to homepage
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should track project card interactions', async () => {
    // Test project card view tracking
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible();

    // Scroll project card into view to trigger view event
    await projectCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600); // Wait for intersection observer

    // Check view event was tracked
    const viewEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'project_interaction' && e.action === 'view'
      )
    );
    expect(viewEvents.length).toBeGreaterThan(0);
    expect(viewEvents[0]).toMatchObject({
      category: 'project_interaction',
      action: 'view'
    });

    // Test project card hover
    await projectCard.hover();
    await page.waitForTimeout(2100); // Wait for hover timer

    const hoverEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'project_interaction' && e.action === 'hover'
      )
    );
    expect(hoverEvents.length).toBeGreaterThan(0);

    // Test view details click
    const viewDetailsBtn = projectCard.locator('a[href^="/projects/"]');
    if (await viewDetailsBtn.count() > 0) {
      await viewDetailsBtn.click();

      const clickEvents = await page.evaluate(() =>
        (window as any).capturedAnalyticsEvents.filter((e: any) =>
          e.category === 'project_interaction' && e.action === 'view_details_click'
        )
      );
      expect(clickEvents.length).toBeGreaterThan(0);
      expect(clickEvents[0].metadata).toHaveProperty('projectName');
      expect(clickEvents[0].metadata).toHaveProperty('destination');
    }
  });

  test('should track newsletter interactions', async () => {
    // Navigate to homepage with newsletter form
    await page.goto(TEST_BASE_URL);

    // Find newsletter form
    const newsletterForm = page.locator('[data-testid="hero-subscribe-form"]');
    await expect(newsletterForm).toBeVisible();

    // Scroll form into view
    await newsletterForm.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Check form view event
    const formViewEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'newsletter_interaction' && e.action === 'form_view'
      )
    );
    expect(formViewEvents.length).toBeGreaterThan(0);

    // Test email input focus
    const emailInput = newsletterForm.locator('#hero-email');
    await emailInput.focus();

    const focusEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'newsletter_interaction' && e.action === 'email_input_focus'
      )
    );
    expect(focusEvents.length).toBeGreaterThan(0);

    // Test email typing
    await emailInput.type('test@example.com');

    // Check typing start event
    const typingEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'newsletter_interaction' && e.action === 'email_typing_start'
      )
    );
    expect(typingEvents.length).toBeGreaterThan(0);

    // Check valid email event
    const validEmailEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'newsletter_interaction' && e.action === 'valid_email_entered'
      )
    );
    expect(validEmailEvents.length).toBeGreaterThan(0);

    // Test form submission
    const submitBtn = newsletterForm.locator('#hero-submit-btn');
    await submitBtn.click();

    const submitEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'newsletter_interaction' && e.action === 'form_submit_attempt'
      )
    );
    expect(submitEvents.length).toBeGreaterThan(0);
    expect(submitEvents[0].metadata).toHaveProperty('email');
    expect(submitEvents[0].metadata).toHaveProperty('emailDomain');
  });

  test('should track navigation interactions', async () => {
    // Test main navigation links
    const navLink = page.locator('.nav-items .link').first();
    if (await navLink.count() > 0) {
      const linkText = await navLink.textContent();
      const linkHref = await navLink.getAttribute('href');

      await navLink.click();

      const navEvents = await page.evaluate(() =>
        (window as any).capturedAnalyticsEvents.filter((e: any) =>
          e.category === 'navigation_click'
        )
      );
      expect(navEvents.length).toBeGreaterThan(0);

      const lastNavEvent = navEvents[navEvents.length - 1];
      expect(lastNavEvent.label).toBe(linkHref);
      expect(lastNavEvent.metadata).toHaveProperty('linkText');
      expect(lastNavEvent.metadata).toHaveProperty('source', 'navigation');
    }

    // Test mobile menu toggle (if present)
    await page.setViewportSize({ width: 600, height: 800 });
    const menuButton = page.locator('.menu-button');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      const menuEvents = await page.evaluate(() =>
        (window as any).capturedAnalyticsEvents.filter((e: any) =>
          e.category === 'navigation_click' && e.action === 'menu_open'
        )
      );
      expect(menuEvents.length).toBeGreaterThan(0);
      expect(menuEvents[0].metadata).toHaveProperty('viewport', 'mobile');
    }
  });

  test('should track performance events', async () => {
    // Navigate to trigger performance tracking
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Wait for performance events to be captured
    await page.waitForTimeout(2000);

    const performanceEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'performance_metric'
      )
    );

    expect(performanceEvents.length).toBeGreaterThan(0);

    // Check for common performance metrics
    const metricTypes = performanceEvents.map((e: any) => e.action);
    expect(metricTypes).toContain('page_load');

    // Verify performance events have proper structure
    const pageLoadEvent = performanceEvents.find((e: any) => e.action === 'page_load');
    if (pageLoadEvent) {
      expect(pageLoadEvent.value).toBeGreaterThan(0);
      expect(pageLoadEvent.metadata).toHaveProperty('pageType');
      expect(pageLoadEvent.metadata).toHaveProperty('timestamp');
    }
  });

  test('should track cross-component analytics integration', async () => {
    // Test complete user journey with multiple interactions
    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // 1. View project card
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // 2. Interact with newsletter
    const newsletterForm = page.locator('[data-testid="hero-subscribe-form"]');
    await newsletterForm.scrollIntoViewIfNeeded();
    const emailInput = newsletterForm.locator('#hero-email');
    await emailInput.focus();
    await emailInput.type('journey@test.com');

    // 3. Navigate to another page
    const aboutLink = page.locator('a[href*="/about"]').first();
    if (await aboutLink.count() > 0) {
      await aboutLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify all event types were captured
    const allEvents = await page.evaluate(() => (window as any).capturedAnalyticsEvents);

    const eventCategories = [...new Set(allEvents.map((e: any) => e.category))];
    expect(eventCategories).toContain('project_interaction');
    expect(eventCategories).toContain('newsletter_interaction');
    expect(eventCategories).toContain('performance_metric');

    // Verify events have proper timestamps and ordering
    expect(allEvents.length).toBeGreaterThan(3);

    // Events should be chronologically ordered
    for (let i = 1; i < allEvents.length; i++) {
      expect(allEvents[i].timestamp).toBeGreaterThanOrEqual(allEvents[i-1].timestamp);
    }

    // Verify metadata consistency
    allEvents.forEach((event: any) => {
      expect(event).toHaveProperty('category');
      expect(event).toHaveProperty('action');
      expect(event).toHaveProperty('timestamp');
      expect(typeof event.timestamp).toBe('number');
    });
  });

  test('should handle analytics errors gracefully', async () => {
    // Test with analytics functions unavailable
    await page.addInitScript(() => {
      // Remove analytics mock to simulate failure
      delete (window as any).analytics;
    });

    await page.goto(TEST_BASE_URL);
    await page.waitForLoadState('networkidle');

    // Interact with components
    const projectCard = page.locator('[data-testid="project-card"]').first();
    if (await projectCard.count() > 0) {
      await projectCard.scrollIntoViewIfNeeded();
      await projectCard.hover();
    }

    // Page should still function normally without errors
    await expect(page).toHaveTitle(/Omar Torres/);

    // Check console for errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Should not have critical JavaScript errors
    expect(errors.filter(e => e.includes('Uncaught') || e.includes('TypeError'))).toHaveLength(0);
  });

  test('should respect analytics timing and debouncing', async () => {
    await page.goto(TEST_BASE_URL);

    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.scrollIntoViewIfNeeded();

    // Multiple rapid hovers should not create excessive events
    for (let i = 0; i < 5; i++) {
      await projectCard.hover();
      await page.waitForTimeout(100);
    }

    await page.waitForTimeout(2500); // Wait for hover timer

    const hoverEvents = await page.evaluate(() =>
      (window as any).capturedAnalyticsEvents.filter((e: any) =>
        e.category === 'project_interaction' && e.action === 'hover'
      )
    );

    // Should not have excessive hover events due to debouncing
    expect(hoverEvents.length).toBeLessThanOrEqual(2);
  });
});

// Helper test for analytics event validation
test.describe('Analytics Event Validation', () => {
  test('should validate event structure and data quality', async ({ page }) => {
    // Set up analytics event capture
    await page.addInitScript(() => {
      (window as any).capturedAnalyticsEvents = [];

      (window as any).analytics = {
        trackProjectInteraction: (projectId: string, action: string, metadata?: any) => {
          (window as any).capturedAnalyticsEvents.push({
            category: 'project_interaction',
            action: action,
            label: projectId,
            metadata: metadata,
            timestamp: Date.now(),
            valid: true
          });
        }
      };

      window.dispatchEvent(new CustomEvent('analyticsReady'));
    });

    await page.goto(TEST_BASE_URL);

    // Trigger an event
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await projectCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Validate event structure
    const events = await page.evaluate(() => (window as any).capturedAnalyticsEvents);

    if (events.length > 0) {
      const event = events[0];

      // Required fields
      expect(event).toHaveProperty('category');
      expect(event).toHaveProperty('action');
      expect(event).toHaveProperty('timestamp');

      // Data quality checks
      expect(typeof event.category).toBe('string');
      expect(typeof event.action).toBe('string');
      expect(typeof event.timestamp).toBe('number');
      expect(event.timestamp).toBeGreaterThan(Date.now() - 10000); // Recent timestamp

      // Metadata validation
      if (event.metadata) {
        expect(typeof event.metadata).toBe('object');
      }
    }
  });
});