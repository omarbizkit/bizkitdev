/**
 * Analytics Utility Functions
 *
 * Common utility functions for analytics, performance monitoring, and data handling.
 * Provides shared functionality across all analytics services.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type {
  AnalyticsEvent,
  PerformanceMetrics,
  EventCategory,
  VitalRating,
  ConsentLevel
} from '../../types/analytics';
import { getCurrentEnvConfig } from './config';

/**
 * Browser and Environment Detection
 */
export const browserUtils = {
  /**
   * Check if running in browser environment
   */
  isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  },

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return getCurrentEnvConfig().isDevelopment;
  },

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return getCurrentEnvConfig().isProduction;
  },

  /**
   * Get user agent string
   */
  getUserAgent(): string {
    return this.isBrowser() ? navigator.userAgent : '';
  },

  /**
   * Get browser language
   */
  getBrowserLanguage(): string {
    return this.isBrowser() ? navigator.language : 'en';
  },

  /**
   * Get viewport dimensions
   */
  getViewportSize(): { width: number; height: number } {
    if (!this.isBrowser()) {
      return { width: 0, height: 0 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight
    };
  },

  /**
   * Check if Do Not Track is enabled
   */
  isDoNotTrackEnabled(): boolean {
    if (!this.isBrowser()) return false;

    const dnt = navigator.doNotTrack || (window as any).doNotTrack;
    return dnt === '1' || dnt === 'yes';
  },

  /**
   * Get device type based on screen size
   */
  getDeviceType(): string {
    const { width } = this.getViewportSize();

    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
};

/**
 * Data Transformation and Formatting
 */
export const dataUtils = {
  /**
   * Sanitize error messages for privacy
   */
  sanitizeError(error: Error | string): string {
    const message = error instanceof Error ? error.message : error;
    return message.replace(/(https?:\/\/[^\s]+)/g, '[URL]')
                  .replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g, '[EMAIL]');
  },

  /**
   * Truncate long strings
   */
  truncateString(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
  },

  /**
   * Generate consistent identifier (privacy-safe)
   */
  generateSafeId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  /**
   * Remove PII from objects
   */
  removePII(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const clone = { ...obj };

    // Remove common PII fields
    const piiFields = ['email', 'name', 'phone', 'address', 'password', 'token', 'api_key'];
    piiFields.forEach(field => {
      delete clone[field];
    });

    // Recursively clean nested objects
    for (const key in clone) {
      if (typeof clone[key] === 'object') {
        clone[key] = this.removePII(clone[key]);
      }
    }

    return clone;
  },

  /**
   * Format timing values for display
   */
  formatTiming(ms: number): string {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  },

  /**
   * Calculate percentage change
   */
  calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
};

/**
 * Event Handling and Tracking
 */
export const eventUtils = {
  /**
   * Debounce function calls
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return (...args: Parameters<T>) => {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };

      const callNow = immediate && !timeout;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(later, wait);

      if (callNow) func(...args);
    };
  },

  /**
   * Throttle function calls
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return (...args: Parameters<T>): void => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Batch multiple events for processing
   */
  createEventBatch(): {
    add: (event: AnalyticsEvent) => void;
    flush: () => AnalyticsEvent[];
    size: number;
  } {
    const batch: AnalyticsEvent[] = [];

    return {
      add: (event: AnalyticsEvent) => {
        batch.push(event);
      },
      flush: () => {
        const events = [...batch];
        batch.length = 0;
        return events;
      },
      size: batch.length
    };
  },

  /**
   * Create standardized event
   */
  createEvent(
    name: string,
    category: EventCategory,
    properties?: Record<string, any>
  ): AnalyticsEvent {
    return {
      id: dataUtils.generateSafeId(),
      name,
      category,
      properties: dataUtils.removePII(properties),
      timestamp: Date.now(),
      consentLevel: 'none' // Will be set by tracking function
    };
  }
};

/**
 * Performance and Timing Utilities
 */
