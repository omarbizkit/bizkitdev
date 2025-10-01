// src/lib/auth/user-profile.ts
// User profile data access utilities

import { supabaseBrowser, supabaseAdmin } from './supabase-client'
import type { AppUser, UserProfile } from '../../types/auth'

/**
 * Get user profile (server-side with admin client)
 */
export async function getUserProfile(userId: string): Promise<AppUser | null> {
  if (!supabaseAdmin) {
    console.error('Admin client not available')
    return null
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    return null
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId)

  if (authError || !authData.user) {
    console.error('Error fetching auth user:', authError)
    return null
  }

  return {
    id: profile.id,
    email: authData.user.email!,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    provider: profile.provider,
    email_confirmed_at: authData.user.email_confirmed_at || null,
    last_sign_in_at: authData.user.last_sign_in_at || null,
    created_at: profile.created_at
  }
}

/**
 * Update user profile (client-side)
 */
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'full_name' | 'bio' | 'website_url' | 'github_url' | 'twitter_handle'>>
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabaseBrowser.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabaseBrowser
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
