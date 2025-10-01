# Zeabur OAuth Authentication Setup Guide

This guide explains how to configure Google OAuth authentication on Zeabur for the bizkit.dev portfolio.

## Issue: OAuth Redirect to Localhost

**Symptom**: After authenticating with Google, users are redirected to `localhost` instead of your production domain.

**Root Cause**: Missing or incorrect `PUBLIC_SITE_URL` environment variable in Zeabur.

## Solution

### Step 1: Set Environment Variables in Zeabur

Navigate to your Zeabur project and add the following environment variables:

#### Required Variables

```bash
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Site Configuration - CRITICAL for OAuth
PUBLIC_SITE_URL=https://bizkit.dev

# Cookie Domain for Cross-Subdomain SSO
PUBLIC_COOKIE_DOMAIN=.bizkit.dev
```

#### How to Add in Zeabur

1. Go to your Zeabur project dashboard
2. Click on your service (bizkitdev)
3. Navigate to **Variables** tab
4. Add each environment variable:
   - Click **Add Variable**
   - Enter variable name (e.g., `PUBLIC_SITE_URL`)
   - Enter value (e.g., `https://bizkit.dev`)
   - Click **Save**
5. **Redeploy** your service after adding all variables

### Step 2: Configure Supabase OAuth Redirect URLs

In your Supabase project dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add these **Redirect URLs**:
   ```
   https://bizkit.dev/api/auth/callback
   https://ai-trading.bizkit.dev/api/auth/callback
   ```
3. Set **Site URL** to: `https://bizkit.dev`
4. Click **Save**

### Step 3: Configure Google Cloud OAuth

In Google Cloud Console:

1. Go to **APIs & Services** → **Credentials**
2. Select your OAuth 2.0 Client ID
3. Add **Authorized redirect URIs**:
   ```
   https://{your-project-id}.supabase.co/auth/v1/callback
   ```
4. Add **Authorized JavaScript origins**:
   ```
   https://bizkit.dev
   https://ai-trading.bizkit.dev
   ```
5. Click **Save**

### Step 4: Verify Deployment

After redeploying with the correct environment variables:

1. Visit `https://bizkit.dev`
2. Click **Sign In with Google**
3. Complete OAuth flow
4. **You should be redirected back to** `https://bizkit.dev` (not localhost!)
5. Session should persist across `bizkit.dev` and `ai-trading.bizkit.dev`

## Code Fallback Mechanism

The signin endpoint now includes a fallback mechanism:

```typescript
// src/pages/api/auth/signin.ts
const siteUrl = import.meta.env.PUBLIC_SITE_URL || url.origin
```

This means:
- **Best practice**: Set `PUBLIC_SITE_URL` explicitly in Zeabur
- **Fallback**: If not set, uses the request's origin (current domain)
- **Development**: Works with localhost automatically
- **Production**: Uses production domain if env var missing

## Environment Variable Priority

1. **`PUBLIC_SITE_URL`** (explicit configuration) - **RECOMMENDED**
2. **`url.origin`** (automatic detection) - Fallback

## Testing Checklist

After deployment, verify:

- [ ] Environment variables set in Zeabur
- [ ] Service redeployed
- [ ] Supabase redirect URLs configured
- [ ] Google OAuth credentials updated
- [ ] Sign-in redirects to production domain
- [ ] No localhost in OAuth flow
- [ ] Session persists across page refreshes
- [ ] Cross-subdomain session works

## Troubleshooting

### Still Redirecting to Localhost

**Check**:
1. Zeabur environment variables are saved
2. Service was redeployed after setting variables
3. Browser cache cleared (hard refresh with Ctrl+Shift+R)
4. Check browser console for the actual redirect URL

**Debug**:
```javascript
// Check what URL is being used in browser console
console.log('Site URL:', import.meta.env.PUBLIC_SITE_URL)
```

### OAuth Callback URL Mismatch

**Error**: "Redirect URI mismatch"

**Solution**:
1. Verify Supabase redirect URLs exactly match: `https://bizkit.dev/api/auth/callback`
2. No trailing slashes
3. Must use HTTPS in production

### Cookie Not Shared Across Subdomains

**Check**:
1. `PUBLIC_COOKIE_DOMAIN=.bizkit.dev` is set (note the leading dot)
2. Both domains use HTTPS
3. Cookies visible in browser DevTools → Application → Cookies
4. Cookie domain shows `.bizkit.dev` (not `bizkit.dev`)

### Environment Variable Not Taking Effect

**Issue**: Changed env var but still seeing old behavior

**Solution**:
1. Click **Redeploy** in Zeabur (env vars require rebuild)
2. Wait for deployment to complete (check logs)
3. Hard refresh browser (Ctrl+Shift+R)
4. Check service logs in Zeabur for any errors

## Development vs Production

### Local Development
```bash
# .env or .env.local
PUBLIC_SITE_URL=http://localhost:4321
PUBLIC_COOKIE_DOMAIN=localhost
```

### Zeabur Production
```bash
# Set in Zeabur Variables tab
PUBLIC_SITE_URL=https://bizkit.dev
PUBLIC_COOKIE_DOMAIN=.bizkit.dev
```

## Zeabur-Specific Notes

### Automatic Domain Detection

Zeabur provides environment variables automatically:
- `PORT` - Automatically set by Zeabur
- `NODE_ENV=production` - Set automatically

### Custom Domains

If using custom domains in Zeabur:
1. Add domain in Zeabur **Domains** tab
2. Update `PUBLIC_SITE_URL` to match custom domain
3. Update Supabase redirect URLs
4. Update Google OAuth credentials
5. Redeploy

### Multiple Deployments

For staging/preview environments:
- Use environment-specific variables
- Or rely on automatic `url.origin` detection
- Example: `preview.bizkit.dev` will auto-detect

## Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret (not exposed to client)
- [ ] Public keys (`PUBLIC_*`) are safe to expose
- [ ] HTTPS enabled on all domains
- [ ] Cookie domain starts with `.` for subdomain sharing
- [ ] Redirect URLs match exactly (no wildcards)

## Next Steps

After successful OAuth setup:
1. Test sign-in flow end-to-end
2. Verify cross-subdomain navigation
3. Test sign-out clears session everywhere
4. Monitor Zeabur logs for any errors
5. Set up error tracking (optional)

## Support Resources

- [Zeabur Documentation](https://zeabur.com/docs)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [OAuth Troubleshooting](../auth-architecture.md#troubleshooting)
- [GitHub Issues](https://github.com/omarbizkit/bizkitdev/issues)

## Quick Fix Command

If you need to quickly check/update environment variables:

```bash
# Check current variables (via Zeabur CLI if installed)
zeabur env list

# Or check in code (temporary debug)
console.log('PUBLIC_SITE_URL:', import.meta.env.PUBLIC_SITE_URL)
console.log('Request origin:', window.location.origin)
```

---

**Last Updated**: 2025-09-30
**Applies To**: Zeabur deployments with Supabase OAuth
**Status**: Production tested ✅
