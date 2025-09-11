import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getCurrentSession,
  getCurrentUser,
  resetPassword,
  updatePassword
} from '@/utils/auth'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      onAuthStateChange: vi.fn()
    }
  }
}))

describe('Auth Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:4321'
      },
      writable: true
    })
  })

  describe('signInWithGoogle', () => {
    it('should sign in with Google successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }

      mockSupabaseModule.supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signInWithGoogle()

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
      expect(result.session).toEqual(mockSession)
    })

    it('should handle Google sign-in error', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.auth.signInWithOAuth = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('OAuth error')
      })

      const result = await signInWithGoogle()

      expect(result.success).toBe(false)
      expect(result.error).toBe('OAuth error')
    })
  })

  describe('signInWithEmail', () => {
    it('should sign in with email successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockUser = { id: '123', email: 'test@example.com' }
      const mockSession = { access_token: 'token123' }

      mockSupabaseModule.supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await signInWithEmail('test@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })

    it('should handle email sign-in error', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Invalid credentials')
      })

      const result = await signInWithEmail('test@example.com', 'wrongpassword')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })
  })

  describe('signUpWithEmail', () => {
    it('should sign up with email successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockUser = { id: '123', email: 'test@example.com' }

      mockSupabaseModule.supabase.auth.signUp = vi.fn().mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      })

      const result = await signUpWithEmail('test@example.com', 'password123')

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })
  })

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.auth.signOut = vi.fn().mockResolvedValue({
        error: null
      })

      const result = await signOut()

      expect(result.success).toBe(true)
      expect(result.user).toBe(null)
      expect(result.session).toBe(null)
    })
  })

  describe('getCurrentSession', () => {
    it('should get current session successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockSession = { user: { id: '123' }, access_token: 'token123' }

      mockSupabaseModule.supabase.auth.getSession = vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await getCurrentSession()

      expect(result.success).toBe(true)
      expect(result.session).toEqual(mockSession)
    })
  })

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockUser = { id: '123', email: 'test@example.com' }

      mockSupabaseModule.supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const user = await getCurrentUser()

      expect(user).toEqual(mockUser)
    })

    it('should return null on error', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated')
      })

      const user = await getCurrentUser()

      expect(user).toBe(null)
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.auth.resetPasswordForEmail = vi.fn().mockResolvedValue({
        error: null
      })

      const result = await resetPassword('test@example.com')

      expect(result.success).toBe(true)
    })
  })

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockUser = { id: '123', email: 'test@example.com' }

      mockSupabaseModule.supabase.auth.updateUser = vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const result = await updatePassword('newpassword123')

      expect(result.success).toBe(true)
      expect(result.user).toEqual(mockUser)
    })
  })
})
