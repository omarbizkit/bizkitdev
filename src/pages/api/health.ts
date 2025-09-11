import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * GET /api/health
 * Health check endpoint for monitoring and load balancers
 */
export const GET: APIRoute = async () => {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024)
      },
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    return new Response(
      JSON.stringify(healthData, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

  } catch (error) {
    console.error('Health check error:', error);
    
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
};

// Simple text response for basic health checks
export const HEAD: APIRoute = async () => {
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache'
    }
  });
};