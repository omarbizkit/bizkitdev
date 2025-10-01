// src/pages/api/auth/user.ts
// Get current user endpoint

import type { APIRoute } from 'astro'
import { supabaseServer, supabaseAdmin } from '../../../lib/auth/supabase-client'
import { getUserProfile } from '../../../lib/auth/user-profile'

export const prerender = false

export const GET: APIRoute = async () => {
  try {
    const { data: { user: authUser }, error } = await supabaseServer.auth.getUser()

    if (error || !authUser) {
      return new Response(JSON.stringify({
        error: 'UNAUTHORIZED',
        message: 'Not authenticated'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const user = await getUserProfile(authUser.id)

    // Also fetch full profile
    const profile = supabaseAdmin 
      ? await supabaseAdmin.from('user_profiles').select('*').eq('id', authUser.id).single()
      : { data: null }

    return new Response(JSON.stringify({
      user,
      profile: profile.data
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
