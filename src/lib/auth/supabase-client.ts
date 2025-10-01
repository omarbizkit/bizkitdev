// src/lib/auth/supabase-client.ts
// Supabase client with cross-subdomain cookie configuration

import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
const cookieDomain = import.meta.env.PUBLIC_COOKIE_DOMAIN || '.bizkit.dev'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Browser client for client-side operations
 * Configured with .bizkit.dev cookie domain for cross-subdomain session sharing
 */
export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: cookieDomain,
    maxAge: 100000000,
    path: '/',
    sameSite: 'lax',
    secure: true
  }
})

/**
 * Server client for API routes (respects RLS, uses anon key)
 * Use this in server-side API routes instead of browser client
 */
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Admin client for server-side operations (bypasses RLS)
 * Only available on server-side with service role key
 */
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null
