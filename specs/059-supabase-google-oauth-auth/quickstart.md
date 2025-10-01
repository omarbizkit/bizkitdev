# Quickstart: Google OAuth Authentication Testing

**Feature**: 059-supabase-google-oauth-auth
**Purpose**: Manual test scenario to validate complete OAuth flow

## Prerequisites

- [ ] Supabase project with Google OAuth provider enabled
- [ ] Google Cloud OAuth 2.0 credentials configured
- [ ] bizkit.dev and ai-trading.bizkit.dev accessible via HTTPS
- [ ] Environment variables set in Zeabur:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PUBLIC_SITE_URL=https://bizkit.dev`
  - `PUBLIC_COOKIE_DOMAIN=.bizkit.dev`

## Test Scenario 1: Complete OAuth Flow on bizkit.dev

### Step 1: Navigate to Homepage
```bash
# Open browser
open https://bizkit.dev
```

**Expected**:
- [ ] Homepage loads successfully
- [ ] "Sign In with Google" button is visible
- [ ] User is NOT authenticated (no profile display)

### Step 2: Click "Sign In with Google"
**Action**: Click the "Sign In with Google" button

**Expected**:
- [ ] Redirected to Google OAuth consent screen
- [ ] URL starts with `https://accounts.google.com/o/oauth2/`
- [ ] Shows app name and requested permissions (email, profile)

### Step 3: Authorize with Google
**Action**: Select Google account and click "Continue"

**Expected**:
- [ ] Redirected to Supabase callback URL (`https://<project>.supabase.co/auth/v1/callback`)
- [ ] Immediately redirected to `/api/auth/callback?code=...`
- [ ] Finally redirected to bizkit.dev homepage
- [ ] **Total time**: < 3 seconds

### Step 4: Verify Authentication
**Expected**:
- [ ] User profile displayed (name, avatar)
- [ ] "Sign Out" button visible
- [ ] "Sign In with Google" button hidden/replaced

**Verify in DevTools**:
```javascript
// Open browser console
document.cookie
// Should see cookies with domain=.bizkit.dev:
// - sb-<project>-auth-token
// - sb-<project>-auth-token-code-verifier
```

**Check Network Tab**:
- [ ] `/api/auth/callback` returns 303 redirect
- [ ] Response has `Set-Cookie` headers with `Domain=.bizkit.dev`

### Step 5: Verify Database
**Action**: Check Supabase dashboard

**Expected**:
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users WHERE email = 'your@email.com';
-- Should return 1 row with:
-- - id (uuid)
-- - email
-- - created_at
-- - last_sign_in_at (recent timestamp)
-- - raw_app_meta_data: { provider: 'google' }
-- - raw_user_meta_data: { name: '...', avatar_url: '...', ... }

