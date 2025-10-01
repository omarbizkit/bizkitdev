# Authentication Architecture

## Overview

This document describes the Google OAuth authentication system implemented using Supabase Auth with cross-subdomain session sharing across the bizkit.dev ecosystem.

## Flow Diagram

```
User Flow:
[User] → [Sign In Button] → [POST /api/auth/signin] → [Supabase Auth] → [Google OAuth]
     ← [Redirect to /dashboard] ← [GET /api/auth/callback] ← [OAuth Code] ←

Session Check:
[User Request] → [Middleware] → [Check Session] → [Set Astro.locals.user]
                     ↓
              [Supabase SSR]
                     ↓
              [Cookie: .bizkit.dev]

Sign Out:
[User] → [Sign Out Button] → [POST /api/auth/signout] → [Supabase.signOut()]
                                        ↓
                                [Clear Cookies]
                                        ↓
                            [Session Cleared Everywhere]
```

## Components

### Browser Layer
- **Supabase Client**: Browser-side client configured with `.bizkit.dev` cookie domain
- **Location**: `src/lib/auth/supabase-client.ts`
- **Key Feature**: Cookies accessible across all `*.bizkit.dev` subdomains
- **Cookie Names**:
  - `sb-access-token` (HTTPOnly, Secure, SameSite=Lax)
  - `sb-refresh-token` (HTTPOnly, Secure, SameSite=Lax)

### Server Layer
- **Supabase SSR Client**: Server-side client for secure auth operations
- **Location**: `src/lib/auth/supabase-client.ts`
- **Features**:
  - Cookie reading/writing via Astro's cookie API
  - Automatic token refresh
  - Session validation on every request

### Middleware Layer
- **File**: `src/middleware/auth.ts`
- **Execution**: Runs on every request before page render
- **Responsibilities**:
  1. Retrieve session from Supabase SSR client
  2. Set `Astro.locals.user` if authenticated
  3. Protect routes (optional - currently open access)
  4. Handle token refresh automatically

### Database Layer
- **Tables**:
  - `auth.users` (Supabase managed) - Core authentication data
  - `public.user_profiles` (Custom) - Extended user information
- **Migration**: `supabase/migrations/001_create_user_profiles.sql`
- **Trigger**: Automatic profile creation on user signup

## Session Sharing

### Cookie Domain Configuration

Cookies set with domain `.bizkit.dev` are accessible from:
- ✅ `https://bizkit.dev` (main portfolio)
- ✅ `https://ai-trading.bizkit.dev` (trading app)
- ✅ `https://*.bizkit.dev` (any future subdomain)

### How It Works

1. **Sign In on Main Domain**:
   - User visits `https://bizkit.dev`
   - Clicks "Sign In with Google"
   - Redirected to Google OAuth
   - Returns to `https://bizkit.dev/api/auth/callback`
   - Session cookie set with domain `.bizkit.dev`

2. **Navigate to Subdomain**:
   - User visits `https://ai-trading.bizkit.dev`
   - Browser automatically sends `.bizkit.dev` cookies
   - Middleware validates session
   - User is authenticated - no sign-in required!

3. **Sign Out from Any Domain**:
   - User clicks "Sign Out" on any subdomain
   - POST to `/api/auth/signout`
   - Supabase clears session
   - Cookies cleared with domain `.bizkit.dev`
   - User signed out everywhere

### Environment Variables

Critical configuration for cross-subdomain SSO:

```bash
# Production (required for cross-subdomain)
PUBLIC_COOKIE_DOMAIN=.bizkit.dev

# Local Development (omit or set to localhost)
PUBLIC_COOKIE_DOMAIN=localhost
```

## API Routes

### POST /api/auth/signin
**Purpose**: Initiate Google OAuth flow
**Input**: `{ redirectTo?: string }`
**Output**: `{ url: string, provider: 'google' }`
**Flow**:
1. Call `supabase.auth.signInWithOAuth({ provider: 'google' })`
2. Configure redirect to `/api/auth/callback?next={redirectTo}`
3. Return OAuth URL to frontend

### GET /api/auth/callback
**Purpose**: Handle OAuth callback from Google
**Input**: `?code={auth_code}&next={redirect_path}`
**Output**: Redirect to `next` parameter or `/`
**Flow**:
1. Exchange code for session using `supabase.auth.exchangeCodeForSession(code)`
2. Session stored in cookies (domain `.bizkit.dev`)
3. Trigger creates user_profile if first login
4. Redirect user to intended destination

### POST /api/auth/signout
**Purpose**: Sign out user
**Input**: None
**Output**: `{ success: true, message: string }`
**Flow**:
1. Call `supabase.auth.signOut()`
2. Clear session cookies
3. Return success response

### GET /api/auth/session
**Purpose**: Get current session
**Input**: None
**Output**: `{ session: Session | null, user: User | null }`
**Flow**:
1. Get session from Supabase SSR client
2. Return session and user data

### GET /api/auth/user
**Purpose**: Get user profile with extended data
**Input**: None (requires authentication)
**Output**: `{ user: UserProfile }`
**Flow**:
1. Check session via middleware
2. Query `user_profiles` table
3. Return merged user + profile data

## UI Components

### SignInButton.astro
**Location**: `src/components/auth/SignInButton.astro`
**Usage**:
```astro
<SignInButton redirectTo="/dashboard" />
```
**Behavior**: Displays Google sign-in button, initiates OAuth flow

### UserProfile.astro
**Location**: `src/components/auth/UserProfile.astro`
**Usage**:
```astro
<UserProfile user={Astro.locals.user} />
```
**Behavior**: Displays user avatar, name, and sign-out button when authenticated

