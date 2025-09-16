import { defineConfig, devices } from '@playwright/test';

/**
 * Contract Test Configuration
 * For running validation tests in tests/contract/
 */
export default defineConfig({
  testDir: './tests/contract',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['line'],
    ['json', { outputFile: 'test-results/contract-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:4321',
    actionTimeout: 10000,
    navigationTimeout: 30000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],
  webServer: {
    command: process.env.CI
      ? 'PUBLIC_SUPABASE_URL=https://mock.supabase.co PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-safe-for-ci npm run build && npm run preview'
      : 'npm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000
  },
  globalSetup: './tests/e2e/global-setup.ts',
  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000
  }
});