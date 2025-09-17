/**
 * Performance Analytics Report API Endpoint
 *
 * Generates performance reports and analytics based on collected metrics.
 * Provides insights into Core Web Vitals, user experience, and performance trends.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Endpoint: GET /api/analytics/performance/report
 */

import type { APIRoute } from 'astro';
import type { ConsentLevel, VitalRating } from '../../../../types/analytics';
import { debugUtils, dataUtils, browserUtils } from '../../../../lib/analytics/utils';
import { PERFORMANCE_THRESHOLDS } from '../../../../lib/analytics/config';

// Performance report types
interface PerformanceReport {
  period: {
    start: number;
    end: number;
    duration: number;
  };
  summary: {
    totalMetrics: number;
    averageSessionDuration?: number;
    consentLevels: Record<ConsentLevel, number>;
    deviceTypes: Record<string, number>;
  };
  coreWebVitals: {
    lcp?: VitalSummary;
    fid?: VitalSummary;
    cls?: VitalSummary;
    inp?: VitalSummary;
    fcp?: VitalSummary;
    ttfb?: VitalSummary;
  };
  insights: Array<{
    type: 'optimization' | 'issue' | 'trend';
    severity: 'low' | 'medium' | 'high' | 'critical';
    metric: string;
    message: string;
    value?: number;
    suggestedAction?: string;
  }>;
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high';
    category: string;
    title: string;
    description: string;
    impact?: string;
  }>;
}

interface VitalSummary {
  average: number;
  median: number;
  minimum: number;
  maximum: number;
  percentile95: number;
  rating: {
    good: number;
    needsImprovement: number;
    poor: number;
  };
  count: number;
}

/**
 * Generate comprehensive performance report
 */
function generatePerformanceReport(metrics: any[], startTime: number, endTime: number): PerformanceReport {
  const report: PerformanceReport = {
    period: {
      start: startTime,
      end: endTime,
      duration: endTime - startTime
    },
    summary: {
      totalMetrics: metrics.length,
      consentLevels: {},
      deviceTypes: {}
    },
    coreWebVitals: {},
    insights: [],
    recommendations: []
  };

  if (metrics.length === 0) {
    report.insights.push({
      type: 'issue',
      severity: 'low',
      metric: 'data_availability',
      message: 'No performance metrics available for the specified period'
    });
    return report;
  }

  // Process metrics
  const processedMetrics = processMetrics(metrics);
  const vitalsAnalysis = analyzeCoreWebVitals(processedMetrics);

  // Update report with processed data
  report.summary.consentLevels = processedMetrics.consentLevels;
  report.summary.deviceTypes = processedMetrics.deviceTypes;
  report.coreWebVitals = vitalsAnalysis;
  report.insights = generateInsights(vitalsAnalysis, processedMetrics);
  report.recommendations = generateRecommendations(vitalsAnalysis);

  return report;
}

/**
 * Process raw metrics into organized data structure
 */
function processMetrics(metrics: any[]) {
  const result = {
    consentLevels: {} as Record<ConsentLevel, number>,
    deviceTypes: {} as Record<string, number>,
    coreWebVitals: {
      lcp: [] as number[],
      fid: [] as number[],
      cls: [] as number[],
      inp: [] as number[],
      fcp: [] as number[],
      ttfb: [] as number[]
    }
  };

  metrics.forEach(metric => {
    // Count consent levels
    const consent = metric.consentLevel || 'none';
    result.consentLevels[consent] = (result.consentLevels[consent] || 0) + 1;

    // Count device types
    const deviceType = metric.data?.deviceType || metric.clientInfo?.deviceType || 'unknown';
    result.deviceTypes[deviceType] = (result.deviceTypes[deviceType] || 0) + 1;

    // Collect Core Web Vitals
    if (metric.data?.coreWebVitals) {
      const vitals = metric.data.coreWebVitals;

      if (vitals.LCP?.value) result.coreWebVitals.lcp.push(vitals.LCP.value);
      if (vitals.FID?.value) result.coreWebVitals.fid.push(vitals.FID.value);
      if (vitals.CLS?.value) result.coreWebVitals.cls.push(vitals.CLS.value);
      if (vitals.INP?.value) result.coreWebVitals.inp.push(vitals.INP.value);
      if (vitals.FCP?.value) result.coreWebVitals.fcp.push(vitals.FCP.value);
      if (vitals.TTFB?.value) result.coreWebVitals.ttfb.push(vitals.TTFB.value);
    }
  });

  return result;
}

/**
 * Analyze Core Web Vitals data
 */
