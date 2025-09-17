/**
 * Analytics Events Module
 *
 * Central event tracking and dispatch system for user interactions,
 * performance metrics, and conversion tracking.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Generated: 2025-09-17
 */

import type { ConsentLevel } from '../../types/analytics';
import { debugUtils, dataUtils } from './utils';
import { getCurrentEnvConfig } from './config';

// Event types for analytics tracking
export interface AnalyticsEvent {
  eventName: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  consentLevel: ConsentLevel;
  userAgent: string;
  deviceType: string;
  url: string;
  sessionId?: string;
}

// Event queue for batch processing
let eventQueue: AnalyticsEvent[] = [];
let eventCallback: ((event: AnalyticsEvent) => void) | null = null;

// Track user interaction events
export const trackEvent = (
  eventName: string,
  category: string,
  action: string,
  options?: {
    label?: string;
    value?: number;
    consentLevel?: ConsentLevel;
  }
): void => {
  try {
    const consentLevel = options?.consentLevel ?? 'essential';

    // Check consent for tracking
    if (!canTrackEvents(consentLevel)) {
      debugUtils.log('info', `[Events] Skipping event due to insufficient consent`, {
        event: eventName,
        consentLevel,
        required: 'analytics'
      });
      return;
    }

    const event: AnalyticsEvent = {
      eventName,
      category,
      action,
      label: options?.label,
      value: options?.value,
      timestamp: Date.now(),
      consentLevel,
      userAgent: navigator.userAgent,
      deviceType: getDeviceType(),
      url: window.location.href
    };

    eventQueue.push(event);

    // Call callback if available
    if (eventCallback) {
      eventCallback(event);
    }

    const envConfig = getCurrentEnvConfig();
    if (envConfig.enableConsoleLogging) {
      console.log('Analytics Event:', event);
    }
  } catch (error) {
    debugUtils.log('error', '[Events] Error tracking event', error);
  }
};

// Check if events can be tracked based on consent
const canTrackEvents = (consentLevel: ConsentLevel): boolean => {
  const consentHierarchy = ['none', 'essential', 'functional', 'analytics', 'marketing'];
  const currentIndex = consentHierarchy.indexOf(consentLevel);
  const analyticsIndex = consentHierarchy.indexOf('analytics');
  return currentIndex >= analyticsIndex;
};

// Simple device type detection
const getDeviceType = (): string => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Set event processing callback
export const setEventCallback = (callback: (event: AnalyticsEvent) => void): void => {
  eventCallback = callback;
};

// Get queued events
export const getEventQueue = (): AnalyticsEvent[] => {
  return [...eventQueue];
};

// Clear event queue (for testing or batch processing)
export const clearEventQueue = (): void => {
  eventQueue = [];
};

// Track specific conversion events
export const trackConversion = (goalId: string, value?: number): void => {
  trackEvent('conversion', 'goal', goalId, {
    value: value ?? 1,
    consentLevel: 'marketing'
  });
};

// Track form interactions
export const trackFormInteraction = (
  formId: string,
  interaction: 'start' | 'complete' | 'error',
  error?: string
): void => {
  trackEvent('form_interaction', 'engagement', interaction, {
    label: formId + (error ? `:${error}` : ''),
    consentLevel: 'analytics'
  });
};

export default {
  trackEvent,
  setEventCallback,
  getEventQueue,
  clearEventQueue,
  trackConversion,
  trackFormInteraction
};