import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './supabase-mock'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

// Use mock Supabase in test environment
const nodeEnv = import.meta.env.NODE_ENV || process.env.NODE_ENV
const isTestEnvironment = nodeEnv === 'test' || 
                         supabaseUrl?.includes('mock.supabase.co') ||
                         supabaseAnonKey === 'mock-anon-key'

// Use mock Supabase in test environment
if (isTestEnvironment) {
  console.log('Using mock Supabase in test environment');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser/public operations
export const supabase = isTestEnvironment 
  ? mockSupabase as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined
      }
    })

// Admin client for server-side operations (if service role key is provided)
export const supabaseAdmin = isTestEnvironment
  ? (mockSupabase as any) // Use mock for admin operations too in test environment
  : supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Database types for Supabase schema
export interface Database {
  public: {
    Tables: {
      subscribers: {
        Row: {
          id: string
          email: string
          confirmed: boolean
          confirmation_token: string | null
          unsubscribe_token: string | null
          created_at: string
          confirmed_at: string | null
          unsubscribed_at: string | null
          email_sent: boolean
        }
        Insert: {
          id?: string
          email: string
          confirmed?: boolean
          confirmation_token?: string | null
          unsubscribe_token?: string | null
          created_at?: string
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          email_sent?: boolean
        }
        Update: {
          id?: string
          email?: string
          confirmed?: boolean
          confirmation_token?: string | null
          unsubscribe_token?: string | null
          created_at?: string
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          email_sent?: boolean
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description_short: string
          description_long: string
          status: 'idea' | 'development' | 'live' | 'archived'
          tech_stack: string[]
          subdomain_url: string
          github_url: string
          screenshot_url: string | null
          created_date: string
          featured: boolean
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          description_short: string
          description_long: string
          status: 'idea' | 'development' | 'live' | 'archived'
          tech_stack: string[]
          subdomain_url: string
          github_url: string
          screenshot_url?: string | null
          created_date: string
          featured?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description_short?: string
          description_long?: string
          status?: 'idea' | 'development' | 'live' | 'archived'
          tech_stack?: string[]
          subdomain_url?: string
          github_url?: string
          screenshot_url?: string | null
          created_date?: string
          featured?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Typed Supabase client
export type SupabaseClient = typeof supabase
export type SupabaseAdmin = typeof supabaseAdmin
