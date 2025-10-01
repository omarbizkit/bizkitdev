# Research: Supabase Google OAuth Authentication

**Feature**: 059-supabase-google-oauth-auth
**Date**: 2025-09-30
**Status**: Complete

## Research Questions

### Q1: How to configure cross-subdomain session sharing in Supabase?

**Decision**: Use cookie domain configuration with `.bizkit.dev` (leading dot)

**Rationale**:
- Supabase client accepts `cookieOptions` parameter during initialization
- Setting `domain: '.bizkit.dev'` makes cookies accessible to all subdomains
- This is a standard browser cookie behavior (RFC 6265)
- Confirmed working solution from Michele Ong blog and Supabase GitHub discussions

**Alternatives Considered**:
1. **Token passing via URL**: Rejected - insecure, poor UX, complex implementation
2. **Separate auth per subdomain**: Rejected - defeats SSO purpose, bad UX
3. **Custom auth proxy**: Rejected - unnecessary complexity, Supabase has built-in solution

**Implementation Pattern**:
```typescript
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  cookieOptions: {
    domain: '.bizkit.dev',  // Key: leading dot for subdomains
    maxAge: 100000000,
    path: '/',
    sameSite: 'lax',
    secure: true
  }
})
```

**References**:
- https://micheleong.com/blog/share-sessions-subdomains-supabase
- https://github.com/orgs/supabase/discussions/5742
- https://github.com/supabase/supabase/issues/473

---

### Q2: Which Supabase package to use for Astro SSR?

**Decision**: Use `@supabase/ssr` for server-side auth, `@supabase/supabase-js` for client-side

**Rationale**:
- `@supabase/ssr` is specifically designed for server-side frameworks
- Provides utilities for cookie management in SSR context
- Handles token refresh on server-side properly
- Astro's SSR requires proper cookie handling on both server and client

**Alternatives Considered**:
1. **Only @supabase/supabase-js**: Rejected - doesn't handle SSR cookies properly
2. **Custom cookie management**: Rejected - reinventing the wheel, error-prone
3. **@supabase/auth-helpers-nextjs**: Rejected - Next.js specific, not for Astro

**Implementation Pattern**:
```typescript
// Server-side (Astro endpoints, middleware)
import { createServerClient } from '@supabase/ssr'

export async function getServerSession(request: Request) {
  return createServerClient(url, key, {
    cookies: {
      get: (name) => getCookie(request, name),
      set: (name, value, options) => setCookie(response, name, value, options)
    }
  })
}

// Client-side (browser)
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(url, key, { cookieOptions })
```

**References**:
- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://github.com/supabase/auth-helpers

---

### Q3: Google OAuth setup requirements?

**Decision**: Use Google Cloud Console OAuth 2.0 with specific configuration for Supabase

**Rationale**:
- Supabase Auth integrates with Google OAuth natively
- Requires OAuth 2.0 client ID from Google Cloud Console
- Must configure authorized domains and redirect URIs
- Supabase handles the OAuth flow, token exchange, and session creation

**Setup Steps**:
1. Google Cloud Console:
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized JavaScript origins: `https://bizkit.dev`, `https://ai-trading.bizkit.dev`
   - Authorized redirect URIs: `https://<supabase-project>.supabase.co/auth/v1/callback`
   - Configure OAuth consent screen (scopes: email, profile)

2. Supabase Dashboard:
   - Enable Google provider in Authentication → Providers
   - Add Google Client ID and Client Secret
   - Configure Site URL: `https://bizkit.dev`
   - Add Redirect URLs: `https://bizkit.dev/**`, `https://ai-trading.bizkit.dev/**`

**Alternatives Considered**:
1. **Firebase Auth**: Rejected - already using Supabase, adds complexity
2. **Custom OAuth implementation**: Rejected - security risks, complex, Supabase handles it
3. **Auth0**: Rejected - additional cost, Supabase Auth is sufficient

**Required Scopes**:
- `openid` (default)
- `email` (user email)
- `profile` (name, picture)

**References**:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://developers.google.com/identity/protocols/oauth2

---

### Q4: How to handle OAuth callbacks in Astro?

**Decision**: Create `/auth/callback` API route to handle OAuth redirects

