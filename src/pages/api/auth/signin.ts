// src/pages/api/auth/signin.ts
// Google OAuth sign-in endpoint

import type { APIRoute } from 'astro'
import { supabaseBrowser } from '../../../lib/auth/supabase-client'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json()
    const redirectTo = body.redirectTo || '/'

    const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/api/auth/callback?next=${redirectTo}`
      }
    })

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
      provider: 'google'
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
