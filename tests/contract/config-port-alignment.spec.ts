import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * T008: Port Alignment Validation Test
 *
 * This test MUST FAIL initially due to CI workflow using port 4322 vs expected 4321.
 * After T012 fix, this test should PASS.
 *
 * Contract: All configuration files must use port 4321 consistently
 */

test.describe('Port Configuration Alignment Validation', () => {

  test('should have consistent port 4321 across all configuration files', async () => {
    const projectRoot = path.resolve(__dirname, '../..');

    // Test 1: Playwright config should use port 4321
    const playwrightConfigPath = path.join(projectRoot, 'playwright.config.ts');
    const playwrightConfig = fs.readFileSync(playwrightConfigPath, 'utf8');

    // Check baseURL
    expect(playwrightConfig).toContain('baseURL: \'http://localhost:4321\'');

    // Check webServer port
    expect(playwrightConfig).toContain('port: 4321');

    console.log('✅ Playwright config: Uses port 4321 correctly');

    // Test 2: Astro config should use port 4321 as default
    const astroConfigPath = path.join(projectRoot, 'astro.config.mjs');
    const astroConfig = fs.readFileSync(astroConfigPath, 'utf8');

    expect(astroConfig).toContain('process.env.PORT || \'4321\'');

    console.log('✅ Astro config: Uses port 4321 as default');

    // Test 3: CI workflow should use port 4321 (THIS WILL FAIL INITIALLY)
    const ciWorkflowPath = path.join(projectRoot, '.github/workflows/deploy.yml');

    if (fs.existsSync(ciWorkflowPath)) {
      const ciWorkflow = fs.readFileSync(ciWorkflowPath, 'utf8');

      // Check for port 4321 in dev server start command
      expect(ciWorkflow).toMatch(/npm run dev.*--port 4321/);

      // Check for port 4321 in health check URL
      expect(ciWorkflow).toMatch(/localhost:4321\/api\/health/);

      // Check for port 4321 in TEST_BASE_URL
      expect(ciWorkflow).toMatch(/TEST_BASE_URL.*localhost:4321/);

      console.log('✅ CI workflow: Uses port 4321 consistently');
    } else {
      console.log('⚠️ CI workflow file not found - skipping CI validation');
    }

    // Test 4: Package.json dev script validation (optional enhancement)
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Current script is just "astro dev" - this is acceptable but could be explicit
    expect(packageJson.scripts.dev).toBeDefined();

    // If it contains port, it should be 4321
    if (packageJson.scripts.dev.includes('--port')) {
      expect(packageJson.scripts.dev).toMatch(/--port\s+4321/);
    }

    console.log('✅ Package.json: Dev script validated');
  });

  test('should verify actual server starts on expected port', async ({ page }) => {
    // This test verifies the running server is accessible on port 4321

    // Attempt to navigate to the base URL
    const response = await page.goto('/');

    // Should get a successful response
    expect(response?.status()).toBe(200);

    // URL should be on port 4321
    expect(page.url()).toContain('localhost:4321');

    console.log('✅ Server is running and accessible on port 4321');
  });

  test('should validate health endpoint responds on correct port', async ({ request }) => {
    // Test health endpoint is accessible on the expected port

    const healthResponse = await request.get('/api/health');

    expect(healthResponse.status()).toBe(200);

    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('healthy');

    console.log('✅ Health endpoint responds correctly on port 4321');
  });

  test('should detect port conflicts in configuration', async () => {
    const projectRoot = path.resolve(__dirname, '../..');

    // Scan all config files for any port references other than 4321
    const configFiles = [
      'playwright.config.ts',
      'astro.config.mjs',
      'package.json',
      '.github/workflows/deploy.yml'
    ];

    const portMismatches: string[] = [];

    for (const file of configFiles) {
      const filePath = path.join(projectRoot, file);

      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');

        // Look for localhost with different ports
        const portMatches = content.match(/localhost:(\d+)/g);

        if (portMatches) {
          for (const match of portMatches) {
            const port = match.split(':')[1];
            if (port !== '4321') {
              portMismatches.push(`${file}: Found ${match} (expected localhost:4321)`);
            }
          }
        }

        // Look for explicit port configurations other than 4321
        const explicitPorts = content.match(/--port\s+(\d+)/g);
        if (explicitPorts) {
          for (const match of explicitPorts) {
            const port = match.split(/\s+/)[1];
            if (port !== '4321') {
              portMismatches.push(`${file}: Found ${match} (expected --port 4321)`);
            }
          }
        }
      }
    }

    if (portMismatches.length > 0) {
      console.log('❌ Port mismatches found:');
      portMismatches.forEach(mismatch => console.log(`  ${mismatch}`));

      // This WILL FAIL due to CI using port 4322
      expect(portMismatches).toHaveLength(0);
    } else {
      console.log('✅ No port mismatches detected');
    }
  });
});