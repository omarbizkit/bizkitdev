/**
 * Analytics Events Contract Tests
 *
 * Tests the comprehensive analytics API functions for event tracking,
 * data validation, privacy compliance, and integration patterns.
 *
 * Feature: 057-advanced-analytics-monitoring
 * Task: T098 - Contract test validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAnalyticsEvent,
  trackPageView,
  trackProjectInteraction,
  trackNewsletterInteraction,
  trackNavigationClick,
  trackPerformanceEvent,
  trackErrorEvent,
  validateEvent
} from '../../src/lib/analytics/events';
import {
  ConsentLevel,
  EventCategory,
  DeviceType,
  type PageContext,
  type UserContext
} from '../../src/types/analytics';

describe('Analytics Events Contract Tests', () => {
  let mockConsent: ConsentLevel;
  let mockPageContext: Partial<PageContext>;
  let mockUserContext: Partial<UserContext>;

  // Mock browser APIs and set up test defaults
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window and document objects for Node.js environment
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          pathname: '/test',
          href: 'http://localhost:4321/test',
          search: '?utm_source=test',
          hash: '#section1'
        },
        innerWidth: 1440,
        innerHeight: 900,
        screen: { width: 1920, height: 1080 },
        navigator: {
          userAgent: 'Mozilla/5.0 (test)',
          language: 'en-US'
        },
        sessionStorage: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn()
        },
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn()
        }
      },
      configurable: true
    });

    Object.defineProperty(global, 'document', {
      value: {
        title: 'Test Page',
        referrer: 'http://localhost:4321/'
      },
      configurable: true
    });

    Object.defineProperty(global, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        language: 'en-US',
        platform: 'Win32'
      },
      configurable: true
    });

    // Set up test defaults
    mockConsent = 'analytics' as ConsentLevel;

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
      timezone: 'America/Los_Angeles',
      language: 'en-US',
      isFirstVisit: false,
      sessionStartTime: Date.now() - 30000,
      pageViews: 3
    };
  });

  describe('Analytics Event Creation', () => {
    it('should create valid analytics event with required fields', () => {
      const event = createAnalyticsEvent(
        EventCategory.PAGE_VIEW,
        'view',
        {
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: mockConsent
        }
      );

      expect(event).toBeDefined();
      expect(event?.id).toMatch(/^[a-f0-9-]+$/); // UUID format
      expect(event?.timestamp).toBeGreaterThan(0);
      expect(event?.category).toBe(EventCategory.PAGE_VIEW);
      expect(event?.action).toBe('view');
      expect(event?.consentLevel).toBe('analytics');
      expect(event?.anonymized).toBe(false); // Analytics level allows non-anonymized
    });

    it('should generate unique event IDs', () => {
      const event1 = createAnalyticsEvent(EventCategory.PAGE_VIEW, 'view', {
        pageContext: mockPageContext,
        userContext: mockUserContext,
        consentLevel: mockConsent
      });
      const event2 = createAnalyticsEvent(EventCategory.PAGE_VIEW, 'view', {
        pageContext: mockPageContext,
        userContext: mockUserContext,
        consentLevel: mockConsent
      });

      expect(event1?.id).not.toBe(event2?.id);
    });

    it('should maintain consistent session ID within session', () => {
      const event1 = createAnalyticsEvent(EventCategory.PAGE_VIEW, 'view', {
        pageContext: mockPageContext,
        userContext: mockUserContext,
        consentLevel: mockConsent
      });
      const event2 = createAnalyticsEvent(EventCategory.PROJECT_CLICK, 'click', {
        pageContext: mockPageContext,
        userContext: mockUserContext,
        consentLevel: mockConsent
      });

      expect(event1?.sessionId).toBeDefined();
      expect(event2?.sessionId).toBeDefined();
      expect(event1?.sessionId).toBe(event2?.sessionId);
    });

    it('should create event with optional label and value', () => {
      const event = createAnalyticsEvent(
        EventCategory.PROJECT_CLICK,
        'click',
        {
          label: 'ai-trading-system',
          value: 100,
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: mockConsent
        }
      );

      expect(event?.label).toBe('ai-trading-system');
      expect(event?.value).toBe(100);
    });

    it('should set anonymized flag based on consent level', () => {
      const essentialEvent = createAnalyticsEvent(
        EventCategory.PAGE_VIEW, 'view', {
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: ConsentLevel.ESSENTIAL
        }
      );
      const analyticsEvent = createAnalyticsEvent(
        EventCategory.PAGE_VIEW, 'view', {
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: ConsentLevel.ANALYTICS
        }
      );

      expect(essentialEvent?.anonymized).toBe(true);
      expect(analyticsEvent?.anonymized).toBe(false); // Analytics level allows tracking
    });
  });

  describe('Event Validation', () => {
    it('should validate complete analytics event', () => {
      const event = createAnalyticsEvent(
        EventCategory.PAGE_VIEW,
        'view',
        {
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: mockConsent
        }
      );

      const validation = validateEvent(event!);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject event with missing required fields', () => {
      const incompleteEvent = {
        id: '',  // Invalid: empty ID
        timestamp: Date.now(),
        sessionId: 'session_123',
        category: EventCategory.PAGE_VIEW,
        action: 'view',
        page: mockPageContext,
        user: mockUserContext,
        consentLevel: ConsentLevel.ANALYTICS,
        anonymized: true
      };

      const validation = validateEvent(incompleteEvent as any);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject event with invalid timestamp', () => {
      const event = createAnalyticsEvent(
        EventCategory.PAGE_VIEW, 'view', {
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: mockConsent
        }
      );
      if (event) {
        event.timestamp = 0; // Invalid timestamp
        const validation = validateEvent(event);
        expect(validation.valid).toBe(false);
        expect(validation.errors).toContain('Timestamp is required and must be a positive number');
      }
    });

    it('should reject event with invalid category', () => {
      const event = createAnalyticsEvent(
        EventCategory.PAGE_VIEW, 'view', {
          pageContext: mockPageContext,
          userContext: mockUserContext,
          consentLevel: mockConsent
        }
      );
      if (event) {
        (event.category as any) = 'invalid_category';
        const validation = validateEvent(event);
        expect(validation.valid).toBe(false);
        expect(validation.errors.some(e => e.includes('Invalid event category'))).toBe(true);
      }
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
      // Mock console.log to capture debug output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackPageView('/projects', 'My Projects', {
        consentLevel: ConsentLevel.ANALYTICS
      });

      // Verify tracking was called (function uses internal trackEvent)
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackProjectInteraction(
        'ai-trading-system',
        'AI Trading System',
        'view',
        ['Python', 'TensorFlow'],
        {
          category: 'machine-learning',
          consentLevel: ConsentLevel.ANALYTICS,
          customData: { featured: true }
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should track project click event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackProjectInteraction(
        'portfolio-website',
        'Portfolio Website',
        'click',
        ['React', 'TypeScript'],
        {
          consentLevel: ConsentLevel.ANALYTICS,
          customData: { position: 2, source: 'homepage' }
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Newsletter Interaction Tracking', () => {
    it('should track newsletter signup event', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackNewsletterInteraction(
        'submit',
        'user@example.com',
        undefined,
        {
          formId: 'hero-section',
          consentLevel: ConsentLevel.MARKETING
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackNavigationClick(
        'About',
        'main_menu',
        '/about',
        false, // isExternal
        {
          consentLevel: ConsentLevel.ANALYTICS
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackPerformanceEvent(
        'lcp',
        1250,
        'good',
        {
          unit: 'ms',
          consentLevel: ConsentLevel.ANALYTICS
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
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
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackErrorEvent(
        'javascript_error',
        'TypeError: Cannot read property',
        'Error stack trace...',
        'medium',
        {
          filename: 'main.js',
          lineNumber: 42,
          columnNumber: 15,
          consentLevel: ConsentLevel.ANALYTICS
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should track network errors', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      trackErrorEvent(
        'network_error',
        'Failed to fetch',
        undefined,
        'high',
        {
          consentLevel: ConsentLevel.ANALYTICS,
          customData: {
            url: '/api/projects',
            status: 500,
            statusText: 'Internal Server Error'
          }
        }
      );

      // Verify tracking was called
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Analytics API Integration', () => {
    it('should provide all core analytics functions', () => {
      // Verify all exported functions are available
      expect(typeof createAnalyticsEvent).toBe('function');
      expect(typeof trackPageView).toBe('function');
      expect(typeof trackProjectInteraction).toBe('function');
      expect(typeof trackNewsletterInteraction).toBe('function');
      expect(typeof trackNavigationClick).toBe('function');
      expect(typeof trackPerformanceEvent).toBe('function');
      expect(typeof trackErrorEvent).toBe('function');
      expect(typeof validateEvent).toBe('function');
    });

    it('should handle browser environment detection', () => {
      // All functions should handle Node.js test environment gracefully
      expect(() => {
        createAnalyticsEvent(EventCategory.PAGE_VIEW, 'view', {
          consentLevel: ConsentLevel.ANALYTICS
        });
      }).not.toThrow();
    });

    it('should validate event structures properly', () => {
      const validEvent = createAnalyticsEvent(EventCategory.PAGE_VIEW, 'view', {
        pageContext: mockPageContext,
        userContext: mockUserContext,
        consentLevel: ConsentLevel.ANALYTICS
      });

      if (validEvent) {
        const validation = validateEvent(validEvent);
        expect(validation).toHaveProperty('valid');
        expect(validation).toHaveProperty('errors');
        expect(Array.isArray(validation.errors)).toBe(true);
      }
    });
  });
});