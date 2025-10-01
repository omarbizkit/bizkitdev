// src/middleware/auth.ts
// Auth middleware to check session on every request

import type { MiddlewareHandler } from 'astro'
import { createServerClient } from '@supabase/ssr'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, redirect, locals, cookies } = context

  try {
    // Create Supabase client with cookie access for middleware
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(key) {
          return cookies.get(key)?.value
        },
        set(key, value, options) {
          cookies.set(key, value, options)
        },
        remove(key, options) {
          cookies.delete(key, options)
        }
      }
    })

    // Get session from Supabase
    const { data: { session } } = await supabase.auth.getSession()

    // Attach session and user to locals for use in pages
    // @ts-ignore - Type augmentation not being picked up by Astro TS server
    locals.session = session
    // @ts-ignore - Type augmentation not being picked up by Astro TS server
    locals.user = session?.user ?? null

    // Define protected routes
    const protectedPaths = ['/dashboard', '/profile']
    const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path))

    // Redirect unauthenticated users from protected routes
    if (isProtectedPath && !session) {
      return redirect(`/auth/signin?next=${url.pathname}`, 302)
    }

    return next()
  } catch {
    // On error, allow request to continue but with no session
    // @ts-ignore - Type augmentation not being picked up by Astro TS server
    locals.session = null
    // @ts-ignore - Type augmentation not being picked up by Astro TS server
    locals.user = null
    return next()
  }
}
