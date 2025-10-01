// src/pages/api/auth/debug.ts
// Debug endpoint to check auth state

import type { APIRoute } from 'astro'
import { createServerClient } from '@supabase/ssr'

export const prerender = false

export const GET: APIRoute = async ({ cookies }) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  const cookieDomain = import.meta.env.PUBLIC_COOKIE_DOMAIN || '.bizkit.dev'

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({
      error: 'Missing env vars',
      supabaseUrl: !!supabaseUrl,
      supabaseAnonKey: !!supabaseAnonKey
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get all cookies
  const allCookies = Array.from(cookies.getAll()).map(c => ({
    name: c.name,
    value: c.value.substring(0, 20) + '...', // Truncate for security
    hasValue: !!c.value
  }))

  // Create server client
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        return cookies.get(name)?.value
      },
      set(name, value, options) {
        cookies.set(name, value, {
          ...options,
          path: '/',
          sameSite: 'lax' as const,
          secure: true,
          domain: cookieDomain
        })
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

  const { data: { user }, error } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()

  return new Response(JSON.stringify({
    config: {
      cookieDomain,
      supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    },
    cookies: {
      total: allCookies.length,
      list: allCookies,
      supabaseCookies: allCookies.filter(c => c.name.startsWith('sb-'))
    },
    auth: {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasSession: !!session,
      sessionExpiry: session?.expires_at,
      error: error?.message
    }
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
