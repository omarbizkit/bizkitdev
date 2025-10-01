// src/pages/api/auth/callback.ts
// OAuth callback handler

import type { APIRoute } from 'astro'
import { createServerClient } from '@supabase/ssr'

export const prerender = false

export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  // Debug logging
  console.log('🔍 OAuth Callback Debug:')
  console.log('  - Full URL:', url.href)
  console.log('  - Search params:', Object.fromEntries(url.searchParams))
  console.log('  - Code present:', !!code)
  console.log('  - Next redirect:', next)

  if (!code) {
    return new Response(JSON.stringify({
      error: 'MISSING_CODE',
      message: 'Authorization code is required',
      debug: {
        fullUrl: url.href,
        searchParams: Object.fromEntries(url.searchParams)
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
    const cookieDomain = import.meta.env.PUBLIC_COOKIE_DOMAIN || '.bizkit.dev'

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Create server client with cookie handling
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name) {
          return cookies.get(name)?.value
        },
        set(name, value, options) {
          // Ensure our domain always takes precedence
          const cookieOptions = {
            ...options,
            path: '/',
            sameSite: 'lax' as const,
            secure: true,
            domain: cookieDomain  // Set domain last to override any SDK defaults
          }
          cookies.set(name, value, cookieOptions)
        },
        remove(name, options) {
          cookies.delete(name, {
            ...options,
            domain: cookieDomain,
            path: '/'
          })
        }
      }
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('🔍 Session exchange result:')
    console.log('  - Cookie domain:', cookieDomain)
    console.log('  - Session created:', !!data.session)
    console.log('  - User ID:', data.session?.user?.id)
    console.log('  - User email:', data.session?.user?.email)
    console.log('  - Error:', error)

    if (error) {
      console.error('❌ Session exchange failed:', error)
      return new Response(JSON.stringify({
        error: 'AUTH_FAILED',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Session created successfully, redirecting...')

    // Return redirect response - cookies are already set by supabase client above
    return redirect(next, 303)
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