**Rationale**:
- Google redirects to Supabase, Supabase redirects to our callback URL
- Need server-side route to exchange code for session
- Astro API routes (src/pages/api/auth/callback.ts) handle this
- After session creation, redirect to appropriate page

**Implementation Pattern**:
```typescript
// src/pages/api/auth/callback.ts
export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
      cookies: {
        get: (key) => cookies.get(key)?.value,
        set: (key, value, options) => cookies.set(key, value, options)
      }
    })

    await supabase.auth.exchangeCodeForSession(code)
  }

  return redirect(next, 303)
}
```

**Alternatives Considered**:
1. **Client-side code exchange**: Rejected - not secure, client can't access service role
2. **No callback route**: Rejected - Supabase PKCE flow requires code exchange
3. **Middleware-based handling**: Rejected - API routes clearer, easier to test

**References**:
- https://supabase.com/docs/guides/auth/server-side/oauth-with-pkce-flow-for-ssr

---

### Q5: How to protect routes that require authentication?

**Decision**: Use Astro middleware to check session on protected routes

**Rationale**:
- Astro middleware runs on every request before page render
- Can check Supabase session server-side
- Redirect unauthenticated users to sign-in page
- Attach user session to Astro.locals for use in pages

**Implementation Pattern**:
```typescript
// src/middleware/auth.ts
export const onRequest: MiddlewareHandler = async ({ cookies, locals, redirect, url }, next) => {
  const supabase = createServerClient(url, key, { cookies })
  const { data: { session } } = await supabase.auth.getSession()

  locals.session = session
  locals.user = session?.user ?? null

  // Protected routes
  const protectedPaths = ['/dashboard', '/profile']
  if (protectedPaths.some(path => url.pathname.startsWith(path)) && !session) {
    return redirect('/auth/signin?next=' + url.pathname)
  }

  return next()
}
```

**Alternatives Considered**:
1. **Client-side only protection**: Rejected - can be bypassed, not secure
2. **Per-page protection**: Rejected - DRY violation, easy to forget
3. **HOC pattern**: Rejected - not Astro-idiomatic, middleware is standard

**References**:
- https://docs.astro.build/en/guides/middleware/

---

### Q6: How to handle token refresh across subdomains?

**Decision**: Supabase SDK handles automatic token refresh with shared cookies

**Rationale**:
- Supabase client has `autoRefreshToken: true` by default
- Refresh tokens stored in cookies (same `.bizkit.dev` domain)
- SDK automatically refreshes before expiration
- Works across all subdomains because cookies are shared

**Implementation**:
- Set `autoRefreshToken: true` in Supabase client config (both server and client)
- Ensure refresh token cookie has same domain as access token
- Monitor refresh events for logging/debugging
- Handle refresh failures gracefully (sign out, redirect to login)

**Token Lifetimes**:
- Access token: 1 hour (default)
- Refresh token: 30 days (configurable in Supabase)
- Auto-refresh happens 5 minutes before expiration

**Alternatives Considered**:
1. **Manual token refresh**: Rejected - complex, error-prone, SDK handles it
2. **Short-lived sessions**: Rejected - poor UX, users would need to sign in frequently
3. **No refresh (re-auth)**: Rejected - terrible UX

**References**:
- https://supabase.com/docs/guides/auth/sessions/managing-user-sessions

---

### Q7: How to implement sign-out across all subdomains?

**Decision**: Call `supabase.auth.signOut()` and ensure cookies are cleared with `.bizkit.dev` domain

**Rationale**:
- Supabase `signOut()` revokes refresh token server-side
- Client-side, SDK clears all auth cookies
- Because cookies have `.bizkit.dev` domain, sign-out affects all subdomains
- Must ensure cookie deletion uses same domain as creation

**Implementation Pattern**:
```typescript
// Sign out function
async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Sign out error:', error)
  }

  // Redirect to home
  window.location.href = '/'
}
```

**Testing Strategy**:
- Sign in on bizkit.dev
- Navigate to ai-trading.bizkit.dev (verify authenticated)
- Sign out on ai-trading.bizkit.dev
- Navigate back to bizkit.dev (verify signed out)
- Check cookies in DevTools (should be cleared)

