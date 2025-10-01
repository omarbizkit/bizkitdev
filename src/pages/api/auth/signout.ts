// src/pages/api/auth/signout.ts
// Sign out endpoint

import type { APIRoute } from 'astro'
import { supabaseBrowser } from '../../../lib/auth/supabase-client'

export const prerender = false

export const POST: APIRoute = async () => {
  try {
    const { error } = await supabaseBrowser.auth.signOut()

    if (error) {
      return new Response(JSON.stringify({
        error: 'SIGNOUT_FAILED',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully signed out'
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
