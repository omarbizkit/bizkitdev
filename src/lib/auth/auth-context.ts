// src/lib/auth/auth-context.ts
// Minimal auth state management for client-side

import { supabaseBrowser } from './supabase-client'
import type { AuthState } from '../../types/auth'

/**
 * Simple auth state store
 */
export function createAuthStore() {
  let state: AuthState = {
    session: null,
    user: null,
    loading: true,
    error: null
  }

  // Listen to auth state changes
  supabaseBrowser.auth.onAuthStateChange((event, session) => {
    state.session = session as any
    state.user = session?.user ? {
      id: session.user.id,
      email: session.user.email!,
      full_name: session.user.user_metadata?.name || null,
      avatar_url: session.user.user_metadata?.avatar_url || null,
      provider: session.user.app_metadata?.provider || 'google',
      email_confirmed_at: session.user.email_confirmed_at || null,
      last_sign_in_at: session.user.last_sign_in_at || null,
      created_at: session.user.created_at || new Date().toISOString()
    } : null
    state.loading = false
  })

  return {
    getState: () => state
  }
}
