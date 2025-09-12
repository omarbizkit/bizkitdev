import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { ProjectsResponse, ProjectStatus } from '../../src/types/api';

/**
 * Contract tests for GET /api/projects endpoint
 * Tests API contract compliance before implementation exists
 * These tests MUST FAIL until the endpoint is implemented
 */
describe('GET /api/projects - Contract Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:4321';
  const endpoint = `${baseUrl}/api/projects`;

  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after tests
  });

  describe('Successful Response (200)', () => {
    it('should return all projects with valid structure', async () => {
      const response = await fetch(endpoint, {
        method: 'GET',
      });

      // Contract assertions
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseBody: ProjectsResponse = await response.json();
      
      // Response schema validation
      expect(responseBody).toHaveProperty('projects');
      expect(responseBody).toHaveProperty('total');
      expect(Array.isArray(responseBody.projects)).toBe(true);
      expect(typeof responseBody.total).toBe('number');
      expect(responseBody.total).toBeGreaterThanOrEqual(0);
      expect(responseBody.projects.length).toBeLessThanOrEqual(responseBody.total);
    });

    it('should return projects with valid Project schema', async () => {
      const response = await fetch(endpoint, { method: 'GET' });
      const responseBody: ProjectsResponse = await response.json();

      // If projects exist, validate their structure
      if (responseBody.projects.length > 0) {
        const project = responseBody.projects[0];
        
        // Required fields validation
        expect(project).toHaveProperty('id');
        expect(project).toHaveProperty('name');
        expect(project).toHaveProperty('description_short');
        expect(project).toHaveProperty('description_long');
        expect(project).toHaveProperty('status');
        expect(project).toHaveProperty('tech_stack');
        expect(project).toHaveProperty('subdomain_url');
        expect(project).toHaveProperty('github_url');
        expect(project).toHaveProperty('created_date');
        expect(project).toHaveProperty('featured');

        // Type validation
        expect(typeof project.id).toBe('string');
        expect(typeof project.name).toBe('string');
        expect(typeof project.description_short).toBe('string');
        expect(typeof project.description_long).toBe('string');
        expect(typeof project.status).toBe('string');
        expect(Array.isArray(project.tech_stack)).toBe(true);
        expect(typeof project.subdomain_url).toBe('string');
        expect(typeof project.github_url).toBe('string');
        expect(typeof project.created_date).toBe('string');
        expect(typeof project.featured).toBe('boolean');

        // Validation rules
        expect(project.id).toMatch(/^[a-z0-9-]+$/);
        expect(project.name.length).toBeLessThanOrEqual(100);
        expect(project.description_short.length).toBeLessThanOrEqual(150);
        expect(['idea', 'development', 'live', 'archived']).toContain(project.status);
        expect(project.tech_stack.length).toBeGreaterThan(0);
        expect(project.subdomain_url).toMatch(/^https?:\/\/.+/);
        expect(project.github_url).toMatch(/^https:\/\/github\.com\//);
        expect(project.created_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

        // Optional screenshot_url validation
        if (project.screenshot_url) {
          expect(typeof project.screenshot_url).toBe('string');
          expect(project.screenshot_url).toMatch(/^https?:\/\/.+/);
        }
      }
    });

    it('should return empty array when no projects exist', async () => {
      // This test validates the contract when no projects are available
      const response = await fetch(endpoint, { method: 'GET' });
      const responseBody: ProjectsResponse = await response.json();

      // Should still be valid response structure
      expect(responseBody).toHaveProperty('projects');
      expect(responseBody).toHaveProperty('total');
      expect(Array.isArray(responseBody.projects)).toBe(true);
      expect(typeof responseBody.total).toBe('number');

      // If empty, total should be 0
      if (responseBody.projects.length === 0) {
        expect(responseBody.total).toBe(0);
      }
    });
  });

  describe('Query Parameter Filtering', () => {
    it('should filter by status parameter', async () => {
      const statuses: ProjectStatus[] = ['idea', 'development', 'live', 'archived'];
      
      for (const status of statuses) {
        const url = `${endpoint}?status=${status}`;
        const response = await fetch(url, { method: 'GET' });

        expect(response.status).toBe(200);
        
        const responseBody: ProjectsResponse = await response.json();
        expect(responseBody).toHaveProperty('projects');
        expect(responseBody).toHaveProperty('total');

        // All returned projects should have the requested status
        responseBody.projects.forEach(project => {
          expect(project.status).toBe(status);
        });
      }
    });

    it('should filter by featured parameter', async () => {
      const featuredValues = [true, false];
      
      for (const featured of featuredValues) {
        const url = `${endpoint}?featured=${featured}`;
        const response = await fetch(url, { method: 'GET' });

        expect(response.status).toBe(200);
        
        const responseBody: ProjectsResponse = await response.json();
        expect(responseBody).toHaveProperty('projects');
        expect(responseBody).toHaveProperty('total');

        // All returned projects should match the featured filter
        responseBody.projects.forEach(project => {
          expect(project.featured).toBe(featured);
        });
      }
    });

    it('should handle combined status and featured filters', async () => {
      const url = `${endpoint}?status=live&featured=true`;
      const response = await fetch(url, { method: 'GET' });

      expect(response.status).toBe(200);
      
      const responseBody: ProjectsResponse = await response.json();
      
      // All returned projects should match both filters
      responseBody.projects.forEach(project => {
        expect(project.status).toBe('live');
        expect(project.featured).toBe(true);
      });
    });

    it('should ignore invalid status values gracefully', async () => {
      const invalidStatuses = ['invalid', 'unknown', '', 'LIVE'];
      
      for (const status of invalidStatuses) {
        const url = `${endpoint}?status=${encodeURIComponent(status)}`;
        const response = await fetch(url, { method: 'GET' });

        // Should either return 200 (ignoring invalid filter) or 400 (validation error)
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          const responseBody: ProjectsResponse = await response.json();
          expect(responseBody).toHaveProperty('projects');
          expect(responseBody).toHaveProperty('total');
        }
      }
    });

    it('should handle invalid featured parameter values', async () => {
      const invalidFeaturedValues = ['yes', 'no', '1', '0', 'invalid'];
      
      for (const featured of invalidFeaturedValues) {
        const url = `${endpoint}?featured=${encodeURIComponent(featured)}`;
        const response = await fetch(url, { method: 'GET' });

        // Should either return 200 (ignoring invalid filter) or 400 (validation error)
        expect([200, 400]).toContain(response.status);
      }
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-GET methods', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      
      for (const method of methods) {
        const response = await fetch(endpoint, { method });
        expect([405, 404]).toContain(response.status); // Method Not Allowed or Not Found
      }
    });
  });

  describe('Response Headers and Caching', () => {
    it('should include appropriate cache headers', async () => {
      const response = await fetch(endpoint, { method: 'GET' });
      
      expect(response.status).toBe(200);
      
      // Should include cache control for static data
      const cacheControl = response.headers.get('cache-control');
      if (cacheControl) {
        expect(cacheControl).toMatch(/max-age=\d+/);
      }
    });

    it('should include CORS headers if required', async () => {
      const response = await fetch(endpoint, { method: 'GET' });
      
      // CORS headers might be present for client-side access
      const corsOrigin = response.headers.get('access-control-allow-origin');
      if (corsOrigin) {
        expect(corsOrigin).toMatch(/\*|https?:\/\/.+/);
      }
    });
  });

  describe('Performance and Pagination', () => {
    it('should handle large project lists efficiently', async () => {
      const startTime = Date.now();
      const response = await fetch(endpoint, { method: 'GET' });
      const endTime = Date.now();

      expect(response.status).toBe(200);
      
      // Response should be reasonably fast (under 2 seconds for contract test)
      expect(endTime - startTime).toBeLessThan(2000);
      
      const responseBody: ProjectsResponse = await response.json();
      
      // Response size should be reasonable (no unexpected large data)
      const responseSize = JSON.stringify(responseBody).length;
      expect(responseSize).toBeLessThan(1024 * 1024); // Less than 1MB
    });

    it('should support pagination parameters if implemented', async () => {
      // These parameters might be supported in the future
      const paginationUrls = [
        `${endpoint}?limit=10`,
        `${endpoint}?offset=0`,
        `${endpoint}?page=1`,
        `${endpoint}?limit=5&offset=10`
      ];

      for (const url of paginationUrls) {
        const response = await fetch(url, { method: 'GET' });
        
        // Should either support pagination (200) or ignore unknown params (200) or reject (400)
        expect([200, 400]).toContain(response.status);
        
        if (response.status === 200) {
          const responseBody: ProjectsResponse = await response.json();
          expect(responseBody).toHaveProperty('projects');
          expect(responseBody).toHaveProperty('total');
        }
      }
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent project IDs across requests', async () => {
      const response1 = await fetch(endpoint, { method: 'GET' });
      const response2 = await fetch(endpoint, { method: 'GET' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      const data1: ProjectsResponse = await response1.json();
      const data2: ProjectsResponse = await response2.json();

      // Project IDs should be consistent
      const ids1 = data1.projects.map(p => p.id).sort();
      const ids2 = data2.projects.map(p => p.id).sort();
      
      expect(ids1).toEqual(ids2);
    });

    it('should return projects in consistent order', async () => {
      const response1 = await fetch(endpoint, { method: 'GET' });
      const response2 = await fetch(endpoint, { method: 'GET' });

      const data1: ProjectsResponse = await response1.json();
      const data2: ProjectsResponse = await response2.json();

      // Order should be consistent (likely by created_date or featured status)
      expect(data1.projects.map(p => p.id)).toEqual(data2.projects.map(p => p.id));
    });
  });
});