**Alternatives Considered**:
1. **Manual cookie clearing**: Rejected - SDK handles it, manual is error-prone
2. **Sign out from each subdomain**: Rejected - defeats SSO purpose
3. **Session invalidation only**: Rejected - cookies would remain, security issue

**References**:
- https://supabase.com/docs/reference/javascript/auth-signout

---

## Technology Decisions Summary

| Technology | Decision | Purpose |
|------------|----------|---------|
| Auth Provider | Supabase Auth + Google OAuth | Built-in, secure, well-documented |
| Client SDK | @supabase/ssr | SSR support for Astro |
| Cookie Domain | `.bizkit.dev` | Cross-subdomain session sharing |
| OAuth Flow | PKCE (server-side) | Enhanced security for SPAs/SSR |
| Session Storage | HTTPOnly cookies | Secure, automatic, XSS-protected |
| Token Refresh | Automatic (SDK) | Seamless UX, no manual handling |
| Route Protection | Astro middleware | Server-side, secure, centralized |
| User Profile Storage | Supabase auth.users + public.user_profiles | Built-in + custom data |

---

## Security Considerations

1. **HTTPS Required**: All cookies have `secure: true`, won't work over HTTP
2. **HTTPOnly Cookies**: Prevents XSS attacks from stealing tokens
3. **SameSite=Lax**: Prevents CSRF while allowing OAuth redirects
4. **Token Revocation**: Sign-out revokes refresh tokens on Supabase server
5. **Minimal Scopes**: Only request `email` and `profile` from Google
6. **PKCE Flow**: Code Verifier/Challenge prevents authorization code interception
7. **Cookie Expiration**: Cookies have max-age, automatically expire
8. **RLS Policies**: Database-level security for user data

---

## Performance Considerations

1. **Session Check Overhead**: ~20-50ms per request (middleware)
   - Mitigation: Cache session in Astro.locals for single request
   - Mitigation: Skip middleware on public static assets

2. **OAuth Redirect Flow**: ~2-3 seconds total
   - Google consent screen: 1-2s
   - Callback + session creation: 0.5-1s
   - Acceptable for one-time authentication

3. **Token Refresh**: Happens in background, no user impact
   - Triggered 5 minutes before expiration
   - Typically <100ms

4. **Cookie Size**: ~1-2KB for auth cookies
   - Access token: ~800 bytes
   - Refresh token: ~800 bytes
   - Negligible impact on request size

---

## Development vs Production Considerations

### Development (localhost)
- **Domain**: `localhost` (no subdomain sharing possible)
- **Cookie Domain**: Not set (defaults to exact domain)
- **Testing**: Mock OAuth flow or use Supabase local dev
- **HTTPS**: Not required for localhost

### Production (bizkit.dev)
- **Domain**: `.bizkit.dev`
- **Cookie Domain**: `.bizkit.dev` (enables subdomain sharing)
- **Testing**: Full OAuth flow with real Google credentials
- **HTTPS**: Required (cookies won't work without it)

### Environment Variables
```bash
# .env (development)
PUBLIC_SUPABASE_URL=http://localhost:54321
PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key>
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_COOKIE_DOMAIN=localhost

# .env.production (Zeabur)
PUBLIC_SUPABASE_URL=https://<project>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-key>
PUBLIC_SITE_URL=https://bizkit.dev
PUBLIC_COOKIE_DOMAIN=.bizkit.dev
```

---

## Open Questions Resolved

1. ✅ Can Supabase session work across different domains? **YES** - via cookie domain
2. ✅ Do we need separate Supabase projects? **NO** - same project for all subdomains
3. ✅ Will this work with Astro SSR? **YES** - use @supabase/ssr package
4. ✅ How to test OAuth locally? **Use Supabase local dev or test on staging**
5. ✅ Cookie security concerns? **HTTPOnly, Secure, SameSite=Lax handles it**

---

## Next Steps

Phase 1 artifacts to create:
1. **data-model.md**: User profile schema, auth state model
2. **contracts/**: OAuth callback API contract, session API contracts
3. **quickstart.md**: Step-by-step test scenario for OAuth flow
4. **Contract tests**: Tests for OAuth callback, session creation, sign-out

All research questions resolved. Ready for Phase 1 design.
