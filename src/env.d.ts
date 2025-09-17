/**
 * TypeScript environment declarations for analytics system
 *
 * This file extends global types to support analytics functionality.
 */

import type { AnalyticsProvider } from '../components/analytics/AnalyticsProvider.astro';

declare global {
  interface Window {
    /**
     * Global analytics provider instance
     */
    analyticsProvider?: typeof AnalyticsProvider;

    /**
     * Custom event for consent changes
     */
    dispatchEvent(event: CustomEvent<{ reinitializeAnalytics: boolean }>): boolean;
  }
}

// Export empty object to make this a module
export {};