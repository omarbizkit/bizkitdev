// src/types/auth.ts
// TypeScript types for Supabase Google OAuth Authentication

/**
 * User from Supabase auth.users
 */
export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  app_metadata: {
    provider: 'google'
    [key: string]: any
  }
  user_metadata: {
    name?: string
    avatar_url?: string
    email?: string
    email_verified?: boolean
    [key: string]: any
  }
}

/**
 * Custom user profile from public.user_profiles table
 */
export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  provider: string
  bio: string | null
  website_url: string | null
  github_url: string | null
  twitter_handle: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Combined user data for application use
 * Combines auth.users + user_profiles data
 */
export interface AppUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  created_at: string
}

/**
 * Session object from Supabase Auth
 */
export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: 'bearer'
  user: AuthUser
}

/**
 * Auth state for UI components
 */
export interface AuthState {
  session: Session | null
  user: AppUser | null
  loading: boolean
  error: Error | null
}

/**
 * Sign-in request payload
 */
export interface SignInRequest {
  redirectTo?: string
}

/**
 * Sign-in response
 */
export interface SignInResponse {
  url: string
  provider: 'google'
}

/**
 * Error response from auth endpoints
 */
export interface AuthErrorResponse {
  error: string
  message: string
  details?: any
}

/**
 * Session response from /api/auth/session
 */
export interface SessionResponse {
  session: Session | null
  user: AppUser | null
}

/**
 * User response from /api/auth/user
 */
export interface UserResponse {
  user: AppUser | null
  profile: UserProfile | null
}

/**
 * User profile update payload
 */
export interface UserProfileUpdate {
  full_name?: string
  bio?: string
  website_url?: string
  github_url?: string
  twitter_handle?: string
  preferences?: Record<string, any>
}
