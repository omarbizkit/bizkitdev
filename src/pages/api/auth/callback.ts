// src/pages/api/auth/callback.ts
// OAuth callback handler

import type { APIRoute } from 'astro'
import { supabaseServer } from '../../../lib/auth/supabase-client'

export const prerender = false

export const GET: APIRoute = async ({ url, redirect }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (!code) {
    return new Response(JSON.stringify({
      error: 'MISSING_CODE',
      message: 'Authorization code is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { error } = await supabaseServer.auth.exchangeCodeForSession(code)

    if (error) {
      return new Response(JSON.stringify({
        error: 'AUTH_FAILED',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

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
