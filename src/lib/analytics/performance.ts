/**
 * Web Performance Monitoring
 *
 * Core Web Vitals tracking with browser compatibility fallbacks.
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import {
  getCLS,
  getFCP,
  getFID,
  getLCP,
  getTTFB,
  getINP,
  type Metric
} from 'web-vitals';

import type {
  PerformanceMetrics,
  CoreWebVitals,
  VitalRating,
  NavigationTimingMetrics,
  ResourceTimingMetrics,
  WebVitalMetric,
  ConsentLevel
} from '../../types/analytics';

import { PERFORMANCE_THRESHOLDS, getCurrentEnvConfig, ENHANCED_GA4_PROVIDER } from './config';
import { debugUtils, browserUtils, dataUtils } from './utils';

// Enhanced tracking configuration
export interface PerformanceTrackingConfig {
  consentLevel: ConsentLevel;
  enableDetailedTracking: boolean;
  enableRUM: boolean;
  enableBudgetMonitoring: boolean;
  samplingRate: number;
  reportAllChanges: boolean;
}

// Tracking state
let performanceMonitoringActive = false;
let performanceCallback: ((metrics: PerformanceMetrics) => void) | null = null;
let trackingConfig: PerformanceTrackingConfig = {
  consentLevel: 'none',
  enableDetailedTracking: true,
  enableRUM: true,
  enableBudgetMonitoring: true,
  samplingRate: 0.8,
  reportAllChanges: false
};

// Metrics cache to avoid duplicate tracking
let metricsCache = new Map<string, number>();

// In-memory storage for performance metrics (for demo purposes)
export const performanceMetrics: PerformanceMetrics[] = [];

// Enhanced initialization with consent awareness
export const initializePerformanceMonitoring = (
  callback: (metrics: PerformanceMetrics) => void,
  config?: Partial<PerformanceTrackingConfig>
): boolean => {
  if (typeof window === 'undefined') {
    console.warn('[Performance] Not available - not in browser environment');
    return false;
  }

  try {
    // Update configuration
    if (config) {
      trackingConfig = { ...trackingConfig, ...config };
    }

    // Respect consent level
    const consentRequired = ENHANCED_GA4_PROVIDER.consentRequired;
    const consentLevels = ['none', 'essential', 'functional', 'analytics'] as const;
    const currentIndex = consentLevels.indexOf(trackingConfig.consentLevel);
    const requiredIndex = consentLevels.indexOf(consentRequired);

    if (currentIndex < requiredIndex) {
      debugUtils.log('info', '[Performance] Insufficient consent for analytics', {
        current: trackingConfig.consentLevel,
        required: consentRequired
      });
      return false;
    }

    performanceCallback = callback;

    // Initialize tracking components
    const promises = [
      setupCoreWebVitalsTracking(),
      setupNavigationTimingTracking(),
      setupResourceTimingTracking(),
      setupPerformanceBudgetMonitoring()
    ];

    Promise.allSettled(promises).then(() => {
      performanceMonitoringActive = true;

      const envConfig = getCurrentEnvConfig();
      if (envConfig.enableConsoleLogging) {
        debugUtils.log('info', '[Performance] Monitoring initialized successfully');
      }

      // Send initialization success metric
      trackInitializationSuccess();
    });

    return true;
  } catch (error) {
    debugUtils.log('error', '[Performance] Initialization failed', error);
    return false;
  }
};

// Utility functions for Web Vitals rating calculation
const calculateVitalRating = (metricName: string, value: number): VitalRating => {
  const thresholds = PERFORMANCE_THRESHOLDS;

  switch (metricName.toLowerCase()) {
    case 'lcp':
      if (value <= thresholds.lcp.good) return 'good';
      if (value <= thresholds.lcp.needsImprovement) return 'needs-improvement';
      return 'poor';

    case 'fid':
      if (value <= thresholds.fid.good) return 'good';
      if (value <= thresholds.fid.needsImprovement) return 'needs-improvement';
      return 'poor';

    case 'inp':
      if (value <= thresholds.inp.good) return 'good';
      if (value <= thresholds.inp.needsImprovement) return 'needs-improvement';
      return 'poor';

    case 'cls':
      if (value <= thresholds.cls.good) return 'good';
      if (value <= thresholds.cls.needsImprovement) return 'needs-improvement';
      return 'poor';

    case 'fcp':
      if (value <= thresholds.fcp.good) return 'good';
      if (value <= thresholds.fcp.needsImprovement) return 'needs-improvement';
      return 'poor';

    case 'ttfb':
      if (value <= thresholds.ttfb.good) return 'good';
      if (value <= thresholds.ttfb.needsImprovement) return 'needs-improvement';
      return 'poor';

    default:
      return 'good'; // Default to good for unknown metrics
  }
};

const isExperimentalMetric = (metricName: string): boolean => {
  return metricName === 'INP'; // INP is the experimental replacement for FID
};

const trackInitializationSuccess = (): void => {
  if (performanceCallback) {
    const initializationMetric: PerformanceMetrics = {
      coreWebVitals: {},
      navigationTiming: {},
      resourceTiming: [],
      timestamp: Date.now(),
      userAgent: browserUtils.getUserAgent(),
      deviceType: browserUtils.getDeviceType(),
      consentLevel: trackingConfig.consentLevel,
      page_load_time: Date.now() - (performance as any).t0 || 0
    };

    performanceCallback(initializationMetric);

    debugUtils.log('info', '[Performance] Tracking initialization successful', {
      consentLevel: trackingConfig.consentLevel,
      pageLoadTime: initializationMetric.page_load_time
    });
  }
};

// Set up enhanced Core Web Vitals tracking
const setupCoreWebVitalsTracking = (): Promise<void> => {
  return new Promise((resolve) => {
    if (!browserUtils.isBrowser()) {
      resolve();
      return;
    }

    try {
      // Track Cumulative Layout Shift (CLS) with enhanced handling
      getCLS(handleWebVital, {
        reportAllChanges: trackingConfig.reportAllChanges
      });

      // Track First Contentful Paint (FCP)
      getFCP(handleWebVital);

      // Track First Input Delay (FID) - legacy metric (if available)
      if (typeof getFID === 'function') {
        getFID(handleWebVital);
      }

      // Track Largest Contentful Paint (LCP) with detailed reporting
      getLCP(handleWebVital, {
        reportAllChanges: trackingConfig.reportAllChanges
      });

      // Track Time to First Byte (TTFB)
      getTTFB(handleWebVital);

      // Track Interaction to Next Paint (INP) - modern metric
      if (typeof getINP === 'function') {
        getINP(handleWebVital, {
          reportAllChanges: trackingConfig.reportAllChanges
        });
      }

      debugUtils.log('info', '[Performance] Core Web Vitals tracking setup completed');
      resolve();
    } catch (error) {
      debugUtils.log('error', '[Performance] Core Web Vitals setup failed', error);
      resolve();
    }
  });
};

// Enhanced Web Vital handling with context and validation
const handleWebVital = (metric: Metric): void => {
  if (!performanceMonitoringActive || !performanceCallback) return;

  try {
    // Skip if insufficient consent
    if (trackingConfig.consentLevel === 'none' || trackingConfig.consentLevel === 'essential') {
      return;
    }

    // Apply sampling rate for privacy and performance
    if (Math.random() > trackingConfig.samplingRate) {
      return;
    }

    // Prevent duplicate reports (with tolerance)
    const cacheKey = `${metric.name}-${metric.id}`;
    const lastReported = metricsCache.get(cacheKey);
    if (lastReported && (Date.now() - lastReported) < 1000) {
      return;
    }

    // Enhanced metric processing with context
    const webVitalMetric: WebVitalMetric = {
      name: metric.name as WebVitalMetric['name'],
      value: metric.value,
      rating: calculateVitalRating(metric.name, metric.value),
      delta: metric.delta,
      entries: metric.entries,
      id: metric.id,
      navigationType: metric.navigationType as WebVitalMetric['navigationType'],

      // Enhanced context data
      deviceType: browserUtils.getDeviceType(),
      timestamp: Date.now(),
      consentLevel: trackingConfig.consentLevel,
      experimental: isExperimentalMetric(metric.name)
    };

    // Cache the report time
    metricsCache.set(cacheKey, Date.now());

    // Create performance metrics object
    const metricResult = createPerformanceMetrics([webVitalMetric]);

    // Call the callback with the metrics
    performanceCallback(metricResult);

    // Store metrics in memory for API access
    const metricData = {
      ...metricResult,
      timestamp: webVitalMetric.timestamp,
      consentLevel: webVitalMetric.consentLevel,
      clientInfo: {
        userAgent: browserUtils.getUserAgent(),
        deviceType: webVitalMetric.deviceType
      }
    };
    performanceMetrics.push(metricData);

    // Keep only last 1000 metrics to avoid memory issues
    if (performanceMetrics.length > 1000) {
      performanceMetrics.shift();
    }

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log(`Web Vital ${metric.name}:`, {
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta
      });
    }
  } catch (error) {
    console.error('Error handling web vital:', error);
  }
};

// Create comprehensive performance metrics
const createPerformanceMetrics = (webVitals: WebVitalMetric[]): PerformanceMetrics => {
  const coreWebVitals: CoreWebVitals = {};

  // Process each web vital
  webVitals.forEach(vital => {
    const rating = mapWebVitalRating(vital.name, vital.value);

    switch (vital.name) {
      case 'LCP':
        coreWebVitals.lcp = {
          value: vital.value,
          rating,
          element: getLCPElement(vital.entries)
        };
        break;

      case 'FID':
        coreWebVitals.fid = {
          value: vital.value,
          rating
        };
        break;

      case 'INP':
        coreWebVitals.inp = {
          value: vital.value,
          rating
        };
        break;

      case 'CLS':
        coreWebVitals.cls = {
          value: vital.value,
          rating,
          sources: getCLSSources(vital.entries)
        };
        break;

      case 'FCP':
        coreWebVitals.fcp = {
          value: vital.value,
          rating
        };
        break;

      case 'TTFB':
        coreWebVitals.ttfb = {
          value: vital.value,
          rating
        };
        break;
    }
  });

  return {
    coreWebVitals,
    navigationTiming: getNavigationTimingMetrics(),
    resourceTiming: getResourceTimingMetrics(),
    timestamp: Date.now(),
    url: window.location.href,
    deviceType: getDeviceType()
  };
};

// Map web vital values to ratings based on thresholds
const mapWebVitalRating = (metricName: string, value: number): VitalRating => {
  const thresholds = PERFORMANCE_THRESHOLDS[metricName.toLowerCase() as keyof typeof PERFORMANCE_THRESHOLDS];

  if (!thresholds) return 'poor';

  if (value <= thresholds.good) {
    return 'good';
  } else if (value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
};

// Extract LCP element from performance entries
const getLCPElement = (entries: any[]): string | undefined => {
  if (!entries || entries.length === 0) return undefined;

  const lastEntry = entries[entries.length - 1];
  if (lastEntry.element) {
    return getElementSelector(lastEntry.element);
  }

  return undefined;
};

// Extract CLS sources from performance entries
const getCLSSources = (entries: any[]): any[] => {
  if (!entries || entries.length === 0) return [];

  return entries
    .filter(entry => entry.sources && entry.sources.length > 0)
    .flatMap(entry => entry.sources)
    .map((source: any) => ({
      element: getElementSelector(source.node),
      previousRect: source.previousRect,
      currentRect: source.currentRect,
      impactScore: source.value || 0
    }));
};

// Get CSS selector for an element
const getElementSelector = (element: Element): string => {
  if (!element) return 'unknown';

  // Try to get a meaningful selector
  if (element.id) {
    return `#${element.id}`;
  }

  if (element.className && typeof element.className === 'string') {
    const classes = element.className.split(' ').filter(c => c.length > 0);
    if (classes.length > 0) {
      return `.${classes[0]}`;
    }
  }

  return element.tagName.toLowerCase();
};

// Get navigation timing metrics
const getNavigationTimingMetrics = (): NavigationTimingMetrics => {
  if (!window.performance || !window.performance.timing) {
    return {
      domainLookupTime: 0,
      connectionTime: 0,
      requestTime: 0,
      responseTime: 0,
      domProcessingTime: 0,
      loadEventTime: 0,
      totalLoadTime: 0
    };
  }

  const timing = window.performance.timing;

  return {
    domainLookupTime: timing.domainLookupEnd - timing.domainLookupStart,
    connectionTime: timing.connectEnd - timing.connectStart,
    requestTime: timing.responseStart - timing.requestStart,
    responseTime: timing.responseEnd - timing.responseStart,
    domProcessingTime: timing.domContentLoadedEventEnd - timing.responseEnd,
    loadEventTime: timing.loadEventEnd - timing.loadEventStart,
    totalLoadTime: timing.loadEventEnd - timing.navigationStart
  };
};

// Get resource timing metrics for key resources
const getResourceTimingMetrics = (): ResourceTimingMetrics[] => {
  if (!window.performance || !window.performance.getEntriesByType) {
    return [];
  }

  const resourceEntries = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[];

  return resourceEntries
    .filter(entry => {
      // Focus on key resources (scripts, stylesheets, images)
      return entry.initiatorType === 'script' ||
             entry.initiatorType === 'link' ||
             entry.initiatorType === 'img' ||
             entry.name.includes('.js') ||
             entry.name.includes('.css');
    })
    .slice(0, 10) // Limit to top 10 resources
    .map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize || 0,
      duration: entry.duration,
      startTime: entry.startTime
    }));
};

// Simple device type detection
const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Track performance budget violations
export const checkPerformanceBudget = (metrics: PerformanceMetrics): string[] => {
  const violations: string[] = [];

  // Check Core Web Vitals against thresholds
  if (metrics.coreWebVitals.lcp && metrics.coreWebVitals.lcp.rating === 'poor') {
    violations.push(`LCP exceeds threshold: ${metrics.coreWebVitals.lcp.value}ms`);
  }

  if (metrics.coreWebVitals.fid && metrics.coreWebVitals.fid.rating === 'poor') {
    violations.push(`FID exceeds threshold: ${metrics.coreWebVitals.fid.value}ms`);
  }

  if (metrics.coreWebVitals.inp && metrics.coreWebVitals.inp.rating === 'poor') {
    violations.push(`INP exceeds threshold: ${metrics.coreWebVitals.inp.value}ms`);
  }

  if (metrics.coreWebVitals.cls && metrics.coreWebVitals.cls.rating === 'poor') {
    violations.push(`CLS exceeds threshold: ${metrics.coreWebVitals.cls.value}`);
  }

  // Check navigation timing
  if (metrics.navigationTiming.totalLoadTime > 5000) {
    violations.push(`Total load time exceeds 5 seconds: ${metrics.navigationTiming.totalLoadTime}ms`);
  }

  return violations;
};

// Set up legacy performance tracking for older browsers
const setupLegacyPerformanceTracking = (): void => {
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const metrics = createPerformanceMetrics([]);
        if (performanceCallback) {
          performanceCallback(metrics);
        }
      }, 0);
    });
  }
};

// Progressive enhancement for browser compatibility
export const getPerformanceSupport = () => {
  return {
    performanceObserver: 'PerformanceObserver' in window,
    navigationTiming: !!(window.performance && window.performance.timing),
    resourceTiming: !!(window.performance && window.performance.getEntriesByType),
    webVitals: 'PerformanceObserver' in window,
    modernAPI: 'PerformanceObserver' in window && 'observe' in PerformanceObserver.prototype
  };
};

// Stop performance monitoring
export const stopPerformanceMonitoring = (): void => {
  performanceMonitoringActive = false;
  performanceCallback = null;

  const envConfig = getCurrentEnvConfig();
  if (envConfig.enableConsoleLogging) {
    console.log('Performance monitoring stopped');
  }
};

export default {
  initializePerformanceMonitoring,
  checkPerformanceBudget,
  getPerformanceSupport,
  stopPerformanceMonitoring
};