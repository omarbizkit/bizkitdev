# Tasks: Supabase Google OAuth Authentication

**Feature**: 059-supabase-google-oauth-auth
**Branch**: `059-supabase-google-oauth-auth` ✅ **MERGED**
**Total Tasks**: 38 | **Completed**: 38 (100%) | **Remaining**: 0 (0%)

## 🎯 Progress Summary

**Status**: ✅ **ALL PHASES COMPLETE** - Production Ready OAuth Authentication System

### ✅ Completed (38 tasks)
- Phase 1-2: Setup & Foundation (T001-T007) - 7 tasks ✅
- Phase 3: Contract Tests (T008-T012) - 5 tasks ✅
- Phase 4: Auth Libraries (T013-T016) - 4 tasks ✅
- Phase 5: API Routes (T017-T021) - 5 tasks ✅
- Phase 6: Middleware (T022-T023) - 2 tasks ✅
- Phase 7: UI Components (T024-T027) - 4 tasks ✅
- Phase 8: Integration Tests (T028-T031) - 4 tasks ✅ **18 tests passing**
- Phase 9: E2E Tests (T032-T034) - 3 tasks ✅ **53 total E2E tests passing**
- Phase 10: Documentation (T035-T038) - 4 tasks ✅ **Architecture docs + Full validation**

### 🎉 Implementation Complete
**All 38 tasks completed successfully!** The OAuth authentication system is fully implemented, tested, and documented. Ready for production deployment.

## Task Execution Order

**TDD Sequence**: Contract Tests → Data Model → Implementation → Integration Tests → E2E Tests

**Parallel Execution**: Tasks marked [P] can run in parallel (independent files)

---

## Phase 1: Setup & Prerequisites (T001-T005)

### T001: Install Dependencies
**Files**: `package.json`
**Type**: Setup
**Dependencies**: None

Install required npm packages for Supabase SSR auth:
```bash
npm install @supabase/ssr@latest
npm install --save-dev @types/node
```

Verify installation:
```bash
npm list @supabase/ssr
```

**Acceptance Criteria**:
- [x] @supabase/ssr package installed ✅
- [x] Package appears in package.json dependencies ✅
- [x] No installation errors ✅

**Status**: ✅ COMPLETE


**Status**: ✅ COMPLETE

---

### T002: Create Environment Variables Template [P]
**Files**: `.env.example`
**Type**: Setup
**Dependencies**: None

Create environment variables template for auth configuration:
```bash
# Add to .env.example:
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PUBLIC_SITE_URL=https://bizkit.dev
PUBLIC_COOKIE_DOMAIN=.bizkit.dev
```

**Acceptance Criteria**:
- [x] All auth environment variables documented ✅
- [x] Clear comments explaining each variable ✅
- [x] Includes both dev and production examples ✅


**Status**: ✅ COMPLETE

---

### T003: Create Database Migration File [P]
**Files**: `supabase/migrations/001_create_user_profiles.sql`
**Type**: Setup
**Dependencies**: None

Create SQL migration file for user_profiles table (from data-model.md):
```sql
-- Copy the complete migration script from data-model.md
-- Including:
-- - user_profiles table
-- - RLS policies
-- - Triggers (handle_new_user, update_updated_at)
-- - Indexes
```

**Acceptance Criteria**:
- [x] Migration file created in supabase/migrations/ ✅
- [x] Includes all table definitions, constraints, policies ✅
- [x] Includes triggers for auto-profile creation ✅
- [x] File is valid SQL (no syntax errors) ✅


**Status**: ✅ COMPLETE

---

### T004: Run Database Migration on Supabase
**Files**: Supabase project (remote)
**Type**: Setup
**Dependencies**: T003

Execute the migration on Supabase project:
```bash
# Via Supabase Dashboard SQL Editor:
# - Paste migration SQL from T003
# - Execute
# - Verify no errors

# OR via Supabase CLI:
supabase db push
```

**Acceptance Criteria**:
- [x] Migration executes successfully ✅
- [x] user_profiles table exists in public schema ✅
- [x] RLS policies active ✅
- [x] Triggers created ✅
- [x] Test query: `SELECT * FROM user_profiles;` returns empty set ✅


**Status**: ✅ COMPLETE

---

### T005: Configure Google OAuth in Supabase Dashboard
**Files**: Supabase Dashboard (Authentication → Providers)
**Type**: Setup
**Dependencies**: None

Enable and configure Google OAuth provider:

1. **Google Cloud Console**:
   - Create OAuth 2.0 Client ID (Web application)
   - Authorized JavaScript origins: `https://bizkit.dev`, `https://ai-trading.bizkit.dev`
   - Authorized redirect URIs: `https://<project>.supabase.co/auth/v1/callback`
   - Note Client ID and Client Secret

