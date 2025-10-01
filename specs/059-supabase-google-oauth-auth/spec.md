# Feature Specification: Supabase Google OAuth Authentication with Cross-Subdomain Session Sharing

**Feature ID**: 059
**Status**: Planning
**Priority**: High
**Created**: 2025-09-30

## Overview

Enable users to authenticate using their Gmail/Google account on bizkit.dev via Supabase Auth, with authentication sessions automatically shared across all subdomains (e.g., ai-trading.bizkit.dev). This provides a seamless single sign-on (SSO) experience across the entire portfolio ecosystem.

## Problem Statement

Currently, there is no user authentication system on bizkit.dev. Users cannot:
- Sign in to access personalized features
- Have their identity maintained across different project subdomains
- Access protected features or personalized content
- Track their interactions across the portfolio ecosystem

## User Stories

### US-001: Google Sign-In
**As a** visitor to bizkit.dev
**I want to** sign in using my Google account
**So that** I can access personalized features without creating a new password

**Acceptance Criteria**:
- Google OAuth button is visible on the homepage
- Clicking the button redirects to Google's consent screen
- After authorization, I am redirected back to bizkit.dev as authenticated
- My profile information (name, email, avatar) is displayed
- Session persists across browser sessions

### US-002: Cross-Subdomain Session Sharing
**As an** authenticated user on bizkit.dev
**I want** my login session to automatically work on ai-trading.bizkit.dev
**So that** I don't have to sign in separately on each project

**Acceptance Criteria**:
- After signing in on bizkit.dev, I am automatically authenticated on ai-trading.bizkit.dev
- Navigating between bizkit.dev and ai-trading.bizkit.dev maintains my session
- Profile information is consistent across all subdomains
- Single logout action logs me out of all subdomains

### US-003: Sign Out
**As an** authenticated user
**I want to** sign out from any subdomain
**So that** I can end my session securely

**Acceptance Criteria**:
- Sign out button is available on all pages when authenticated
- Clicking sign out clears my session on all subdomains
- After sign out, I am redirected to the public homepage
- Session cookies are properly cleared

## Functional Requirements

### FR-001: Google OAuth Integration
- Integrate Supabase Google OAuth provider
- Configure Google Cloud OAuth 2.0 credentials
- Support PKCE flow for enhanced security
- Handle OAuth callbacks and token exchange

### FR-002: Cookie Domain Configuration
- Configure Supabase client with `.bizkit.dev` cookie domain
- Use secure, HTTPOnly, SameSite=Lax cookies
- Set appropriate cookie expiration (max-age)
- Ensure cookies work across all subdomains

### FR-003: Session Management
- Implement automatic token refresh
- Persist sessions across browser sessions
- Detect sessions from URL parameters (email confirmations, etc.)
- Handle session expiration gracefully

### FR-004: User Profile Display
- Display user's name, email, and avatar when authenticated
- Show authentication state in UI (signed in/out)
- Provide user profile dropdown/menu
- Allow users to view their profile information

### FR-005: Sign Out Functionality
- Implement secure sign-out that clears all session data
- Clear cookies on all subdomains
- Revoke refresh tokens on server-side
- Redirect to appropriate page after sign-out

## Non-Functional Requirements

### NFR-001: Security
- Use HTTPS for all authentication flows
- Store tokens securely in HTTPOnly cookies
- Implement CSRF protection
- Follow OAuth 2.0 best practices
- Use Supabase's built-in security features

### NFR-002: Performance
- Authentication flow completes within 3 seconds
- Token refresh happens automatically without user interaction
- Minimal impact on page load times (<100ms overhead)

### NFR-003: User Experience
- Smooth redirect flow with loading states
- Clear error messages for authentication failures
- Graceful handling of network errors
- Mobile-responsive authentication UI

### NFR-004: Compatibility
- Works across all modern browsers (Chrome, Firefox, Safari, Edge)
- Compatible with existing Astro SSR setup
- Maintains existing functionality on bizkit.dev and ai-trading.bizkit.dev

### NFR-005: Privacy
- Request minimal Google OAuth scopes (profile, email)
- Display clear privacy information
- Allow users to revoke access
- Comply with data protection best practices

## Technical Requirements

### TR-001: Supabase Configuration
- Enable Google OAuth provider in Supabase dashboard
- Configure redirect URLs for all domains
- Set up proper RLS policies for user data
- Use service role key for admin operations

### TR-002: Google Cloud Setup
- Create OAuth 2.0 client ID in Google Cloud Console
- Add authorized JavaScript origins: `https://bizkit.dev`, `https://*.bizkit.dev`
- Add authorized redirect URIs for Supabase callback
- Configure OAuth consent screen

### TR-003: Client Configuration
- Update Supabase client initialization with cookie options
- Implement on both bizkit.dev and ai-trading.bizkit.dev
- Ensure identical configuration across all subdomains
- Handle server-side rendering appropriately

### TR-004: Database Schema
- Leverage Supabase's built-in `auth.users` table
- Create `public.user_profiles` table for additional user data
- Set up RLS policies for user profile access
- Create triggers for profile creation on sign-up

## Success Criteria

1. **Authentication Works**: Users can sign in with Google on bizkit.dev
2. **Sessions Persist**: Login session persists across browser restarts
3. **Cross-Domain Auth**: Authentication automatically works on ai-trading.bizkit.dev after signing in on bizkit.dev
4. **Sign Out Works**: Signing out from any subdomain clears session on all subdomains
5. **Secure**: All authentication flows use HTTPS and secure cookies
6. **Performance**: Authentication adds <100ms to page load time
7. **User Experience**: 95% of users complete authentication without errors

## Testing Strategy

### Contract Tests
- Supabase Auth API contract validation
- Google OAuth callback contract
- Session token validation contract

### Integration Tests
- Complete OAuth flow (redirect → consent → callback → session)
- Cross-subdomain session verification
- Sign-out flow across subdomains
- Token refresh mechanism

### E2E Tests
- User signs in on bizkit.dev → visits ai-trading.bizkit.dev → sees authenticated state
- User signs out on ai-trading.bizkit.dev → returns to bizkit.dev → sees signed-out state
- Session persists across browser restart
- Error handling for failed authentication

### Manual Testing
- Test on multiple browsers
- Test on mobile devices
- Verify cookie behavior in DevTools
- Test with and without ad blockers

## Dependencies

- Supabase project with Auth enabled
- Google Cloud project with OAuth 2.0 credentials
- HTTPS enabled on bizkit.dev and all subdomains
- Astro framework with SSR support
- @supabase/supabase-js SDK

## Constraints

- Must work with existing Astro SSR setup
- Cannot break existing functionality on bizkit.dev or ai-trading.bizkit.dev
- Must support both server-side and client-side rendering
- Cookie domain must be configurable for development vs production

## Out of Scope

- Email/password authentication (Google OAuth only for now)
- Other OAuth providers (GitHub, Twitter, etc.)
- Multi-factor authentication
- User profile editing (beyond what Google provides)
- Role-based access control (RBAC)
- API rate limiting for authenticated users

## Future Enhancements

- Add GitHub OAuth provider
- Implement email/password authentication
- Add multi-factor authentication
- User profile editing capabilities
- Activity tracking and analytics
- Email notifications for account activity
- OAuth provider linking (link multiple providers to one account)

## References

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Share Sessions Across Subdomains with Supabase](https://micheleong.com/blog/share-sessions-subdomains-supabase)
- [Supabase GitHub Discussion #5742](https://github.com/orgs/supabase/discussions/5742)
- Cookie Domain Specification (RFC 6265)
