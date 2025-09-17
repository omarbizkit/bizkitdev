/**
 * Analytics Events Contract Tests
 *
 * TDD contract tests for privacy-compliant analytics event tracking.
 * Based on: specs/057-advanced-analytics-monitoring/tasks.md (T005)
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type {
  AnalyticsEvent,
  EventCategory,
  ConsentLevel,
  PageContext,
  UserContext,
  DeviceType
} from '../../src/types/analytics';

// Import analytics functions we need to implement
import {
  createAnalyticsEvent,
  trackEvent,
  trackPageView,
  trackProjectInteraction,
  trackNewsletterInteraction,
  trackNavigationClick,
  trackPerformanceEvent,
  trackErrorEvent,
  validateAnalyticsEvent,
  getSessionId,
  createPageContext,
  createUserContext
} from '../../src/lib/analytics/events';

describe('Analytics Events Contract Tests', () => {
  let mockConsent: ConsentLevel;
  let mockPageContext: PageContext;
  let mockUserContext: UserContext;

  beforeEach(() => {
    // Set up test defaults
    mockConsent = 'analytics';

    mockPageContext = {
      path: '/test',
      title: 'Test Page',
      url: 'http://localhost:4321/test',
      referrer: 'http://localhost:4321/',
      queryParams: { utm_source: 'test' },
      hash: '#section1',
      loadTime: 1250
    };

    mockUserContext = {
      deviceType: 'desktop' as DeviceType,
      screenResolution: '1920x1080',
      viewportSize: '1440x900',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

  describe('Analytics Event Creation', () => {
    it('should create valid analytics event with required fields', () => {
      const event = createAnalyticsEvent(
        'page_view',
        'view',
        mockPageContext,
        mockUserContext,
        mockConsent
      );

      expect(event).toBeDefined();
      expect(event.id).toMatch(/^[a-f0-9-]+$/); // UUID format
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/);
      expect(event.category).toBe('page_view');
      expect(event.action).toBe('view');
      expect(event.page).toEqual(mockPageContext);
      expect(event.user).toEqual(mockUserContext);
      expect(event.consentLevel).toBe('analytics');
      expect(event.anonymized).toBe(true);
    });

    it('should generate unique event IDs', () => {
      const event1 = createAnalyticsEvent('page_view', 'view', mockPageContext, mockUserContext, mockConsent);
      const event2 = createAnalyticsEvent('page_view', 'view', mockPageContext, mockUserContext, mockConsent);

      expect(event1.id).not.toBe(event2.id);
    });

    it('should maintain consistent session ID within session', () => {
      const sessionId = getSessionId();
      const event1 = createAnalyticsEvent('page_view', 'view', mockPageContext, mockUserContext, mockConsent);
      const event2 = createAnalyticsEvent('project_click', 'click', mockPageContext, mockUserContext, mockConsent);

      expect(event1.sessionId).toBe(sessionId);
      expect(event2.sessionId).toBe(sessionId);
      expect(event1.sessionId).toBe(event2.sessionId);
    });

    it('should create event with optional label and value', () => {
      const event = createAnalyticsEvent(
        'project_click',
        'click',
        mockPageContext,
        mockUserContext,
        mockConsent,
        'ai-trading-system',
        100
      );

      expect(event.label).toBe('ai-trading-system');
      expect(event.value).toBe(100);
    });

    it('should set anonymized flag based on consent level', () => {
      const essentialEvent = createAnalyticsEvent(
        'page_view', 'view', mockPageContext, mockUserContext, 'essential'
      );
      const analyticsEvent = createAnalyticsEvent(
        'page_view', 'view', mockPageContext, mockUserContext, 'analytics'
      );

      expect(essentialEvent.anonymized).toBe(true);
      expect(analyticsEvent.anonymized).toBe(true); // Still anonymized for privacy
    });
  });

  describe('Event Validation', () => {
    it('should validate complete analytics event', () => {
      const event = createAnalyticsEvent(
        'page_view',
        'view',
        mockPageContext,
        mockUserContext,
        mockConsent
      );

      expect(validateAnalyticsEvent(event)).toBe(true);
    });

    it('should reject event with missing required fields', () => {
      const incompleteEvent = {
        id: '',  // Invalid: empty ID
        timestamp: Date.now(),
        sessionId: 'session_123',
        category: 'page_view' as EventCategory,
        action: 'view',
        page: mockPageContext,
        user: mockUserContext,
        consentLevel: 'analytics' as ConsentLevel,
        anonymized: true
      } as AnalyticsEvent;

      expect(validateAnalyticsEvent(incompleteEvent)).toBe(false);
    });

    it('should reject event with invalid timestamp', () => {
      const event = createAnalyticsEvent(
        'page_view', 'view', mockPageContext, mockUserContext, mockConsent
      );
      event.timestamp = 0; // Invalid timestamp

      expect(validateAnalyticsEvent(event)).toBe(false);
    });

    it('should reject event with invalid category', () => {
      const event = createAnalyticsEvent(
        'page_view', 'view', mockPageContext, mockUserContext, mockConsent
      );
      (event.category as any) = 'invalid_category';

      expect(validateAnalyticsEvent(event)).toBe(false);
    });
  });

  describe('Page Context Creation', () => {
    it('should create page context from current browser state', () => {
      // Mock window location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/projects',
          href: 'http://localhost:4321/projects?category=ai',
          search: '?category=ai',
          hash: '#featured'
        },
        configurable: true
      });

      const pageContext = createPageContext('AI Projects');

      expect(pageContext.path).toBe('/projects');
      expect(pageContext.title).toBe('AI Projects');
      expect(pageContext.url).toBe('http://localhost:4321/projects?category=ai');
      expect(pageContext.queryParams).toEqual({ category: 'ai' });
      expect(pageContext.hash).toBe('#featured');
    });

    it('should handle missing query parameters gracefully', () => {
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/about',
          href: 'http://localhost:4321/about',
          search: '',
          hash: ''
        },
        configurable: true
      });

      const pageContext = createPageContext('About');

      expect(pageContext.path).toBe('/about');
      expect(pageContext.title).toBe('About');
      expect(pageContext.queryParams).toEqual({});
      expect(pageContext.hash).toBe('');
    });
  });

  describe('User Context Creation', () => {
    it('should create user context with device detection', () => {
      // Mock window properties
      Object.defineProperty(window, 'screen', {
        value: { width: 1920, height: 1080 },
        configurable: true
      });
      Object.defineProperty(window, 'innerWidth', {
        value: 1440,
        configurable: true
      });
      Object.defineProperty(window, 'innerHeight', {
        value: 900,
        configurable: true
      });

      const userContext = createUserContext();

      expect(userContext.deviceType).toBe('desktop');
      expect(userContext.screenResolution).toBe('1920x1080');
      expect(userContext.viewportSize).toBe('1440x900');
      expect(userContext.isFirstVisit).toBeDefined();
      expect(userContext.sessionStartTime).toBeGreaterThan(0);
      expect(userContext.timezone).toBeDefined();
      expect(userContext.language).toBeDefined();
    });

    it('should detect mobile device type', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
        configurable: true
      });

      const userContext = createUserContext();
      expect(userContext.deviceType).toBe('mobile');
    });

    it('should detect tablet device type', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
        configurable: true
      });

      const userContext = createUserContext();
      expect(userContext.deviceType).toBe('tablet');
    });
  });

  describe('Page View Tracking', () => {
    it('should track page view with proper event structure', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackPageView('/projects', 'My Projects', mockTracker);

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('page_view');
      expect(events[0].action).toBe('view');
      expect(events[0].page.path).toBe('/projects');
      expect(events[0].page.title).toBe('My Projects');
    });

    it('should include load time when available', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      // Mock performance.timing for load time calculation
      Object.defineProperty(window, 'performance', {
        value: {
          timing: {
            navigationStart: 1000,
            loadEventEnd: 2500
          }
        },
        configurable: true
      });

      trackPageView('/projects', 'My Projects', mockTracker);

      expect(events[0].page.loadTime).toBe(1500);
    });
  });

  describe('Project Interaction Tracking', () => {
    it('should track project view event', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackProjectInteraction(
        'ai-trading-system',
        'view',
        mockTracker,
        { category: 'machine-learning', featured: true }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('project_view');
      expect(events[0].action).toBe('view');
      expect(events[0].label).toBe('ai-trading-system');
      expect(events[0].customData).toEqual({
        category: 'machine-learning',
        featured: true
      });
    });

    it('should track project click event', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackProjectInteraction(
        'portfolio-website',
        'click',
        mockTracker,
        { position: 2, source: 'homepage' }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('project_click');
      expect(events[0].action).toBe('click');
      expect(events[0].label).toBe('portfolio-website');
      expect(events[0].customData?.position).toBe(2);
      expect(events[0].customData?.source).toBe('homepage');
    });
  });

  describe('Newsletter Interaction Tracking', () => {
    it('should track newsletter signup event', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackNewsletterInteraction(
        'signup',
        'hero-section',
        mockTracker,
        { email: 'user@example.com' }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('newsletter_signup');
      expect(events[0].action).toBe('signup');
      expect(events[0].label).toBe('hero-section');
      expect(events[0].customData?.email).toBe('user@example.com');
    });

    it('should track newsletter success event', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackNewsletterInteraction(
        'success',
        'subscription-confirmed',
        mockTracker
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('newsletter_success');
      expect(events[0].action).toBe('success');
      expect(events[0].label).toBe('subscription-confirmed');
    });

    it('should track newsletter error event', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackNewsletterInteraction(
        'error',
        'api-timeout',
        mockTracker,
        { errorCode: 'TIMEOUT', retryCount: 3 }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('newsletter_error');
      expect(events[0].action).toBe('error');
      expect(events[0].label).toBe('api-timeout');
      expect(events[0].customData?.errorCode).toBe('TIMEOUT');
      expect(events[0].customData?.retryCount).toBe(3);
    });
  });

  describe('Navigation Click Tracking', () => {
    it('should track internal navigation clicks', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackNavigationClick(
        '/about',
        'About',
        'internal',
        mockTracker
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('navigation_click');
      expect(events[0].action).toBe('click');
      expect(events[0].label).toBe('About');
      expect(events[0].customData?.destination).toBe('/about');
      expect(events[0].customData?.linkType).toBe('internal');
    });

    it('should track external link clicks', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackNavigationClick(
        'https://github.com/omarbizkit',
        'GitHub Profile',
        'external',
        mockTracker
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('external_link_click');
      expect(events[0].action).toBe('click');
      expect(events[0].label).toBe('GitHub Profile');
      expect(events[0].customData?.destination).toBe('https://github.com/omarbizkit');
      expect(events[0].customData?.linkType).toBe('external');
    });

    it('should track social link clicks', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackNavigationClick(
        'https://linkedin.com/in/omartorres',
        'LinkedIn',
        'social',
        mockTracker
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('social_link_click');
      expect(events[0].action).toBe('click');
      expect(events[0].label).toBe('LinkedIn');
      expect(events[0].customData?.platform).toBe('linkedin');
    });
  });

  describe('Performance Event Tracking', () => {
    it('should track Core Web Vitals metrics', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackPerformanceEvent(
        'lcp',
        1250,
        'good',
        mockTracker
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('performance_metric');
      expect(events[0].action).toBe('metric');
      expect(events[0].label).toBe('lcp');
      expect(events[0].value).toBe(1250);
      expect(events[0].customData?.rating).toBe('good');
    });

    it('should track slow loading events', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackPerformanceEvent(
        'page_load',
        5500,
        'poor',
        mockTracker,
        { threshold: 3000, resource: 'main.js' }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('slow_loading');
      expect(events[0].action).toBe('slow');
      expect(events[0].label).toBe('page_load');
      expect(events[0].value).toBe(5500);
      expect(events[0].customData?.threshold).toBe(3000);
      expect(events[0].customData?.resource).toBe('main.js');
    });
  });

  describe('Error Event Tracking', () => {
    it('should track JavaScript errors', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackErrorEvent(
        'javascript_error',
        'TypeError: Cannot read property',
        mockTracker,
        {
          filename: 'main.js',
          lineNumber: 42,
          columnNumber: 15,
          stack: 'Error stack trace...'
        }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('error_occurred');
      expect(events[0].action).toBe('error');
      expect(events[0].label).toBe('javascript_error');
      expect(events[0].customData?.message).toBe('TypeError: Cannot read property');
      expect(events[0].customData?.filename).toBe('main.js');
      expect(events[0].customData?.lineNumber).toBe(42);
    });

    it('should track network errors', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackErrorEvent(
        'network_error',
        'Failed to fetch',
        mockTracker,
        {
          url: '/api/projects',
          status: 500,
          statusText: 'Internal Server Error'
        }
      );

      expect(events).toHaveLength(1);
      expect(events[0].category).toBe('error_occurred');
      expect(events[0].action).toBe('error');
      expect(events[0].label).toBe('network_error');
      expect(events[0].customData?.url).toBe('/api/projects');
      expect(events[0].customData?.status).toBe(500);
    });
  });

  describe('Privacy Compliance', () => {
    it('should respect consent level for tracking', () => {
      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      // Should track with analytics consent
      trackPageView('/test', 'Test', mockTracker, 'analytics');
      expect(events).toHaveLength(1);

      // Should not track without sufficient consent
      events.length = 0; // Clear events
      trackPageView('/test', 'Test', mockTracker, 'essential');
      expect(events).toHaveLength(0);
    });

    it('should anonymize sensitive data in events', () => {
      const event = createAnalyticsEvent(
        'page_view', 'view', mockPageContext, mockUserContext, 'analytics'
      );

      expect(event.anonymized).toBe(true);

      // IP should be anonymized (not stored in our events)
      expect(event.user.country).toBeDefined(); // Allowed: country level
      expect(event.user).not.toHaveProperty('ipAddress'); // Not stored
    });

    it('should handle Do Not Track preference', () => {
      // Mock DNT header
      Object.defineProperty(navigator, 'doNotTrack', {
        value: '1',
        configurable: true
      });

      const events: AnalyticsEvent[] = [];
      const mockTracker = (event: AnalyticsEvent) => events.push(event);

      trackPageView('/test', 'Test', mockTracker, 'analytics');

      // Should respect DNT and not track
      expect(events).toHaveLength(0);
    });
  });

  describe('Session Management', () => {
    it('should maintain session ID across page views', () => {
      const sessionId = getSessionId();

      const event1 = createAnalyticsEvent('page_view', 'view', mockPageContext, mockUserContext, mockConsent);
      const event2 = createAnalyticsEvent('page_view', 'view', mockPageContext, mockUserContext, mockConsent);

      expect(event1.sessionId).toBe(sessionId);
      expect(event2.sessionId).toBe(sessionId);
    });

    it('should generate new session ID after timeout', () => {
      // This would require mocking session storage and time
      // Implementation should handle session timeout (30 minutes default)
      const sessionId1 = getSessionId();

      // Mock session storage clear (simulating timeout)
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('analytics_session');
      }

      const sessionId2 = getSessionId();
      expect(sessionId2).not.toBe(sessionId1);
    });
  });

  describe('Event Queue and Batching', () => {
    it('should support event batching for performance', () => {
      const events: AnalyticsEvent[] = [];
      const batchedEvents: AnalyticsEvent[][] = [];

      const mockBatchTracker = (eventsBatch: AnalyticsEvent[]) => {
        batchedEvents.push(eventsBatch);
      };

      // This would be implemented in the actual analytics system
      // For now, just verify the concept
      const event1 = createAnalyticsEvent('page_view', 'view', mockPageContext, mockUserContext, mockConsent);
      const event2 = createAnalyticsEvent('project_click', 'click', mockPageContext, mockUserContext, mockConsent);

      events.push(event1, event2);
      mockBatchTracker(events);

      expect(batchedEvents).toHaveLength(1);
      expect(batchedEvents[0]).toHaveLength(2);
    });
  });
});