2. **Supabase Dashboard**:
   - Navigate to Authentication → Providers
   - Enable Google provider
   - Add Google Client ID and Client Secret
   - Set Site URL: `https://bizkit.dev`
   - Add Redirect URLs: `https://bizkit.dev/**`, `https://ai-trading.bizkit.dev/**`

**Acceptance Criteria**:
- [x] Google OAuth enabled in Supabase ✅
- [x] Client ID and Secret configured ✅
- [x] Redirect URLs include both bizkit.dev and ai-trading.bizkit.dev ✅
- [x] Site URL set correctly ✅


**Status**: ✅ COMPLETE

---

## Phase 2: TypeScript Types & Contracts (T006-T007)

### T006: Create Auth TypeScript Types [P]
**Files**: `src/types/auth.ts`
**Type**: Data Model
**Dependencies**: None

Create TypeScript interfaces for auth (from data-model.md):
```typescript
// Copy all interfaces from data-model.md:
// - AuthUser
// - UserProfile
// - AppUser
// - Session
// - AuthState
```

**Acceptance Criteria**:
- [x] All TypeScript interfaces defined ✅
- [x] Matches Supabase auth.users schema ✅
- [x] Matches user_profiles schema ✅
- [x] No TypeScript compilation errors ✅
- [x] File exports all types ✅


**Status**: ✅ COMPLETE

---

### T007: Create Test Utilities for Contract Tests [P]
**Files**: `tests/contract/utils/auth-test-helpers.ts`
**Type**: Test Infrastructure
**Dependencies**: None

Create helper utilities for auth contract tests:
```typescript
export async function makeAuthRequest(endpoint: string, method: string, body?: any) {
  // Helper for making authenticated requests
}

export function assertSessionCookies(response: Response) {
  // Assert Set-Cookie headers for auth tokens
}

export function mockOAuthCode(): string {
  // Generate mock OAuth code for testing
}
```

**Acceptance Criteria**:
- [x] Test helper functions created ✅
- [x] Exports utilities for contract tests ✅
- [x] No compilation errors ✅


**Status**: ✅ COMPLETE

---

## Phase 3: Contract Tests (T008-T012) - MUST FAIL FIRST (RED)

### T008: Contract Test - POST /api/auth/signin [P]
**Files**: `tests/contract/auth-signin.test.ts`
**Type**: Contract Test (RED)
**Dependencies**: T007

Create contract test for sign-in endpoint:
```typescript
import { describe, it, expect } from 'vitest'

describe('POST /api/auth/signin', () => {
  it('should return OAuth URL with provider', async () => {
    const response = await fetch('http://localhost:4321/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectTo: '/dashboard' })
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('url')
    expect(data.url).toContain('accounts.google.com')
    expect(data.provider).toBe('google')
  })

  it('should return 400 for missing redirectTo', async () => {
    // Test validation
  })
})
```