export const performanceUtils = {
  /**
   * Measure execution time of a function
   */
  measureExecution<T>(
    fn: () => T,
    label?: string
  ): Promise<{ result: T; duration: number }> {
    return new Promise((resolve) => {
      const start = performance.now();
      const result = fn();
      const duration = performance.now() - start;

      if (label) {
        console.log(`Execution time for ${label}: ${duration.toFixed(2)}ms`);
      }

      resolve({ result, duration });
    });
  },

  /**
   * Check if performance API is available
   */
  isPerformanceAPIAvailable(): boolean {
    return browserUtils.isBrowser() && typeof performance !== 'undefined';
  },

  /**
   * Get page visibility state
   */
  getPageVisibility(): string {
    if (!browserUtils.isBrowser()) return 'hidden';
    return document.visibilityState || 'visible';
  },

  /**
   * Wait for page to become visible
   */
  waitForPageVisible(): Promise<void> {
    return new Promise((resolve) => {
      if (!browserUtils.isBrowser()) {
        resolve();
        return;
      }

      if (document.visibilityState === 'visible') {
        resolve();
        return;
      }

      const handler = () => {
        if (document.visibilityState === 'visible') {
          document.removeEventListener('visibilitychange', handler);
          resolve();
        }
      };

      document.addEventListener('visibilitychange', handler);
    });
  },

  /**
   * Rate limit operations to prevent overwhelming analytics
   */
  createRateLimiter(limit: number, timeWindow: number) {
    const requests: number[] = [];
    let timeout: NodeJS.Timeout | null = null;

    return {
      canMakeRequest: (): boolean => {
        const now = Date.now();
        const windowStart = now - timeWindow;

        // Remove old requests outside the time window
        const validRequests = requests.filter(time => time > windowStart);

        return validRequests.length < limit;
      },

      recordRequest: (): void => {
        const now = Date.now();
        requests.push(now);

        // Clean up old requests occasionally
        if (requests.length > limit * 2) {
          const cutoff = now - timeWindow;
          const cleanup = requests.filter(time => time > cutoff);
          requests.splice(0, requests.length - cleanup.length);
        }
      },

      reset: (): void => {
        requests.length = 0;
      }
    };
  }
};

/**
 * Storage and Caching Utilities
 */
