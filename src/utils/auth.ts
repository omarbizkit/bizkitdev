import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthResult {
  success: boolean
  user?: User | null
  session?: Session | null
  error?: string
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (error) throw error

    // OAuth sign-in returns redirect data, not user/session
    // User will be available after redirect callback
    return {
      success: true,
      user: null,
      session: null
    }
  } catch (error) {
    console.error('Google sign-in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google sign-in failed'
    }
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Email sign-in error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign-in failed'
    }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) throw error

    return {
      success: true,
      user: data.user,
      session: data.session
    }
  } catch (error) {
    console.error('Email sign-up error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign-up failed'
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    return {
      success: true,
      user: null,
      session: null
    }
  } catch (error) {
    console.error('Sign-out error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign-out failed'
    }
  }
}

/**
 * Get the current user session
 */
export async function getCurrentSession(): Promise<AuthResult> {
  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) throw error

    return {
      success: true,
      user: session?.user || null,
      session
    }
  } catch (error) {
    console.error('Get session error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get session'
    }
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) throw error

    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) throw error

    return {
      success: true
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password reset failed'
    }
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error

    return {
      success: true,
      user: data.user
    }
  } catch (error) {
    console.error('Update password error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Password update failed'
    }
  }
}

/**
 * Listen for auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