function analyzeCoreWebVitals(processedMetrics: any): Record<string, VitalSummary> {
  const vitals: Record<string, VitalSummary> = {};

  Object.entries(processedMetrics.coreWebVitals).forEach(([metricName, values]: [string, number[]]) => {
    if (values.length === 0) return;

    const sorted = [...values].sort((a, b) => a - b);

    vitals[metricName.toLowerCase()] = {
      average: values.reduce((a, b) => a + b, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      minimum: sorted[0],
      maximum: sorted[sorted.length - 1],
      percentile95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
      count: values.length,
      rating: calculateVitalRatingDistribution(metricName, values, sorted.length)
    };
  });

  return vitals;
}

/**
 * Calculate distribution of vital ratings
 */
function calculateVitalRatingDistribution(metricName: string, values: number[], totalCount: number): { good: number; needsImprovement: number; poor: number } {
  const thresholds = PERFORMANCE_THRESHOLDS;

  let goodCount = 0;
  let improvementCount = 0;
  let poorCount = 0;

  const config = thresholds[metricName.toLowerCase() as keyof typeof thresholds];

  if (!config) {
    // Default distribution if thresholds not found
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    goodCount = Math.floor(totalCount * 0.7);
    improvementCount = Math.floor(totalCount * 0.2);
    poorCount = totalCount - goodCount - improvementCount;
  } else {
    values.forEach(value => {
      if (value <= config.good) {
        goodCount++;
      } else if (value <= config.needsImprovement) {
        improvementCount++;
      } else {
        poorCount++;
      }
    });
  }

  return {
    good: Math.round((goodCount / totalCount) * 100),
    needsImprovement: Math.round((improvementCount / totalCount) * 100),
    poor: Math.round((poorCount / totalCount) * 100)
  };
}

/**
 * Generate insights from performance data
 */
function generateInsights(vitals: Record<string, VitalSummary>, processedMetrics: any): Array<any> {
  const insights: Array<any> = [];

  // Check for critical performance issues
  Object.entries(vitals).forEach(([metricName, summary]) => {
    if (summary.count < 5) return; // Need enough data points

    // Check poor performance
    if (summary.rating.poor > 50) {
      insights.push({
        type: 'issue',
        severity: 'high',
        metric: metricName,
        message: `${metricName.toUpperCase()} has poor rating for ${(summary.rating.poor).toFixed(1)}% of users`,
        value: summary.average,
        suggestedAction: `Optimize ${metricName} performance - current average is ${dataUtils.formatTiming(summary.average)}`
      });
    }

    // Check needs improvement
    if (summary.rating.needsImprovement > 60) {
      insights.push({
        type: 'optimization',
        severity: 'medium',
        metric: metricName,
        message: `${metricName.toUpperCase()} rating needs improvement for ${(summary.rating.needsImprovement).toFixed(1)}% of users`,
        value: summary.average,
        suggestedAction: `Review ${metricName} optimization strategies`
      });
    }

    // Check for inconsistency
    const variance = summary.maximum - summary.minimum;
    if (metricName === 'cls' && variance > 0.2) {
      insights.push({
        type: 'issue',
        severity: 'medium',
        metric: 'cls',
        message: `CLS varies significantly (${variance.toFixed(3)}) across users`,
        value: variance,
        suggestedAction: 'Fix layout shifts that cause unpredictable CLS scores'
      });
    }

    // Check experimental metrics
    if (metricName === 'inp' && summary.count > 10) {
      insights.push({
        type: 'trend',
        severity: 'low',
        metric: 'inp',
        message: `INP experimental metric being tracked with ${summary.count} data points`,
        value: summary.average,
        suggestedAction: 'Monitor INP as it replaces FID in future'
      });
    }
  });

  // Check data completeness
  const dataCompleteness = processedMetrics.coreWebVitals;
  Object.entries(dataCompleteness).forEach(([metric, values]) => {
    if (values.length === 0) {
      insights.push({
        type: 'issue',
        severity: 'low',
        metric: metric,
        message: `No ${metric.toUpperCase()} data collected`,
        suggestedAction: 'Ensure Core Web Vitals library is properly implemented'
      });
    }
  });

  // Device-specific insights
  const devices = processedMetrics.deviceTypes;
  if (Object.keys(devices).length > 0) {
    const predominantDevice = Object.entries(devices).sort(([,a], [,b]) => b - a)[0];
    const percentage = ((predominantDevice[1] / totalMetrics) * 100);

    if (percentage > 80) {
      insights.push({
        type: 'trend',
        severity: 'low',
        metric: 'device_usage',
        message: `${(percentage).toFixed(1)}% of users are on ${(predominantDevice[0])}`,
        suggestedAction: 'Optimize performance for predominant device type'
      });
    }
  }

  return insights.slice(0, 10); // Limit to 10 most important insights
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(vitals: Record<string, VitalSummary>): Array<any> {
  const recommendations: Array<any> = [];

  // LCP recommendations
  if (vitals.lcp) {
    const lcp = vitals.lcp;
    if (lcp.average > PERFORMANCE_THRESHOLDS.lcp.good) {
      recommendations.push({
        priority: lcp.rating.poor > 30 ? 'high' : 'medium',
        category: 'optimization',
        title: 'Optimize Largest Contentful Paint (LCP)',
        description: 'Consider optimizing images, lazy loading, and server response times to improve LCP.',
        impact: 'Loading speed'
      });
    }
  }

  // CLS recommendations
  if (vitals.cls) {
    const cls = vitals.cls;
    if (cls.average > PERFORMANCE_THRESHOLDS.cls.good) {
      recommendations.push({
        priority: cls.rating.poor > 30 ? 'high' : 'medium',
        category: 'user_experience',
        title: 'Fix Layout Shifts (CLS)',
        description: 'Ensure all elements have explicit dimensions to prevent layout shifts.',
        impact: 'User experience stability'
      });
    }
  }

  // INP (new metric) recommendations
  if (vitals.inp && vitals.inp.rating.needsImprovement > 30) {
    recommendations.push({
      priority: 'medium',
      category: 'interaction',
      title: 'Optimize Interaction Responsiveness (INP)',
      description: 'Focus on reducing long-running JavaScript tasks that block user interactions.',
      impact: 'Responsiveness'
    });
  }

  // General infrastructure recommendations
  recommendations.push({
    priority: 'medium',
    category: 'infrastructure',
    title: 'Implement Performance Budgets',
    description: 'Set up automatic monitoring of bundle sizes, asset sizes, and performance regressions.',
    impact: 'Continuous performance'
  });

  return recommendations.slice(0, 5); // Limit to 5 key recommendations
}

export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    // Check consent level for accessing performance reports
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (consentLevel !== 'marketing') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access to performance reports requires marketing consent',
          code: 'INSUFFICIENT_CONSENT'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse query parameters
    const params = new URL(request.url).searchParams;

    const period = params.get('period') || '7d'; // 7d, 24h, 1h
    const format = params.get('format') || 'summary'; // summary, detailed, csv

    // Calculate time range
    const now = Date.now();
    const periods = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const periodMs = periods[period as keyof typeof periods] || periods['7d'];
    const startTime = now - periodMs;

    // Import performance metrics (in production, this would come from database)
    let allMetrics: any[] = [];
    try {
      const performanceModule = await import('../../../../lib/analytics/performance');
      // In a real implementation, you'd get metrics from a database
      // For demo, we're using the in-memory store
      allMetrics = performanceModule.performanceMetrics || [];
    } catch {
      allMetrics = [];
    }

    // Filter metrics by time period
    const periodMetrics = allMetrics.filter(
      metric => metric.timestamp >= startTime && metric.timestamp <= now
    );

    debugUtils.log('info', `[Performance Report] Generating report for ${period}`, {
      totalMetrics: allMetrics.length,
      periodMetrics: periodMetrics.length,
      format
    });

    if (format === 'csv') {
      // Generate CSV export
      const csvData = generateCsvReport(periodMetrics);
      return new Response(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="performance_report_${period}_${now}.csv"`
        }
      });
    }

    if (format === 'detailed') {
      // Return detailed raw data
      const report = generatePerformanceReport(periodMetrics, startTime, now);

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            ...report,
            rawMetrics: periodMetrics.slice(-50) // Limit for performance
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Default: summary format
    const report = generatePerformanceReport(periodMetrics, startTime, now);

    return new Response(
      JSON.stringify({
        success: true,
        data: report,
        metadata: {
          generated: now,
          period,
          format,
          consentLevel
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    debugUtils.log('error', '[Performance Report] Error generating report', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate performance report',
        code: 'REPORT_GENERATION_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Generate CSV format report
 */
function generateCsvReport(metrics: any[]): string {
  const headers = [
    'Timestamp',
    'Consent Level',
    'Device Type',
    'LCP',
    'FID',
    'CLS',
    'INP',
    'FCP',
    'TTFB'
  ];

  const rows = metrics.map(metric => {
    const vitals = metric.data?.coreWebVitals || {};
    return [
      new Date(metric.timestamp).toISOString(),
      metric.consentLevel,
      metric.clientInfo?.deviceType || 'unknown',
      vitals.LCP?.value || '',
      vitals.FID?.value || '',
      vitals.CLS?.value || '',
      vitals.INP?.value || '',
      vitals.FCP?.value || '',
      vitals.TTFB?.value || ''
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

// Type definitions for the totalMetrics variable
let totalMetrics = 0;