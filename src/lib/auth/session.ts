// src/lib/auth/session.ts
// Session management utilities

import { supabaseBrowser } from './supabase-client'
import type { Session } from '../../types/auth'

/**
 * Get current session (client-side)
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseBrowser.auth.getSession()
  if (error || !session) return null
  return session as Session
}

/**
 * Refresh session (client-side)
 */
export async function refreshSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseBrowser.auth.refreshSession()
  if (error || !session) return null
  return session as Session
}

/**
 * Sign out (client-side)
 */
export async function signOut(): Promise<void> {
  await supabaseBrowser.auth.signOut()
  window.location.href = '/'
}
