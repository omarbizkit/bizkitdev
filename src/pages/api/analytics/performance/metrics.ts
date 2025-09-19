/**
 * Performance Metrics API Endpoint
 *
 * Provides real-time performance metrics, trends, and dashboard data.
 * Optimized for dashboard visualizations and monitoring tools.
 *
 * Based on: specs/057-advanced-analytics-monitoring/research.md
 * Feature: 057-advanced-analytics-monitoring
 * Endpoint: GET /api/analytics/performance/metrics
 */

import type { APIRoute } from 'astro';
import type { ConsentLevel, PerformanceMetrics } from '../../../../types/analytics';
import { debugUtils, browserUtils } from '../../../../lib/analytics/utils';

interface DashboardMetrics {
  summary: {
    activeSessions: number;
    averageLoadTime: number;
    errorRate: number;
    consentRate: number;
    lastUpdated: number;
  };
  metrics: {
    coreWebVitals: {
      lcp: MetricData;
      fid: MetricData;
      cls: MetricData;
      inp?: MetricData;
      fcp: MetricData;
      ttfb: MetricData;
    };
    userExperience: {
      bounceRate: number;
      sessionDuration: number;
      pageViews: number;
    };
    technical: {
      jsBundleSize: number;
      cssBundleSize: number;
      totalRequests: number;
    };
  };
  trends: {
    direction: 'improving' | 'declining' | 'stable';
    change: number;
    period: string;
  };
  alerts: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    metric: string;
    value: number;
    threshold: number;
    timestamp: number;
  }>;
}

interface MetricData {
  current: number;
  change: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  target: number;
  trend: 'up' | 'down' | 'stable';
  history: Array<{
    value: number;
    timestamp: number;
  }>;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Check consent level
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (consentLevel !== 'marketing') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Access to performance metrics requires marketing consent',
          code: 'INSUFFICIENT_CONSENT'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get dashboard metrics
    const dashboardData = await generateDashboardMetrics();
    const alerts = await generateAlerts(dashboardData);
    const trends = await calculateTrends();

