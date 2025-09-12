import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import type { FullConfig } from '@playwright/test'

// Get current directory in ESM context
const __dirname = dirname(new URL(import.meta.url).pathname)

// Load test environment variables manually from .env.test
function loadTestEnv() {
  const altPaths = [
    '../../../.env.test', // Project root from tests/e2e/
    '../../.env.test', // For other build contexts
    './.env.test', // Current directory
    '../.env.test' // Parent directory
  ]

  for (const path of altPaths) {
    try {
      const envPath = resolve(__dirname, path)
      const envContent = readFileSync(envPath, 'utf8')
      console.log('✅ Successfully loaded .env.test from:', path)

      const lines = envContent.split('\n').filter(line => line && !line.startsWith('#'))

      lines.forEach(line => {
        const [key, ...valueParts] = line.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim()
          process.env[key.trim()] = value
        }
      })
      return // Success, exit function
    } catch (error) {
      // Continue trying other paths
    }
  }

  // If we get here, all paths failed
  console.warn('⚠️  Could not load .env.test file from any expected location')
  console.warn('   Falling back to existing environment variables')
}

loadTestEnv()

async function globalSetup(_config: FullConfig) {
  console.log('🚀 Starting Playwright global setup...')
  console.log('✅ Loaded environment variables from .env.test')

  // You can add global setup logic here such as:
  // - Setting up test database
  // - Authentication setup
  // - Environment variable validation

  // Validate required environment variables
  const requiredEnvVars = ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY']

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn('⚠️  Warning: Missing environment variables:', missingVars.join(', '))
    console.warn('   Current values:', requiredEnvVars.map(name => `${name}=${process.env[name] || 'undefined'}`).join(', '))
    console.warn('   E2E tests that require Supabase may fail.')
  } else {
    console.log('✅ All required environment variables are present')
    console.log('   Supabase URL:', process.env.PUBLIC_SUPABASE_URL)
    console.log('   Supabase Key:', process.env.PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...')
  }

  console.log('✅ Playwright global setup complete')
}

export default globalSetup
