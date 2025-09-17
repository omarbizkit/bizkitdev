import { test, expect } from '@playwright/test';

/**
 * T011: Server Health Check Validation Test
 *
 * This test should PASS as audit showed health endpoint is comprehensively implemented.
 * Validates health endpoint functionality, response format, and reliability.
 *
 * Contract: Health endpoint must provide reliable server status information
 */

test.describe('Server Health Check Validation', () => {

  test('should respond with 200 status on health endpoint', async ({ request }) => {
    const response = await request.get('/api/health');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    console.log('✅ Health endpoint responds with 200 OK and JSON content type');
  });

  test('should provide comprehensive health data structure', async ({ request }) => {
    const response = await request.get('/api/health');
    const healthData = await response.json();

    // Required fields from audit
    expect(healthData).toHaveProperty('status');
    expect(healthData).toHaveProperty('timestamp');
    expect(healthData).toHaveProperty('version');
    expect(healthData).toHaveProperty('environment');
    expect(healthData).toHaveProperty('uptime');

    // Status should be 'healthy'
    expect(healthData.status).toBe('healthy');

    // Timestamp should be recent (within last minute)
    const timestamp = new Date(healthData.timestamp);
    const now = new Date();
    const timeDiff = now.getTime() - timestamp.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute old

    console.log('✅ Health data has required fields and recent timestamp');
    console.log(`  Status: ${healthData.status}`);
    console.log(`  Environment: ${healthData.environment}`);
    console.log(`  Uptime: ${healthData.uptime}s`);
  });

  test('should provide detailed system information', async ({ request }) => {
    const response = await request.get('/api/health');
    const healthData = await response.json();

    // Memory information (from audit findings)
    expect(healthData).toHaveProperty('memory');
    expect(healthData.memory).toHaveProperty('used');
    expect(healthData.memory).toHaveProperty('total');
    expect(healthData.memory).toHaveProperty('external');
    expect(healthData.memory).toHaveProperty('rss');

    // Memory values should be positive numbers
    expect(healthData.memory.used).toBeGreaterThan(0);
    expect(healthData.memory.total).toBeGreaterThan(0);

    // Node.js information (from audit findings)
    expect(healthData).toHaveProperty('node');
    expect(healthData.node).toHaveProperty('version');
    expect(healthData.node).toHaveProperty('platform');
    expect(healthData.node).toHaveProperty('arch');

    console.log('✅ Health endpoint provides detailed system information');
    console.log(`  Memory used: ${healthData.memory.used}MB`);
    console.log(`  Node version: ${healthData.node.version}`);
    console.log(`  Platform: ${healthData.node.platform}`);
  });

  test('should have proper cache control headers', async ({ request }) => {
    const response = await request.get('/api/health');
    const headers = response.headers();

    // Should have no-cache headers for real-time status
    expect(headers['cache-control']).toContain('no-cache');
    expect(headers['cache-control']).toContain('no-store');
    expect(headers['cache-control']).toContain('must-revalidate');
    expect(headers['pragma']).toBe('no-cache');
    expect(headers['expires']).toBe('0');

    console.log('✅ Health endpoint has proper no-cache headers');
  });

  test('should support HEAD method for basic checks', async ({ request }) => {
    const response = await request.head('/api/health');

    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers['cache-control']).toContain('no-cache');

    console.log('✅ Health endpoint supports HEAD method for basic checks');
  });

  test('should handle health check reliability and consistency', async ({ request }) => {
    // Test multiple consecutive health checks
    const healthChecks = [];

    for (let i = 0; i < 5; i++) {
      const response = await request.get('/api/health');
      const healthData = await response.json();

      healthChecks.push({
        status: response.status(),
        data: healthData
      });

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // All checks should succeed
    healthChecks.forEach((check, index) => {
      expect(check.status).toBe(200);
      expect(check.data.status).toBe('healthy');
      console.log(`✅ Health check ${index + 1}/5: Status ${check.data.status}`);
    });

    console.log('✅ Health endpoint is reliable and consistent across multiple checks');
  });

  test('should validate health check response time performance', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/health');
    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);

    // Health check should respond quickly (within 5 seconds)
    expect(responseTime).toBeLessThan(5000);

    console.log(`✅ Health check responded in ${responseTime}ms (within 5s limit)`);
  });

  test('should validate health endpoint in browser context', async ({ page }) => {
    // Test health endpoint accessibility from browser
    const response = await page.goto('/api/health');

    expect(response?.status()).toBe(200);

    // Should display JSON response
    const content = await page.textContent('body');
    const healthData = JSON.parse(content);

    expect(healthData.status).toBe('healthy');

    console.log('✅ Health endpoint accessible and functional in browser context');
  });

  test('should validate health check can be used for monitoring', async ({ request }) => {
    const response = await request.get('/api/health');
    const healthData = await response.json();

    // Monitoring-friendly data structure
    expect(healthData.status).toBe('healthy');
    expect(typeof healthData.uptime).toBe('number');
    expect(typeof healthData.memory.used).toBe('number');

    // Should provide enough information for basic monitoring
    const monitoringData = {
      isHealthy: healthData.status === 'healthy',
      uptimeSeconds: healthData.uptime,
      memoryUsageMB: healthData.memory.used,
      environment: healthData.environment,
      nodeVersion: healthData.node.version
    };

    expect(monitoringData.isHealthy).toBe(true);
    expect(monitoringData.uptimeSeconds).toBeGreaterThan(0);

    console.log('✅ Health endpoint provides monitoring-friendly data structure');
    console.log(`  Uptime: ${monitoringData.uptimeSeconds}s`);
    console.log(`  Memory: ${monitoringData.memoryUsageMB}MB`);
    console.log(`  Environment: ${monitoringData.environment}`);
  });

  test('should validate health endpoint error handling capability', async ({ request }) => {
    // Test that health endpoint structure can handle potential errors gracefully

    const response = await request.get('/api/health');
    const healthData = await response.json();

    // Should have error handling structure in place
    expect(healthData.status).toBeDefined();
    expect(['healthy', 'unhealthy']).toContain(healthData.status);

    // If status is healthy, should have all required fields
    if (healthData.status === 'healthy') {
      expect(healthData.timestamp).toBeDefined();
      expect(healthData.uptime).toBeDefined();
      expect(healthData.memory).toBeDefined();
      expect(healthData.node).toBeDefined();
    }

    console.log('✅ Health endpoint has proper structure for error handling');
  });
});