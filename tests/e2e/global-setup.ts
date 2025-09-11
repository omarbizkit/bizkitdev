import type { FullConfig } from '@playwright/test'

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...')

  // You can add global setup logic here such as:
  // - Setting up test database
  // - Authentication setup
  // - Environment variable validation

  // Validate required environment variables
  const requiredEnvVars = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY']

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables:', missingVars.join(', '))
    console.warn('   E2E tests that require Supabase may fail.')
  } else {
    console.log('✅ All required environment variables are present')
  }

  console.log('✅ Playwright global setup complete')
}

export default globalSetup
