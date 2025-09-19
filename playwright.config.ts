import { defineConfig, devices } from '@playwright/test'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Fail fast - no retries on CI to prevent long waits */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')'. */
    baseURL: 'http://localhost:4321',

    /* Simple timeouts for portfolio testing */
    actionTimeout: 5000,
    navigationTimeout: 10000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure'
  },

  /* Configure projects for portfolio testing - single browser for simplicity */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },

  /* Run your local dev server before starting the tests */
  webServer: {
    command: process.env.CI 
      ? 'PUBLIC_SUPABASE_URL=https://mock.supabase.co PUBLIC_SUPABASE_ANON_KEY=mock-anon-key-safe-for-ci npm run build && npm run preview'
      : 'npm run dev',
    port: 4321,
    reuseExistingServer: true, // Always reuse existing server
    timeout: 60 * 1000
  },

  /* Global setup and teardown */
  globalSetup: './tests/e2e/global-setup.ts',

  /* Simple timeouts for portfolio testing */
  timeout: 15 * 1000,
  expect: {
    /* Simple expect timeout for portfolio testing */
    timeout: 5 * 1000
  }
})
