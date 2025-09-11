import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Project, ErrorResponse } from '../../src/types/api';

/**
 * Contract tests for GET /api/projects/{projectId} endpoint
 * Tests API contract compliance before implementation exists
 * These tests MUST FAIL until the endpoint is implemented
 */
describe('GET /api/projects/{projectId} - Contract Tests', () => {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:4321';
  const baseEndpoint = `${baseUrl}/api/projects`;

  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after tests
  });

  describe('Successful Response (200)', () => {
    it('should return project details with valid structure', async () => {
      const projectId = 'test-project-id';
      const endpoint = `${baseEndpoint}/${projectId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
      });

      // Contract assertions
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');

      const project: Project = await response.json();
      
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

      // The returned project ID should match the requested ID
      expect(project.id).toBe(projectId);
    });

    it('should handle different valid project ID formats', async () => {
      const validProjectIds = [
        'project-1',
        'my-awesome-project',
        'project123',
        'ai-trading-system',
        'data-viz-platform'
      ];

      for (const projectId of validProjectIds) {
        const endpoint = `${baseEndpoint}/${projectId}`;
        const response = await fetch(endpoint, { method: 'GET' });

        // Should either return 200 (if project exists) or 404 (if not found)
        expect([200, 404]).toContain(response.status);
        expect(response.headers.get('content-type')).toContain('application/json');

        if (response.status === 200) {
          const project: Project = await response.json();
          expect(project.id).toBe(projectId);
        }
      }
    });

    it('should include optional screenshot_url when available', async () => {
      const projectId = 'project-with-screenshot';
      const endpoint = `${baseEndpoint}/${projectId}`;

      const response = await fetch(endpoint, { method: 'GET' });

      if (response.status === 200) {
        const project: Project = await response.json();
        
        // If screenshot_url is present, validate it
        if (project.screenshot_url) {
          expect(typeof project.screenshot_url).toBe('string');
          expect(project.screenshot_url).toMatch(/^https?:\/\/.+/);
        }
      }
    });
  });

  describe('Not Found (404)', () => {
    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = 'non-existent-project-12345';
      const endpoint = `${baseEndpoint}/${nonExistentId}`;

      const response = await fetch(endpoint, {
        method: 'GET',
      });

      expect(response.status).toBe(404);
      expect(response.headers.get('content-type')).toContain('application/json');

      const responseBody: ErrorResponse = await response.json();
      expect(responseBody).toHaveProperty('error');
      expect(responseBody).toHaveProperty('message');
      expect(typeof responseBody.error).toBe('string');
      expect(typeof responseBody.message).toBe('string');
      expect(responseBody.message.toLowerCase()).toContain('not found');
    });

    it('should return 404 for empty project ID', async () => {
      const endpoint = `${baseEndpoint}/`;

      const response = await fetch(endpoint, {
        method: 'GET',
      });

      // Could be 404 (project not found) or different routing behavior
      expect([404, 405]).toContain(response.status);
    });

    it('should handle URL-encoded project IDs', async () => {
      const projectIds = [
        'project%20with%20spaces', // Should be invalid
        'project%2Dwith%2Ddashes', // project-with-dashes (valid)
        'project%2Fwith%2Fslashes', // Should be invalid
      ];

      for (const encodedId of projectIds) {
        const endpoint = `${baseEndpoint}/${encodedId}`;
        const response = await fetch(endpoint, { method: 'GET' });

        expect([200, 400, 404]).toContain(response.status);
        expect(response.headers.get('content-type')).toContain('application/json');
      }
    });
  });

  describe('Bad Request (400) - Invalid Project IDs', () => {
    it('should reject invalid project ID formats', async () => {
      const invalidProjectIds = [
        'PROJECT_WITH_UPPERCASE', // Uppercase not allowed
        'project with spaces',     // Spaces not allowed
        'project/with/slashes',    // Slashes not allowed
        'project@with@symbols',    // Special symbols not allowed
        'project.with.dots',       // Dots not allowed
        '',                        // Empty string
        'a'.repeat(300),           // Too long
      ];

      for (const invalidId of invalidProjectIds) {
        const endpoint = `${baseEndpoint}/${encodeURIComponent(invalidId)}`;
        const response = await fetch(endpoint, { method: 'GET' });

        // Should return 400 for invalid format or 404 for not found
        expect([400, 404]).toContain(response.status);
        expect(response.headers.get('content-type')).toContain('application/json');

        if (response.status === 400) {
          const responseBody: ErrorResponse = await response.json();
          expect(responseBody).toHaveProperty('error');
          expect(responseBody).toHaveProperty('message');
        }
      }
    });
  });

  describe('HTTP Method Validation', () => {
    it('should reject non-GET methods', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];
      const projectId = 'test-project';
      
      for (const method of methods) {
        const endpoint = `${baseEndpoint}/${projectId}`;
        const response = await fetch(endpoint, { method });
        
        expect([405, 404]).toContain(response.status); // Method Not Allowed or Not Found
      }
    });
  });

  describe('Response Headers and Caching', () => {
    it('should include appropriate cache headers for static data', async () => {
      const projectId = 'test-project';
      const endpoint = `${baseEndpoint}/${projectId}`;
      const response = await fetch(endpoint, { method: 'GET' });
      
      if (response.status === 200) {
        // Should include cache control for static project data
        const cacheControl = response.headers.get('cache-control');
        if (cacheControl) {
          expect(cacheControl).toMatch(/max-age=\d+/);
        }
      }
    });

    it('should include proper ETag for caching if supported', async () => {
      const projectId = 'test-project';
      const endpoint = `${baseEndpoint}/${projectId}`;
      const response = await fetch(endpoint, { method: 'GET' });
      
      if (response.status === 200) {
        // ETag might be present for better caching
        const etag = response.headers.get('etag');
        if (etag) {
          expect(typeof etag).toBe('string');
          expect(etag.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Security Considerations', () => {
    it('should prevent path traversal attacks', async () => {
      const maliciousIds = [
        '../../../etc/passwd',
        '..\\..\\windows\\system32',
        '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '....//....//....//etc//passwd',
      ];

      for (const maliciousId of maliciousIds) {
        const endpoint = `${baseEndpoint}/${encodeURIComponent(maliciousId)}`;
        const response = await fetch(endpoint, { method: 'GET' });

        // Should not return system files, should be 400 or 404
        expect([400, 404]).toContain(response.status);
        expect(response.headers.get('content-type')).toContain('application/json');
        
        const responseBody = await response.text();
        expect(responseBody).not.toContain('root:');
        expect(responseBody).not.toContain('[users]');
      }
    });

    it('should handle SQL injection attempts gracefully', async () => {
      const sqlInjectionIds = [
        "'; DROP TABLE projects; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users --",
      ];

      for (const maliciousId of sqlInjectionIds) {
        const endpoint = `${baseEndpoint}/${encodeURIComponent(maliciousId)}`;
        const response = await fetch(endpoint, { method: 'GET' });

        // Should handle gracefully, not crash or expose data
        expect([200, 400, 404]).toContain(response.status);
        expect(response.headers.get('content-type')).toContain('application/json');
      }
    });
  });

  describe('Performance', () => {
    it('should respond quickly for individual project lookup', async () => {
      const projectId = 'test-project';
      const endpoint = `${baseEndpoint}/${projectId}`;
      
      const startTime = Date.now();
      const response = await fetch(endpoint, { method: 'GET' });
      const endTime = Date.now();

      // Response should be fast for individual project
      expect(endTime - startTime).toBeLessThan(1000);
      
      expect([200, 404]).toContain(response.status);
    });

    it('should handle concurrent requests efficiently', async () => {
      const projectId = 'test-project';
      const endpoint = `${baseEndpoint}/${projectId}`;
      
      // Make multiple concurrent requests
      const requests = Array.from({ length: 10 }, () => 
        fetch(endpoint, { method: 'GET' })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All should complete reasonably quickly
      expect(endTime - startTime).toBeLessThan(3000);
      
      // All should have consistent responses
      responses.forEach(response => {
        expect([200, 404]).toContain(response.status);
      });
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data across multiple requests', async () => {
      const projectId = 'test-project';
      const endpoint = `${baseEndpoint}/${projectId}`;

      const response1 = await fetch(endpoint, { method: 'GET' });
      const response2 = await fetch(endpoint, { method: 'GET' });

      if (response1.status === 200 && response2.status === 200) {
        const project1: Project = await response1.json();
        const project2: Project = await response2.json();

        // Data should be identical
        expect(project1).toEqual(project2);
      }
    });

    it('should maintain referential integrity with projects list', async () => {
      // Get all projects first
      const allProjectsResponse = await fetch(`${baseUrl}/api/projects`, { method: 'GET' });
      
      if (allProjectsResponse.status === 200) {
        const allProjectsData = await allProjectsResponse.json();
        
        if (allProjectsData.projects.length > 0) {
          const firstProject = allProjectsData.projects[0];
          
          // Get individual project
          const individualResponse = await fetch(`${baseEndpoint}/${firstProject.id}`, { method: 'GET' });
          
          if (individualResponse.status === 200) {
            const individualProject: Project = await individualResponse.json();
            
            // Should be the same project data
            expect(individualProject).toEqual(firstProject);
          }
        }
      }
    });
  });
});