    // Combine into complete response
    const response = {
      success: true,
      data: {
        ...dashboardData,
        trends,
        alerts
      },
      metadata: {
        generated: Date.now(),
        consentLevel,
        environment: import.meta.env.PROD ? 'production' : 'development',
        version: '1.0.0'
      }
    };

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, private'
        }
      }
    );

  } catch (error) {
    debugUtils.log('error', '[Performance Metrics API] Error generating dashboard', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate performance metrics',
        code: 'GENERATION_ERROR'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Generate dashboard metrics from collected data
 */
async function generateDashboardMetrics(): Promise<Omit<DashboardMetrics, 'trends' | 'alerts'>> {
  // In a real implementation, this would query your analytics database
  // For demo purposes, we'll generate representative data

  const summary = {
    activeSessions: Math.floor(Math.random() * 50) + 10,
    averageLoadTime: Math.random() * 2000 + 500,
    errorRate: Math.random() * 0.05,
    consentRate: 0.85 + Math.random() * 0.1,
    lastUpdated: Date.now() - Math.random() * 5 * 60 * 1000
  };

  const metrics: DashboardMetrics['metrics'] = {
    coreWebVitals: {
      lcp: generateMetricData(1800, 2500),
      fid: generateMetricData(90, 100),
      cls: generateMetricData(0.08, 0.1),
      inp: generateMetricData(150, 200),
      fcp: generateMetricData(1400, 1800),
      ttfb: generateMetricData(600, 800)
    },
    userExperience: {
      bounceRate: 0.35 + Math.random() * 0.2,
      sessionDuration: Math.random() * 300 + 180,
      pageViews: Math.floor(Math.random() * 100) + 50
    },
    technical: {
      jsBundleSize: 45.2,
      cssBundleSize: 12.8,
      totalRequests: Math.floor(Math.random() * 50) + 20
    }
  };

  return { summary, metrics };
}

/**
 * Generate metric data with trending history
 */
function generateMetricData(target: number, threshold?: number): MetricData {
  const current = target + (Math.random() - 0.5) * target * 0.2;
  const changePercent = ((current - target) / target) * 100;

  let rating: 'good' | 'needs-improvement' | 'poor' = 'good';
  if (threshold && current > threshold) {
    rating = 'needs-improvement';
    if (current > threshold * 1.5) rating = 'poor';
  } else if (changePercent > 10) {
    rating = 'poor';
  }

  const trend: 'up' | 'down' | 'stable' =
    changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';

  // Generate 24 hours of hourly history
  const history = Array.from({ length: 24 }, (_, i) => ({
    value: current + (Math.random() - 0.5) * current * 0.3,
    timestamp: Date.now() - (23 - i) * 60 * 60 * 1000
  }));

  return {
    current,
    change: changePercent,
    rating,
    target,
    trend,
    history
  };
}

/**
 * Generate performance alerts based on metrics
 */
async function generateAlerts(dashboardData: any): Promise<DashboardMetrics['alerts']> {
  const alerts: DashboardMetrics['alerts'] = [];
  const { coreWebVitals } = dashboardData.metrics;

  // Check critical metrics
  Object.entries(coreWebVitals).forEach(([metricName, data]: [string, any]) => {
    if (data.rating === 'poor') {
      alerts.push({
        id: `critical_${metricName}_${Date.now()}`,
        severity: 'critical',
        title: `${metricName.toUpperCase()} Performance Critical`,
        description: `${metricName.toUpperCase()} score is poor (${data.current.toFixed(2)}ms), indicating serious performance issues.`,
        metric: metricName,
        value: data.current,
        threshold: data.target,
        timestamp: Date.now()
      });
    } else if (data.rating === 'needs-improvement' && Math.abs(data.change) > 15) {
      alerts.push({
        id: `warning_${metricName}_${Date.now()}`,
        severity: 'warning',
        title: `${metricName.toUpperCase()} Needs Attention`,
        description: `${metricName.toUpperCase()} performance has ${data.trend === 'up' ? 'increased' : 'changed'} significantly.`,
        metric: metricName,
        value: data.current,
        threshold: data.target,
        timestamp: Date.now()
      });
    }
  });

  // Bundle size alerts
  const { technical } = dashboardData.metrics;
  if (technical.jsBundleSize > 100) {
    alerts.push({
      id: `bundle_size_${Date.now()}`,
      severity: 'warning',
      title: 'Large JavaScript Bundle',
      description: `JavaScript bundle is ${technical.jsBundleSize}KB, consider code splitting or tree shaking.`,
      metric: 'bundle_size',
      value: technical.jsBundleSize,
      threshold: 100,
      timestamp: Date.now()
    });
  }

  return alerts.slice(0, 10); // Limit to 10 most important alerts
}

/**
 * Calculate performance trends over time
 */
async function calculateTrends(): Promise<DashboardMetrics['trends']> {
  // In a real implementation, this would analyze trends from the database
  // For demo, we'll simulate trend analysis

  const change = (Math.random() - 0.5) * 20; // -10% to +10%
  let direction: 'improving' | 'declining' | 'stable';

  if (change > 2) {
    direction = 'improving';
  } else if (change < -2) {
    direction = 'declining';
  } else {
    direction = 'stable';
  }

  return {
    direction,
    change: Math.round(change * 100) / 100,
    period: '7d'
  };
}

// WebSocket endpoint for real-time metrics (if supported)
export const WEBSOCKET: APIRoute = async ({ request }) => {
  // WebSocket implementation for real-time metrics
  // This would require WebSocket support in the runtime
  return new Response(
    JSON.stringify({
      success: false,
      error: 'WebSocket not supported',
      code: 'NOT_SUPPORTED'
    }),
    {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

// POST endpoint for external monitoring tools
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const consentLevel: ConsentLevel = (locals.consent?.level as ConsentLevel) || 'none';

    if (consentLevel !== 'marketing') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'External monitoring requires marketing consent',
          code: 'INSUFFICIENT_CONSENT'
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await request.json();

    // Process external monitoring data
    debugUtils.log('info', '[Performance Metrics API] Received external monitoring data', {
      source: data.source || 'external',
      metrics: Object.keys(data.metrics || {}),
      timestamp: data.timestamp
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'External monitoring data received',
        acknowledged: true
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    debugUtils.log('error', '[Performance Metrics API] POST request error', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to process external monitoring data',
        code: 'PROCESSING_ERROR'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};