### SignOutButton.astro
**Location**: `src/components/auth/SignOutButton.astro`
**Usage**:
```astro
<SignOutButton />
```
**Behavior**: Sign-out button that calls `/api/auth/signout`

## Helper Libraries

### Session Management
**File**: `src/lib/auth/session.ts`
**Functions**:
- `getSession(request)` - Get current session
- `refreshSession(request)` - Manually refresh tokens
- `signOut(request)` - Sign out user

### User Profile
**File**: `src/lib/auth/user-profile.ts`
**Functions**:
- `getUserProfile(userId)` - Get user profile from database
- `updateUserProfile(userId, data)` - Update user profile

### Auth Context
**File**: `src/lib/auth/auth-context.ts`
**Purpose**: Client-side auth state management
**Features**:
- Reactive auth state store
- Session synchronization across tabs
- Automatic token refresh

## Security Considerations

### HTTPOnly Cookies
- Access and refresh tokens stored in HTTPOnly cookies
- Not accessible via JavaScript
- Protects against XSS attacks

### Secure Flag
- Cookies marked as Secure in production
- Only transmitted over HTTPS
- Prevents MITM attacks

### SameSite Policy
- Cookies set with `SameSite=Lax`
- Prevents CSRF attacks
- Allows cross-subdomain sharing

### CORS Configuration
- Supabase configured to allow requests from:
  - `https://bizkit.dev`
  - `https://*.bizkit.dev`

### Protected Routes
Middleware can protect routes by checking `Astro.locals.user`:

```typescript
// Example protected route check
if (!Astro.locals.user && isProtectedPath) {
  return Astro.redirect('/signin')
}
```

## Testing

### Contract Tests (5 files)
- `tests/contract/auth-signin.test.ts` - Sign-in endpoint
- `tests/contract/auth-callback.test.ts` - OAuth callback
- `tests/contract/auth-signout.test.ts` - Sign-out endpoint
- `tests/contract/auth-session.test.ts` - Session endpoint
- `tests/contract/auth-user.test.ts` - User profile endpoint

### Integration Tests (4 files)
- `tests/integration/oauth-flow.test.ts` - Complete OAuth flow
- `tests/integration/cross-subdomain-session.test.ts` - Session sharing
- `tests/integration/signout-cross-domain.test.ts` - Cross-domain sign-out
- `tests/integration/session-persistence.test.ts` - Session persistence

### E2E Tests (3 files)
- `tests/e2e/complete-auth-flow.spec.ts` - Full auth workflow
- `tests/e2e/cross-subdomain-navigation.spec.ts` - Subdomain navigation
- `tests/e2e/session-persistence.spec.ts` - Browser session persistence

**Total Test Coverage**: 71 tests across 12 test files

## Deployment Checklist

### Supabase Configuration
- ✅ Create Supabase project
- ✅ Enable Google OAuth provider
- ✅ Configure OAuth redirect URLs:
  - `https://bizkit.dev/api/auth/callback`
  - `https://ai-trading.bizkit.dev/api/auth/callback`
- ✅ Run database migration
- ✅ Set up environment variables

### Google Cloud Configuration
- ✅ Create OAuth 2.0 credentials
- ✅ Add authorized redirect URIs:
  - `https://{project-id}.supabase.co/auth/v1/callback`
- ✅ Configure OAuth consent screen

### Environment Variables
```bash
# Required for all environments
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
PUBLIC_SITE_URL=https://bizkit.dev

# Production only (for cross-subdomain SSO)
PUBLIC_COOKIE_DOMAIN=.bizkit.dev

# Local Development (optional, defaults to localhost)
PUBLIC_COOKIE_DOMAIN=localhost
```

### DNS Configuration
- ✅ Main domain: `bizkit.dev` → Zeabur
- ✅ Subdomain: `ai-trading.bizkit.dev` → Zeabur
- ✅ SSL certificates for both domains

## Troubleshooting

### Session Not Shared Across Subdomains
**Symptom**: User authenticated on `bizkit.dev` but not on `ai-trading.bizkit.dev`
**Solution**:
1. Verify `PUBLIC_COOKIE_DOMAIN=.bizkit.dev` in production
2. Check cookies in browser DevTools - domain should be `.bizkit.dev`
3. Ensure both domains use HTTPS

### Infinite Redirect Loop
**Symptom**: Callback redirects endlessly
**Solution**:
1. Check `next` parameter encoding in callback URL
2. Verify redirect URL matches Supabase configuration
3. Check for middleware interference

### Cookies Not Persisting
**Symptom**: Session lost on page refresh
**Solution**:
1. Verify cookies have proper expiration
2. Check HTTPOnly and Secure flags
3. Ensure SameSite policy is set correctly

### Local Development Issues
**Symptom**: Auth works in production but not locally
**Solution**:
1. Use `localhost` instead of `.localhost` for cookie domain
2. Disable Secure flag in development
3. Use mock Supabase instance for testing

## Future Enhancements

- [ ] Add email/password authentication option
- [ ] Implement OAuth with GitHub and other providers
- [ ] Add 2FA/MFA support
- [ ] Create user dashboard for profile management
- [ ] Add role-based access control (RBAC)
- [ ] Implement session analytics
- [ ] Add login activity tracking

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side)
- [Cross-Subdomain Cookies RFC 6265](https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.3)
- [Michele Ong's SSO Implementation](https://micheleong.com/blog/supabase-sso-astro)
- [Supabase GitHub Discussion #5742](https://github.com/supabase/supabase/discussions/5742)
