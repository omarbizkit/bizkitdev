import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  subscribeUser,
  confirmSubscription,
  unsubscribeUser,
  getActiveSubscribersCount
} from '@/utils/subscription'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn().mockReturnThis()
    })),
    rpc: vi.fn()
  }
}))

describe('Subscription Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('subscribeUser', () => {
    it('should reject invalid email format', async () => {
      const result = await subscribeUser('invalid-email')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format')
      expect(result.message).toBe('Please enter a valid email address.')
    })

    it('should accept valid email format', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      })
      const mockInsert = vi.fn().mockResolvedValue({ error: null })

      mockSupabaseModule.supabase.from = vi.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle,
        insert: mockInsert
      }))

      const result = await subscribeUser('test@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe(
        'Thank you for subscribing! Please check your email to confirm your subscription.'
      )
    })

    it('should handle already subscribed users', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockSelect = vi.fn().mockReturnThis()
      const mockEq = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { email: 'test@example.com', confirmed: true, active: true },
        error: null
      })

      mockSupabaseModule.supabase.from = vi.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        single: mockSingle
      }))

      const result = await subscribeUser('test@example.com')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Already subscribed')
      expect(result.message).toBe('This email is already subscribed to our updates.')
    })
  })

  describe('confirmSubscription', () => {
    it('should confirm subscription successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.rpc = vi.fn().mockResolvedValue({ error: null })

      const result = await confirmSubscription('test@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe(
        'Your subscription has been confirmed! Thank you for joining our community.'
      )
    })

    it('should handle confirmation errors', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.rpc = vi.fn().mockResolvedValue({
        error: new Error('Invalid confirmation token')
      })

      const result = await confirmSubscription('test@example.com')

      expect(result.success).toBe(false)
      expect(result.message).toBe(
        'Unable to confirm subscription. The link may be invalid or expired.'
      )
    })
  })

  describe('unsubscribeUser', () => {
    it('should unsubscribe user successfully', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      mockSupabaseModule.supabase.rpc = vi.fn().mockResolvedValue({ error: null })

      const result = await unsubscribeUser('test@example.com')

      expect(result.success).toBe(true)
      expect(result.message).toBe('You have been successfully unsubscribed from our email list.')
    })
  })

  describe('getActiveSubscribersCount', () => {
    it('should return subscriber count', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: { total_subscribers: 42 },
        error: null
      })

      mockSupabaseModule.supabase.from = vi.fn(() => ({
        select: mockSelect,
        single: mockSingle
      }))

      const count = await getActiveSubscribersCount()

      expect(count).toBe(42)
    })

    it('should return 0 on error', async () => {
      const mockSupabaseModule = await import('@/lib/supabase')
      const mockSelect = vi.fn().mockReturnThis()
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      })

      mockSupabaseModule.supabase.from = vi.fn(() => ({
        select: mockSelect,
        single: mockSingle
      }))

      const count = await getActiveSubscribersCount()

      expect(count).toBe(0)
    })
  })
})
