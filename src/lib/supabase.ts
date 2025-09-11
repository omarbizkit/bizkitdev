import { createClient } from '@supabase/supabase-js'

// Supabase configuration from environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for browser/public operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

// Admin client for server-side operations (if service role key is provided)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Database types (will be updated once we create the schema)
export interface Database {
  public: {
    Tables: {
      subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          confirmed: boolean
          active: boolean
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          confirmed?: boolean
          active?: boolean
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          confirmed?: boolean
          active?: boolean
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
