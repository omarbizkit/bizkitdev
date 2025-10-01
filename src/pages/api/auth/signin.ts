// src/pages/api/auth/signin.ts
// Google OAuth sign-in endpoint

import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const prerender = false

export const POST: APIRoute = async ({ request, url }) => {
  try {
    const body = await request.json()
    const redirectTo = body.redirectTo || '/'

    // Force production URL in production environment to prevent localhost redirects
    const siteUrl = import.meta.env.PROD 
      ? 'https://bizkit.dev' 
      : (import.meta.env.PUBLIC_SITE_URL || url.origin)

    // Create Supabase client for OAuth
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=${redirectTo}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    // Debug logging
    console.log('🔍 OAuth Sign-in Debug:')
    console.log('  - siteUrl:', siteUrl)
    console.log('  - redirectTo:', `${siteUrl}/api/auth/callback?next=${redirectTo}`)
    console.log('  - Generated URL:', data?.url)
    console.log('  - Error:', error)

    if (error) {
      return new Response(JSON.stringify({
        error: 'AUTH_ERROR',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      url: data.url,
      provider: 'google',
      debug: {
        siteUrl,
        redirectTo: `${siteUrl}/api/auth/callback?next=${redirectTo}`,
        generatedUrl: data.url
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
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