export const storageUtils = {
  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable(): boolean {
    if (!browserUtils.isBrowser()) return false;

    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get item from localStorage with error handling
   */
  safeGetItem(key: string): string | null {
    if (!this.isLocalStorageAvailable()) return null;

    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * Set item in localStorage with error handling
   */
  safeSetItem(key: string, value: string): boolean {
    if (!this.isLocalStorageAvailable()) return false;

    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Remove item from localStorage with error handling
   */
  safeRemoveItem(key: string): boolean {
    if (!this.isLocalStorageAvailable()) return false;

    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get analytics cache with TTL
   */
  createAnalyticsCache<T>(ttl: number = 3600000) { // 1 hour default
    const cache: Map<string, { data: T; timestamp: number }> = new Map();

    return {
      get: (key: string): T | null => {
        const entry = cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.timestamp > ttl) {
          cache.delete(key);
          return null;
        }

        return entry.data;
      },

      set: (key: string, data: T): void => {
        cache.set(key, {
          data,
          timestamp: Date.now()
        });
      },

      clear: (): void => {
        cache.clear();
      },

      has: (key: string): boolean => {
        const entry = cache.get(key);
        return entry ? (Date.now() - entry.timestamp <= ttl) : false;
      }
    };
  }
};

/**
 * Debugging and Logging Utilities
 */
export const debugUtils = {
  /**
   * Analytics-specific logging with consent checking
   */
  log(
    level: 'info' | 'warn' | 'error',
    message: string,
    data?: any,
    consentLevel?: ConsentLevel
  ): void {
    // Skip logging if insufficient consent
    if (consentLevel === 'none' || consentLevel === 'essential') {
      return;
    }

    // Remove PII from logged data
    const sanitizedData = data ? dataUtils.removePII(data) : undefined;

    const logMessage = `[Analytics ${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'info':
        console.log(logMessage, sanitizedData);
        break;
      case 'warn':
        console.warn(logMessage, sanitizedData);
        break;
      case 'error':
        console.error(logMessage, sanitizedData);
        break;
    }
  },

  /**
   * Create analytics error reporter
   */
  createErrorReporter() {
    const errors: Array<{error: Error; context: any; timestamp: number}> = [];
    const maxErrors = 10;

    return {
      report: (error: Error, context?: any): void => {
        errors.push({
          error,
          context: dataUtils.removePII(context || {}),
          timestamp: Date.now()
        });

        // Keep only recent errors
        if (errors.length > maxErrors) {
          errors.shift();
        }

        debugUtils.log('error', 'Caught analytics error', {
          message: error.message,
          stack: error.stack?.split('\n')[0], // Only log first line of stack
          context
        });
      },

      getRecentErrors: (limit: number = 5): typeof errors => {
        return errors.slice(-limit);
      },

      clear: (): void => {
        errors.length = 0;
      }
    };
  },

  /**
   * Performance monitoring logger
   */
  logPerformance(metric: string, value: number, threshold?: number): void {
    const message = `${metric}: ${dataUtils.formatTiming(value)}`;

    if (threshold && value > threshold) {
      debugUtils.log('warn', `Performance warning - ${message} (threshold: ${dataUtils.formatTiming(threshold)})`);
    } else {
      debugUtils.log('info', `Performance metric - ${message}`);
    }
  }
};

/**
 * Integration and Compatibility Utilities
 */
export const integrationUtils = {
  /**
   * Check if external service is loaded
   */
  isServiceLoaded(globalVar: string): boolean {
    if (!browserUtils.isBrowser()) return false;
    return typeof (window as any)[globalVar] !== 'undefined';
  },

  /**
   * Wait for external script to load
   */
  waitForScript(scriptUrl: string, timeout = 10000): Promise<boolean> {
    return new Promise((resolve) => {
      if (!browserUtils.isBrowser()) {
        resolve(false);
        return;
      }

      // Check if script is already loaded
      const existingScripts = Array.from(document.getElementsByTagName('script'));
      for (const script of existingScripts) {
        if (script.src === scriptUrl) {
          if (script.onload || script.complete) {
            resolve(true);
            return;
          }
          break;
        }
      }

      const timer = setTimeout(() => resolve(false), timeout);

      const checkScriptLoaded = () => {
        // Implement script loading check logic here
        // This would need more sophisticated implementation
        clearTimeout(timer);
        resolve(true);
      };

      // Listen for script load events
      window.addEventListener('load', checkScriptLoaded, { once: true });
    });
  },

  /**
   * Create fallback mechanism for failed analytics calls
   */
  createFallback<T>(
    primary: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T | null> {
    return primary().catch(async (error) => {
      debugUtils.log('warn', 'Primary analytics call failed, trying fallback', error);

      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          debugUtils.log('error', 'Fallback analytics call also failed', fallbackError);
          return null;
        }
      }

      return null;
    });
  },

  /**
   * Service health check utility
   */
  createHealthChecker(serviceName: string, checkFn: () => Promise<boolean>) {
    let lastCheck = 0;
    let cachedResult: boolean | null = null;
    const checkInterval = 30000; // 30 seconds

    return async (): Promise<boolean> => {
      const now = Date.now();

      if (cachedResult !== null && now - lastCheck < checkInterval) {
        return cachedResult;
      }

      try {
        cachedResult = await checkFn();
        lastCheck = now;

        if (!cachedResult) {
          debugUtils.log('warn', `${serviceName} health check failed`);
        }

        return cachedResult;
      } catch (error) {
        cachedResult = false;
        lastCheck = now;
        debugUtils.log('error', `${serviceName} health check error`, error);
        return false;
      }
    };
  }
};

// Export default utilities bundle for easy importing
export default {
  browser: browserUtils,
  data: dataUtils,
  events: eventUtils,
  performance: performanceUtils,
  storage: storageUtils,
  debug: debugUtils,
  integration: integrationUtils
};