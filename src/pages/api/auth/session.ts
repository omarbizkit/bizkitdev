// src/pages/api/auth/session.ts
// Get current session endpoint

import type { APIRoute } from 'astro'
import { supabaseServer } from '../../../lib/auth/supabase-client'
import { getUserProfile } from '../../../lib/auth/user-profile'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    const { data: { session }, error } = await supabaseServer.auth.getSession()

    if (error || !session) {
      return new Response(JSON.stringify({
        session: null,
        user: null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const user = await getUserProfile(session.user.id)

    return new Response(JSON.stringify({
      session,
      user
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