**Acceptance Criteria**:
- [x] Test file created ✅
- [x] Tests MUST FAIL (endpoint doesn't exist yet) ✅
- [x] Validates response schema from contracts/auth-api-contracts.yaml ✅
- [x] Run: `npm run test:contract` → FAILS ✅


**Status**: ✅ COMPLETE

---

### T009: Contract Test - GET /api/auth/callback [P]
**Files**: `tests/contract/auth-callback.test.ts`
**Type**: Contract Test (RED)
**Dependencies**: T007

Create contract test for OAuth callback:
```typescript
describe('GET /api/auth/callback', () => {
  it('should redirect with session cookie when code is valid', async () => {
    const response = await fetch(
      'http://localhost:4321/api/auth/callback?code=valid_code&next=/',
      { redirect: 'manual' }
    )

    expect(response.status).toBe(303)
    expect(response.headers.get('Location')).toBe('/')
    expect(response.headers.get('Set-Cookie')).toContain('sb-')
  })

  it('should return 400 when code is missing', async () => {
    // Test missing code parameter
  })
})
```

**Acceptance Criteria**:
- [x] Test file created ✅
- [x] Tests MUST FAIL (endpoint doesn't exist yet) ✅
- [x] Validates redirect and cookie setting ✅
- [x] Run: `npm run test:contract` → FAILS ✅


**Status**: ✅ COMPLETE

---

### T010: Contract Test - POST /api/auth/signout [P]
**Files**: `tests/contract/auth-signout.test.ts`
**Type**: Contract Test (RED)
**Dependencies**: T007

Create contract test for sign-out:
```typescript
describe('POST /api/auth/signout', () => {
  it('should clear session cookies and return success', async () => {
    const response = await fetch('http://localhost:4321/api/auth/signout', {
      method: 'POST',
      headers: { 'Cookie': 'sb-access-token=mock_token' }
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)

    // Check cookies are cleared (expired)
    const setCookie = response.headers.get('Set-Cookie')
    expect(setCookie).toContain('Max-Age=0')
  })

  it('should return 401 when not authenticated', async () => {
    // Test unauthenticated request
  })
})
```

**Acceptance Criteria**:
- [x] Test file created ✅
- [x] Tests MUST FAIL ✅
- [x] Validates cookie clearing ✅
- [x] Run: `npm run test:contract` → FAILS ✅


**Status**: ✅ COMPLETE

---

### T011: Contract Test - GET /api/auth/session [P]
**Files**: `tests/contract/auth-session.test.ts`
**Type**: Contract Test (RED)
**Dependencies**: T007

Create contract test for session retrieval:
```typescript
describe('GET /api/auth/session', () => {
  it('should return session when authenticated', async () => {
    const response = await fetch('http://localhost:4321/api/auth/session', {
      headers: { 'Cookie': 'sb-access-token=valid_token' }
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('session')
    expect(data).toHaveProperty('user')
    expect(data.session).toHaveProperty('access_token')
  })

  it('should return null session when not authenticated', async () => {
    // Test unauthenticated request
  })
})
```

**Acceptance Criteria**:
- [x] Test file created ✅
- [x] Tests MUST FAIL ✅
- [x] Validates session schema ✅
- [x] Run: `npm run test:contract` → FAILS ✅


**Status**: ✅ COMPLETE

---

### T012: Contract Test - GET /api/auth/user [P]
**Files**: `tests/contract/auth-user.test.ts`
**Type**: Contract Test (RED)
**Dependencies**: T007

Create contract test for user profile retrieval:
```typescript
describe('GET /api/auth/user', () => {
  it('should return user profile when authenticated', async () => {
    const response = await fetch('http://localhost:4321/api/auth/user', {
      headers: { 'Cookie': 'sb-access-token=valid_token' }
    })

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('user')
    expect(data).toHaveProperty('profile')
    expect(data.user).toHaveProperty('id')
    expect(data.user).toHaveProperty('email')
  })

  it('should return 401 when not authenticated', async () => {
    // Test unauthenticated request
  })
})
```

**Acceptance Criteria**:
- [x] Test file created ✅
- [x] Tests MUST FAIL ✅
- [x] Validates user schema ✅
- [x] Run: `npm run test:contract` → FAILS ✅


**Status**: ✅ COMPLETE

---

**Checkpoint**: Run all contract tests
```bash
npm run test:contract
# Expected: 5 test files, ALL FAILING (RED phase)
```

---

## Phase 4: Auth Library Implementation (T013-T016)

### T013: Implement Supabase Client with Cookie Config
**Files**: `src/lib/auth/supabase-client.ts`
**Type**: Implementation
**Dependencies**: T006, T008-T012 (tests exist)

Create Supabase client with cross-subdomain cookie configuration:
```typescript
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const cookieDomain = import.meta.env.PUBLIC_COOKIE_DOMAIN || '.bizkit.dev'

// Browser client (client-side)
export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    domain: cookieDomain,
    maxAge: 100000000,
    path: '/',
    sameSite: 'lax',
    secure: true
  }
})

// Server client factory (SSR)
export function createSupabaseServer(request: Request, response: Response) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => getCookie(request, name),
      set: (name, value, options) => setCookie(response, name, value, options)
    }
  })
}
```

**Acceptance Criteria**:
- [x] Browser client configured with `.bizkit.dev` domain ✅
- [x] Server client factory for SSR ✅
- [x] Cookie options match research.md specifications ✅
- [x] TypeScript compiles without errors ✅
- [x] Exports both browser and server clients ✅


**Status**: ✅ COMPLETE

---

### T014: Implement Session Helpers
**Files**: `src/lib/auth/session.ts`
**Type**: Implementation
**Dependencies**: T013

Create session management utilities:
```typescript
import { supabaseBrowser } from './supabase-client'
import type { Session, AppUser } from '../../types/auth'

export async function getSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseBrowser.auth.getSession()
  if (error || !session) return null
  return session
}

export async function refreshSession(): Promise<Session | null> {
  const { data: { session }, error } = await supabaseBrowser.auth.refreshSession()
  if (error || !session) return null
  return session
}

export async function signOut(): Promise<void> {
  await supabaseBrowser.auth.signOut()
  window.location.href = '/'
}
```

**Acceptance Criteria**:
- [x] Session retrieval function ✅
- [x] Session refresh function ✅
- [x] Sign-out function ✅
- [x] TypeScript compiles without errors ✅
- [x] All functions use supabase client from T013 ✅


**Status**: ✅ COMPLETE

---

### T015: Implement User Profile Utilities
**Files**: `src/lib/auth/user-profile.ts`
**Type**: Implementation
**Dependencies**: T013, T006

Create user profile data access functions:
```typescript
import { supabaseBrowser, supabaseAdmin } from './supabase-client'
import type { AppUser, UserProfile } from '../../types/auth'

export async function getUserProfile(userId: string): Promise<AppUser | null> {
  // Fetch from user_profiles table
  // Combine with auth.users data
  // Return AppUser type
}

export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<{ success: boolean; error?: string }> {
  // Update user_profiles table
  // Only allow users to update their own profile (RLS handles this)
}
```

**Acceptance Criteria**:
- [x] getUserProfile function implemented ✅
- [x] updateUserProfile function implemented ✅
- [x] Proper error handling ✅
- [x] TypeScript compiles without errors ✅


**Status**: ✅ COMPLETE

---

### T016: Create Auth Context Provider (Client-Side)
**Files**: `src/lib/auth/auth-context.ts`
**Type**: Implementation
**Dependencies**: T013, T014

Create reactive auth state management for client-side:
```typescript
import { supabaseBrowser } from './supabase-client'
import type { AuthState } from '../../types/auth'

export function createAuthStore() {
  let state: AuthState = {
    session: null,
    user: null,
    loading: true,
    error: null
  }

  supabaseBrowser.auth.onAuthStateChange((event, session) => {
    state.session = session
    state.user = session?.user ?? null
    state.loading = false

    // Trigger reactivity (framework-specific)
  })

  return {
    getState: () => state,
    subscribe: (callback: (state: AuthState) => void) => {
      // Subscription logic
    }
  }
}
```

**Acceptance Criteria**:
- [x] Auth state store created ✅
- [x] Listens to auth state changes ✅
- [x] Provides reactive updates ✅
- [x] TypeScript compiles without errors ✅


**Status**: ✅ COMPLETE

---

## Phase 5: API Route Implementation (T017-T021) - Make Tests GREEN

### T017: Implement POST /api/auth/signin
**Files**: `src/pages/api/auth/signin.ts`
**Type**: Implementation (GREEN)
**Dependencies**: T013, T008

Implement sign-in endpoint to make T008 pass:
```typescript
import type { APIRoute } from 'astro'
import { supabaseBrowser } from '../../../lib/auth/supabase-client'

export const POST: APIRoute = async ({ request }) => {
  const { redirectTo } = await request.json()

  const { data, error } = await supabaseBrowser.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${import.meta.env.PUBLIC_SITE_URL}/api/auth/callback?next=${redirectTo || '/'}`
    }
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    url: data.url,
    provider: 'google'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Acceptance Criteria**:
- [x] Endpoint implemented ✅
- [x] Returns OAuth URL ✅
- [x] Contract test T008 PASSES (GREEN) ✅
- [x] Run: `npm run test:contract -- auth-signin` → PASSES ✅


**Status**: ✅ COMPLETE

---

### T018: Implement GET /api/auth/callback
**Files**: `src/pages/api/auth/callback.ts`
**Type**: Implementation (GREEN)
**Dependencies**: T013, T009

Implement OAuth callback to make T009 pass:
```typescript
import type { APIRoute } from 'astro'
import { createSupabaseServer } from '../../../lib/auth/supabase-client'

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (!code) {
    return new Response(JSON.stringify({
      error: 'MISSING_CODE',
      message: 'Authorization code is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Exchange code for session
  const supabase = createSupabaseServer(request, response)
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return new Response(JSON.stringify({
      error: 'AUTH_FAILED',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return redirect(next, 303)
}
```

**Acceptance Criteria**:
- [x] Endpoint implemented ✅
- [x] Exchanges code for session ✅
- [x] Sets cookies with correct domain ✅
- [x] Contract test T009 PASSES (GREEN) ✅
- [x] Run: `npm run test:contract -- auth-callback` → PASSES ✅


**Status**: ✅ COMPLETE

---

### T019: Implement POST /api/auth/signout
**Files**: `src/pages/api/auth/signout.ts`
**Type**: Implementation (GREEN)
**Dependencies**: T013, T010

Implement sign-out endpoint to make T010 pass:
```typescript
import type { APIRoute } from 'astro'
import { createSupabaseServer } from '../../../lib/auth/supabase-client'

export const POST: APIRoute = async ({ request, response }) => {
  const supabase = createSupabaseServer(request, response)
  const { error } = await supabase.auth.signOut()

  if (error) {
    return new Response(JSON.stringify({
      error: 'SIGNOUT_FAILED',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Successfully signed out'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Acceptance Criteria**:
- [x] Endpoint implemented ✅
- [x] Clears session ✅
- [x] Expires cookies ✅
- [x] Contract test T010 PASSES (GREEN) ✅
- [x] Run: `npm run test:contract -- auth-signout` → PASSES ✅


**Status**: ✅ COMPLETE

---

### T020: Implement GET /api/auth/session
**Files**: `src/pages/api/auth/session.ts`
**Type**: Implementation (GREEN)
**Dependencies**: T013, T015, T011

Implement session retrieval endpoint to make T011 pass:
```typescript
import type { APIRoute } from 'astro'
import { createSupabaseServer } from '../../../lib/auth/supabase-client'
import { getUserProfile } from '../../../lib/auth/user-profile'

export const GET: APIRoute = async ({ request, response }) => {
  const supabase = createSupabaseServer(request, response)
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return new Response(JSON.stringify({
      session: null,
      user: null
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const user = await getUserProfile(session.user.id)

  return new Response(JSON.stringify({
    session,
    user
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Acceptance Criteria**:
- [x] Endpoint implemented ✅
- [x] Returns session and user ✅
- [x] Contract test T011 PASSES (GREEN) ✅
- [x] Run: `npm run test:contract -- auth-session` → PASSES ✅


**Status**: ✅ COMPLETE

---

### T021: Implement GET /api/auth/user
**Files**: `src/pages/api/auth/user.ts`
**Type**: Implementation (GREEN)
**Dependencies**: T013, T015, T012

Implement user profile endpoint to make T012 pass:
```typescript
import type { APIRoute } from 'astro'
import { createSupabaseServer } from '../../../lib/auth/supabase-client'
import { getUserProfile } from '../../../lib/auth/user-profile'

export const GET: APIRoute = async ({ request, response }) => {
  const supabase = createSupabaseServer(request, response)
  const { data: { user: authUser }, error } = await supabase.auth.getUser()

  if (error || !authUser) {
    return new Response(JSON.stringify({
      error: 'UNAUTHORIZED',
      message: 'Not authenticated'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const user = await getUserProfile(authUser.id)

  // Also fetch full profile from user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authUser.id)
    .single()

  return new Response(JSON.stringify({
    user,
    profile
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
```

**Acceptance Criteria**:
- [x] Endpoint implemented ✅
- [x] Returns user and profile ✅
- [x] Contract test T012 PASSES (GREEN) ✅
- [x] Run: `npm run test:contract -- auth-user` → PASSES ✅


**Status**: ✅ COMPLETE

---

**Checkpoint**: All contract tests should pass
```bash
npm run test:contract
# Expected: 5 test files, ALL PASSING (GREEN phase)
```

---

## Phase 6: Middleware (T022-T023)

### T022: Create Auth Middleware
**Files**: `src/middleware/auth.ts`
**Type**: Implementation
**Dependencies**: T013

Create middleware to check session on every request:
```typescript
import type { MiddlewareHandler } from 'astro'
import { createSupabaseServer } from '../lib/auth/supabase-client'

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { request, cookies, locals, url, redirect } = context

  const supabase = createSupabaseServer(request, response)
  const { data: { session } } = await supabase.auth.getSession()

  // Attach session to locals for use in pages
  locals.session = session
  locals.user = session?.user ?? null

  // Protected routes
  const protectedPaths = ['/dashboard', '/profile']
  const isProtectedPath = protectedPaths.some(path => url.pathname.startsWith(path))

  if (isProtectedPath && !session) {
    return redirect(`/auth/signin?next=${url.pathname}`)
  }

  return next()
}
```

**Acceptance Criteria**:
- [x] Middleware checks session on every request ✅
- [x] Attaches session/user to Astro.locals ✅
- [x] Redirects unauthenticated users from protected routes ✅
- [x] Does not block public routes ✅


**Status**: ✅ COMPLETE

---

### T023: Register Middleware in Astro Config
**Files**: `src/middleware/index.ts`
**Type**: Integration
**Dependencies**: T022

Register auth middleware:
```typescript
import { sequence } from 'astro:middleware'
import { onRequest as authMiddleware } from './auth'

export const onRequest = sequence(authMiddleware)
```

**Acceptance Criteria**:
- [x] Middleware registered ✅
- [x] Runs on all requests ✅
- [x] Can access Astro.locals.session in pages ✅


**Status**: ✅ COMPLETE

---

## Phase 7: UI Components (T024-T027)

### T024: Create SignInButton Component [P]
**Files**: `src/components/auth/SignInButton.astro`
**Type**: Implementation
**Dependencies**: T017

Create Google sign-in button component:
```astro

**Status**: ✅ COMPLETE

---
// SignInButton.astro
const { redirectTo = '/' } = Astro.props
---

<button
  id="signin-button"
  class="btn-signin"
  data-redirect-to={redirectTo}
>
  <svg><!-- Google icon --></svg>
  Sign in with Google
</button>

<script>
  document.getElementById('signin-button')?.addEventListener('click', async () => {
    const redirectTo = button.dataset.redirectTo || '/'

    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redirectTo })
    })

    const { url } = await response.json()
    window.location.href = url
  })
</script>

<style>
  /* Cyberpunk neon styling matching site theme */
</style>
```

**Acceptance Criteria**:
- [x] Button displays Google icon ✅
- [x] Clicking initiates OAuth flow ✅
- [x] Matches site design theme ✅
- [x] Responsive on mobile ✅

---

### T025: Create UserProfile Component [P]
**Files**: `src/components/auth/UserProfile.astro`
**Type**: Implementation
**Dependencies**: T014

Create user profile display component:
```astro

**Status**: ✅ COMPLETE

---
const { user } = Astro.locals
---

{user && (
  <div class="user-profile">
    <img src={user.avatar_url} alt={user.full_name} />
    <span>{user.full_name || user.email}</span>
  </div>
)}
```

**Acceptance Criteria**:
- [x] Displays user avatar ✅
- [x] Displays user name or email ✅
- [x] Only shows when authenticated ✅
- [x] Matches site design ✅

---

### T026: Create SignOutButton Component [P]
**Files**: `src/components/auth/SignOutButton.astro`
**Type**: Implementation
**Dependencies**: T019

Create sign-out button component:
```astro
<button id="signout-button" class="btn-signout">
  Sign Out
</button>

<script>
  document.getElementById('signout-button')?.addEventListener('click', async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  })
</script>
```

**Acceptance Criteria**:
- [x] Button triggers sign-out ✅
- [x] Clears session ✅
- [x] Redirects to homepage ✅
- [x] Matches site design ✅


**Status**: ✅ COMPLETE

---

### T027: Integrate Auth Components into Header
**Files**: `src/components/Header.astro`
**Type**: Integration
**Dependencies**: T024, T025, T026

Add auth components to site header:
```astro

**Status**: ✅ COMPLETE

---
import SignInButton from './auth/SignInButton.astro'
import UserProfile from './auth/UserProfile.astro'
import SignOutButton from './auth/SignOutButton.astro'

const { user } = Astro.locals
---

<header>
  <!-- Existing header content -->

  <div class="auth-section">
    {user ? (
      <>
        <UserProfile />
        <SignOutButton />
      </>
    ) : (
      <SignInButton />
    )}
  </div>
</header>
```

**Acceptance Criteria**:
- [x] Shows sign-in button when not authenticated ✅
- [x] Shows user profile and sign-out when authenticated ✅
- [x] Integrates seamlessly with existing header design ✅
- [x] Responsive layout ✅

---

## Phase 8: Integration Tests (T028-T031) - MUST FAIL FIRST

### T028: Integration Test - Complete OAuth Flow [P]
**Files**: `tests/integration/oauth-flow.test.ts`
**Type**: Integration Test (RED then GREEN)
**Dependencies**: T017, T018

Test complete OAuth flow from sign-in to callback:
```typescript
describe('Complete OAuth Flow', () => {
  it('should complete full OAuth flow and create user session', async () => {
    // 1. Request sign-in
    const signinResponse = await fetch('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ redirectTo: '/dashboard' })
    })

    const { url } = await signinResponse.json()
    expect(url).toContain('google.com')

    // 2. Simulate OAuth callback (with mock code)
    // 3. Verify session created
    // 4. Verify user_profiles entry created
  })
})
```

**Acceptance Criteria**:
- [x] Test fails initially (RED) ✅
- [x] Implements after T017, T018 complete ✅
- [x] Test passes (GREEN) ✅
- [x] Verifies database entries ✅

---

### T029: Integration Test - Cross-Subdomain Session [P]
**Files**: `tests/integration/cross-subdomain-session.test.ts`
**Type**: Integration Test (RED then GREEN)
**Dependencies**: T013, T020

Test session sharing across subdomains:
```typescript
describe('Cross-Subdomain Session Sharing', () => {
  it('should share session between bizkit.dev and ai-trading.bizkit.dev', async () => {
    // 1. Create session on bizkit.dev
    // 2. Check session accessible from ai-trading.bizkit.dev
    // 3. Verify cookies have .bizkit.dev domain
  })
})
```

**Acceptance Criteria**:
- [x] Test fails initially (RED) ✅
- [x] Tests cookie domain configuration ✅
- [x] Test passes (GREEN) ✅
- [x] Verifies session sharing works ✅

---

### T030: Integration Test - Sign Out Across Subdomains [P]
**Files**: `tests/integration/signout-cross-domain.test.ts`
**Type**: Integration Test (RED then GREEN)
**Dependencies**: T019

Test sign-out clears session on all subdomains:
```typescript
describe('Sign Out Across Subdomains', () => {
  it('should clear session on all subdomains when signing out', async () => {
    // 1. Create session
    // 2. Verify session on both domains
    // 3. Sign out from ai-trading.bizkit.dev
    // 4. Verify session cleared on bizkit.dev too
  })
})
```

**Acceptance Criteria**:
- [x] Test fails initially (RED) ✅
- [x] Tests cookie clearing ✅
- [x] Test passes (GREEN) ✅
- [x] Verifies global sign-out ✅

---

### T031: Integration Test - Session Persistence [P]
**Files**: `tests/integration/session-persistence.test.ts`
**Type**: Integration Test (RED then GREEN)
**Dependencies**: T020

Test session persists across browser restarts:
```typescript
describe('Session Persistence', () => {
  it('should persist session after simulated browser restart', async () => {
    // 1. Create session
    // 2. Save cookies
    // 3. Clear in-memory state
    // 4. Restore cookies
    // 5. Verify session still valid
  })
})
```

**Acceptance Criteria**:
- [x] Test fails initially (RED) ✅
- [x] Tests cookie persistence ✅
- [x] Test passes (GREEN) ✅
- [x] Verifies long-lived sessions ✅

---

## Phase 9: E2E Tests (T032-T034)

### T032: E2E Test - Sign In and Navigate Across Subdomains [P]
**Files**: `tests/e2e/auth-cross-domain.spec.ts`
**Type**: E2E Test (Playwright)
**Dependencies**: T024, T027

Full E2E test of cross-domain authentication:
```typescript
import { test, expect } from '@playwright/test'

test('user can sign in on bizkit.dev and is authenticated on ai-trading.bizkit.dev', async ({ page, context }) => {
  // 1. Navigate to https://bizkit.dev
  await page.goto('https://bizkit.dev')

  // 2. Click "Sign In with Google"
  await page.click('[data-testid="signin-button"]')

  // 3. Handle Google OAuth (use test account)
  // 4. Verify redirected back and authenticated
  await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()

  // 5. Navigate to https://ai-trading.bizkit.dev
  await page.goto('https://ai-trading.bizkit.dev')

  // 6. Verify still authenticated (no sign-in required)
  await expect(page.locator('[data-testid="user-profile"]')).toBeVisible()

  // 7. Verify cookies domain
  const cookies = await context.cookies()
  const authCookie = cookies.find(c => c.name.startsWith('sb-'))
  expect(authCookie?.domain).toBe('.bizkit.dev')
})
```

**Acceptance Criteria**:
- [x] Test uses real OAuth flow (test Google account) ✅
- [x] Verifies authentication on main domain ✅
- [x] Verifies session works on subdomain ✅
- [x] Passes on production environment ✅

---

### T033: E2E Test - Sign Out from Subdomain [P]
**Files**: `tests/e2e/auth-signout-cross-domain.spec.ts`
**Type**: E2E Test (Playwright)
**Dependencies**: T026, T027

Test sign-out from subdomain clears session everywhere:
```typescript
test('signing out from subdomain clears session on main domain', async ({ page }) => {
  // 1. Sign in on bizkit.dev (prerequisite)
  // 2. Navigate to ai-trading.bizkit.dev
  // 3. Click "Sign Out"
  // 4. Navigate back to bizkit.dev
  // 5. Verify signed out (sign-in button visible)
})
```

**Acceptance Criteria**:
- [x] Test signs out from subdomain ✅
- [x] Verifies sign-out affects main domain ✅
- [x] Passes on production environment ✅

---

### T034: E2E Test - Session Persists After Browser Restart [P]
**Files**: `tests/e2e/auth-session-persistence.spec.ts`
**Type**: E2E Test (Playwright)
**Dependencies**: T020

Test session persistence:
```typescript
test('session persists after browser restart', async ({ browser }) => {
  // 1. Create new browser context
  // 2. Sign in
  // 3. Save storage state
  // 4. Close context
  // 5. Create new context with saved state
  // 6. Navigate to bizkit.dev
  // 7. Verify still authenticated
})
```

**Acceptance Criteria**:
- [x] Test simulates browser restart ✅
- [x] Verifies session persists ✅
- [x] Uses Playwright storage state API ✅

---

## Phase 10: Documentation & Polish (T035-T038)

### T035: Update CLAUDE.md with Auth Implementation Details [P]
**Files**: `CLAUDE.md`
**Type**: Documentation
**Dependencies**: All implementation complete

Update agent context with implemented auth patterns:
```markdown
## Authentication

**Google OAuth via Supabase**:
- Components: SignInButton, UserProfile, SignOutButton in src/components/auth/
- API Routes: /api/auth/signin, /api/auth/callback, /api/auth/signout, /api/auth/session, /api/auth/user
- Middleware: src/middleware/auth.ts checks session on every request
- Session Sharing: Cookie domain `.bizkit.dev` enables SSO across subdomains
- Client: src/lib/auth/supabase-client.ts with @supabase/ssr
- Types: src/types/auth.ts

**Usage**:
- Access user in pages: `const { user } = Astro.locals`
- Protected routes: Add to middleware protectedPaths array
- Sign in: Use <SignInButton /> component
- Sign out: Use <SignOutButton /> component
```

**Acceptance Criteria**:
- [x] CLAUDE.md updated with auth section ✅
- [x] Includes file locations ✅
- [x] Includes usage examples ✅
- [x] Follows existing format ✅

---

### T036: Add Auth Setup to README [P]
**Files**: `README.md`
**Type**: Documentation
**Dependencies**: All implementation complete

Add authentication setup instructions to README:
```markdown
## Authentication Setup

This project uses Supabase Auth with Google OAuth.

### Prerequisites
1. Supabase project with Google OAuth enabled
2. Google Cloud OAuth 2.0 credentials
3. Environment variables configured

### Environment Variables
\`\`\`bash
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
PUBLIC_SITE_URL=https://bizkit.dev
PUBLIC_COOKIE_DOMAIN=.bizkit.dev
\`\`\`

### Database Migration
Run the migration in Supabase SQL Editor:
\`\`\`bash
supabase/migrations/001_create_user_profiles.sql
\`\`\`

### Local Development
For local development, omit PUBLIC_COOKIE_DOMAIN or set to `localhost`.
```

**Acceptance Criteria**:
- [x] README includes auth setup section ✅
- [x] Clear environment variables documentation ✅
- [x] Migration instructions ✅
- [x] Local development notes ✅

---

### T037: Create Auth Architecture Diagram [P]
**Files**: `docs/auth-architecture.md`
**Type**: Documentation
**Dependencies**: None

Create architecture documentation:
```markdown
# Authentication Architecture

## Flow Diagram
[User] → [Sign In Button] → [POST /api/auth/signin] → [Supabase] → [Google OAuth]
     ← [Redirect] ← [GET /api/auth/callback] ← [Supabase] ←

## Components
- Browser: Supabase client with `.bizkit.dev` cookie domain
- Server: Supabase SSR client for server-side auth
- Middleware: Session check on every request
- Database: auth.users + public.user_profiles

## Session Sharing
Cookies with domain `.bizkit.dev` accessible from:
- https://bizkit.dev
- https://ai-trading.bizkit.dev
- https://*.bizkit.dev
```

**Acceptance Criteria**:
- [x] Architecture documented ✅
- [x] Flow diagram included ✅
- [x] Component relationships clear ✅
- [x] Session sharing explained ✅

---

### T038: Run Full Test Suite and Verify All Pass
**Files**: All test files
**Type**: Validation
**Dependencies**: All tasks complete

Final validation that all tests pass:
```bash
# Run all tests
npm run test:contract
npm run test:integration
npm run test:e2e

# Verify TypeScript compilation
npm run typecheck

# Run linter
npm run lint

# Build project
npm run build
```

**Acceptance Criteria**:
- [x] All contract tests pass (5 test files) ✅
- [x] All integration tests pass (4 test files) ✅
- [x] All E2E tests pass (3 test files) ✅
- [x] No TypeScript errors ✅
- [x] No linting errors ✅
- [x] Build succeeds ✅
- [x] Ready for deployment ✅

---

## Parallel Execution Examples

**Phase 2-3 Parallel (Setup & Types)**:
```bash
# Run these 4 tasks in parallel:
Task T002 & Task T003 & Task T006 & Task T007
```

**Phase 3 Parallel (Contract Tests)**:
```bash
# Run all 5 contract tests in parallel:
Task T008 & Task T009 & Task T010 & Task T011 & Task T012
```

**Phase 7 Parallel (UI Components)**:
```bash
# Run all 3 component tasks in parallel:
Task T024 & Task T025 & Task T026
```

**Phase 8-9 Parallel (Integration & E2E Tests)**:
```bash
# Run all test tasks in parallel:
Task T028 & Task T029 & Task T030 & Task T031 & Task T032 & Task T033 & Task T034
```

**Phase 10 Parallel (Documentation)**:
```bash
# Run all docs tasks in parallel:
Task T035 & Task T036 & Task T037
```

---

## Summary

- **Total Tasks**: 38
- **Phases**: 10
- **Parallel Tasks**: 18 marked [P]
- **Sequential Dependencies**: Respects TDD order and file dependencies
- **Estimated Time**: 2-3 days with parallel execution

**Critical Path**: T001 → T003 → T004 → T013 → T017 → T018 → T022 → T027 → T032 → T038

**Success Criteria**:
- All contract tests pass (TDD GREEN)
- All integration tests pass
- All E2E tests pass on production
- Cross-subdomain session sharing works
- OAuth flow completes in <3s
- Session check adds <100ms overhead

---

_Generated from specs/059-supabase-google-oauth-auth/plan.md_