SELECT * FROM public.user_profiles WHERE id = '<user_id>';
-- Should return 1 row with:
-- - id (matching auth.users.id)
-- - full_name (from Google)
-- - avatar_url (from Google)
-- - provider = 'google'
-- - created_at (recent timestamp)
```

---

## Test Scenario 2: Cross-Subdomain Session Sharing

### Step 1: Authenticate on bizkit.dev
**Prerequisite**: Complete Test Scenario 1 (authenticated on bizkit.dev)

### Step 2: Navigate to ai-trading.bizkit.dev
```bash
# In same browser session
open https://ai-trading.bizkit.dev
```

**Expected**:
- [ ] Page loads with user ALREADY authenticated
- [ ] User profile displayed (same as bizkit.dev)
- [ ] No sign-in required
- [ ] **Verification time**: < 100ms (session check)

**Verify in DevTools**:
```javascript
// On ai-trading.bizkit.dev
document.cookie
// Should see SAME cookies as bizkit.dev:
// - sb-<project>-auth-token (domain=.bizkit.dev)
```

### Step 3: Navigate back to bizkit.dev
**Action**: Return to bizkit.dev in same browser

**Expected**:
- [ ] Still authenticated
- [ ] Same user session
- [ ] No re-authentication required

---

## Test Scenario 3: Sign Out Across Subdomains

### Step 1: Sign Out on ai-trading.bizkit.dev
**Action**: Click "Sign Out" button on ai-trading.bizkit.dev

**Expected**:
- [ ] Redirected to homepage
- [ ] User profile removed
- [ ] "Sign In with Google" button visible
- [ ] **Cookies cleared** (check DevTools)

### Step 2: Verify Sign Out on bizkit.dev
**Action**: Navigate to bizkit.dev (in same browser)

**Expected**:
- [ ] User is NOT authenticated
- [ ] No user profile displayed
- [ ] "Sign In with Google" button visible
- [ ] Cookies cleared on this domain too

**Verify in DevTools**:
```javascript
// On bizkit.dev
document.cookie
// Should NOT contain auth cookies
// or cookies should be expired
```

### Step 3: Verify Database Session
**Action**: Check Supabase dashboard

**Expected**:
```sql
SELECT * FROM auth.sessions WHERE user_id = '<user_id>';
-- Should return 0 rows (session deleted)
```

---

## Test Scenario 4: Session Persistence

### Step 1: Authenticate on bizkit.dev
**Action**: Sign in with Google

### Step 2: Close Browser Completely
**Action**: Quit browser application (not just close tab)

### Step 3: Reopen Browser and Navigate to bizkit.dev
```bash
# After browser restart
open https://bizkit.dev
```

**Expected**:
- [ ] User is STILL authenticated
- [ ] Session persisted across browser restart
- [ ] User profile displayed immediately
- [ ] No re-authentication required

**Reason**: Cookies have long max-age, stored on disk

### Step 4: Verify Token Refresh
**Action**: Wait 50+ minutes (access token expires in 1 hour)

**Expected**:
- [ ] Session automatically refreshed
- [ ] User remains authenticated
- [ ] No user interaction required
- [ ] New access token in cookies

**Verify in DevTools Console**:
```javascript
// Supabase SDK logs token refresh events
// Look for: "Token refreshed successfully"
```

---

## Test Scenario 5: Error Handling

### Test 5.1: Invalid OAuth Code
**Action**: Manually navigate to `/api/auth/callback?code=invalid`

**Expected**:
- [ ] Error page or redirect to sign-in
- [ ] Clear error message displayed
- [ ] User not authenticated
- [ ] No cookies set

### Test 5.2: Missing Code Parameter
**Action**: Navigate to `/api/auth/callback` (no code)

**Expected**:
- [ ] 400 Bad Request response
- [ ] Error: "Missing authorization code"
- [ ] Redirect to sign-in page

### Test 5.3: Cancel OAuth Flow
**Action**:
1. Click "Sign In with Google"
2. On Google consent screen, click "Cancel"

**Expected**:
- [ ] Redirected back to bizkit.dev
- [ ] Error message displayed (e.g., "Authentication cancelled")
- [ ] User not authenticated

---

## Test Scenario 6: Multiple Browsers/Devices

### Step 1: Sign In on Chrome
**Action**: Authenticate on bizkit.dev using Chrome

### Step 2: Open Firefox (Same Device)
**Action**: Navigate to bizkit.dev in Firefox

**Expected**:
- [ ] User is NOT authenticated in Firefox
- [ ] Separate browser = separate cookies
- [ ] Must sign in separately

### Step 3: Sign In on Mobile Device
**Action**: Open bizkit.dev on mobile browser, sign in

**Expected**:
- [ ] Independent session on mobile
- [ ] Both desktop and mobile sessions active simultaneously
- [ ] Supabase tracks multiple sessions per user

**Verify in Supabase**:
```sql
SELECT * FROM auth.sessions WHERE user_id = '<user_id>';
-- Should show 2+ rows (one per device/browser)
```

---

## Test Scenario 7: Sign Out from One Device

### Step 1: Sign In on Desktop and Mobile
**Prerequisite**: Authenticated on both devices

### Step 2: Sign Out on Desktop
**Action**: Click "Sign Out" on desktop browser

**Expected**:
- [ ] Desktop session ended
- [ ] Mobile session STILL ACTIVE
- [ ] Only desktop cookies cleared
- [ ] Mobile remains authenticated

**Verify**: Navigate to bizkit.dev on mobile → still authenticated

**Note**: Supabase supports per-session sign-out. To sign out ALL sessions, use:
```typescript
await supabase.auth.signOut({ scope: 'global' })
```

---

## Performance Benchmarks

| Action | Target | Measurement |
|--------|--------|-------------|
| OAuth redirect | < 1s | Time from click to Google screen |
| OAuth callback | < 2s | Time from Google redirect to authenticated state |
| Session check (SSR) | < 50ms | Middleware session validation |
| Token refresh | < 100ms | Background refresh time |
| Sign out | < 500ms | Time from click to signed-out state |

**How to Measure**:
```javascript
// In browser console
performance.mark('auth-start')
// ... perform action ...
performance.mark('auth-end')
performance.measure('auth-duration', 'auth-start', 'auth-end')
console.log(performance.getEntriesByName('auth-duration')[0].duration)
```

---

## Troubleshooting

### Issue: Cookies Not Shared Across Subdomains
**Symptoms**: Authenticated on bizkit.dev but not on ai-trading.bizkit.dev

**Check**:
1. Cookie domain is `.bizkit.dev` (with leading dot)
2. Both sites use HTTPS (cookies with `Secure=true` won't work on HTTP)
3. Cookie `SameSite=Lax` (not `Strict`)

**Verify**:
```javascript
// On both domains
document.cookie.split(';').filter(c => c.includes('sb-'))
// Should return identical auth cookies
```

### Issue: Token Refresh Fails
**Symptoms**: User signed out after 1 hour

**Check**:
1. Refresh token present in cookies
2. Supabase client has `autoRefreshToken: true`
3. Network allows requests to Supabase URL
4. Refresh token not expired (max 30 days)

**Debug**:
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
})
// Should log 'TOKEN_REFRESHED' event
```

### Issue: OAuth Callback Fails
**Symptoms**: Redirect loop or error after Google authorization

**Check**:
1. Callback URL matches Supabase configuration
2. Code parameter present in callback URL
3. Supabase service role key set (for code exchange)
4. RLS policies allow profile creation

**Debug**:
```bash
# Check server logs for callback errors
# Look for: "Error exchanging code for session"
```

---

## Success Criteria

- [x] User can sign in with Google on bizkit.dev
- [x] Session automatically shared with ai-trading.bizkit.dev
- [x] Sign out works across all subdomains
- [x] Session persists across browser restarts
- [x] Token automatically refreshes before expiration
- [x] OAuth flow completes in < 3 seconds
- [x] Session check adds < 100ms overhead
- [x] Error handling is clear and user-friendly
- [x] Works on desktop and mobile browsers
- [x] Database entries created correctly (auth.users, user_profiles)

---

## Next Steps

After manual testing succeeds:
1. Convert scenarios to automated E2E tests (Playwright)
2. Add contract tests for API endpoints
3. Add integration tests for session management
4. Update CLAUDE.md with auth patterns
