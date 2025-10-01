# Data Model: Supabase Google OAuth Authentication

**Feature**: 059-supabase-google-oauth-auth
**Date**: 2025-09-30

## Entity Relationship Diagram

```
┌─────────────────────────┐
│   auth.users            │ (Supabase built-in)
├─────────────────────────┤
│ id: uuid (PK)           │
│ email: string           │
│ created_at: timestamp   │
│ updated_at: timestamp   │
│ last_sign_in_at: ts     │
│ email_confirmed_at: ts  │
└──────────┬──────────────┘
           │
           │ 1:1
           │
┌──────────┴──────────────┐
│  public.user_profiles   │
├─────────────────────────┤
│ id: uuid (PK, FK)       │
│ full_name: string       │
│ avatar_url: string?     │
│ provider: string        │ (e.g., 'google')
│ updated_at: timestamp   │
└─────────────────────────┘

┌─────────────────────────┐
│   auth.sessions         │ (Supabase built-in)
├─────────────────────────┤
│ id: uuid (PK)           │
│ user_id: uuid (FK)      │
│ created_at: timestamp   │
│ updated_at: timestamp   │
│ factor_id: uuid?        │
└─────────────────────────┘
```

## Entities

### 1. auth.users (Supabase Built-in)

**Purpose**: Stores core authentication data managed by Supabase Auth

**Schema** (relevant fields):
```sql
-- Managed by Supabase, read-only for our app
CREATE TABLE auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  encrypted_password text,  -- NULL for OAuth users
  email_confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,  -- { provider: 'google', ... }
  raw_user_meta_data jsonb  -- { name: '...', avatar_url: '...', ... }
);
```

**Validation Rules**:
- Email must be valid format (enforced by Supabase)
- Email is unique across all users
- Cannot be directly modified by application

**State**: Managed by Supabase Auth service

---

### 2. public.user_profiles (Custom Table)

**Purpose**: Stores additional user profile data not covered by auth.users

**Schema**:
```sql
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  provider text NOT NULL DEFAULT 'google',
  bio text,
  website_url text,
  github_url text,
  twitter_handle text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- System can insert profiles (via trigger)
CREATE POLICY "Service role can insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_user_profiles_provider ON public.user_profiles(provider);
CREATE INDEX idx_user_profiles_updated_at ON public.user_profiles(updated_at DESC);
```

**Validation Rules**:
- `id` must reference existing auth.users.id
- `provider` must be non-empty string
- `website_url`, `github_url` must be valid URLs if provided
- `twitter_handle` must start with @ if provided
- `bio` max length: 500 characters
- `preferences` must be valid JSON

**Relationships**:
- 1:1 with auth.users (cascade delete)
- Created automatically via trigger when user signs up

**State Transitions**:
1. **Created**: On first sign-in (via trigger)
2. **Updated**: When user updates profile
3. **Deleted**: When user is deleted (cascade)

---

### 3. auth.sessions (Supabase Built-in)

**Purpose**: Tracks active user sessions across devices

**Schema** (managed by Supabase):
```sql
-- Managed by Supabase
CREATE TABLE auth.sessions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  factor_id uuid,  -- For MFA (future)
  aal text,  -- Authentication Assurance Level
  not_after timestamptz  -- Session expiration
);
```

**State**: Managed by Supabase Auth service
- Created on sign-in
- Updated on token refresh
- Deleted on sign-out or expiration

---

## TypeScript Interfaces

```typescript
// src/types/auth.ts

/**
 * User from Supabase auth.users
 */
export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
  created_at: string
  updated_at: string
  last_sign_in_at: string | null
  app_metadata: {
    provider: 'google'
    [key: string]: any
  }
  user_metadata: {
    name?: string
    avatar_url?: string
    email?: string
    email_verified?: boolean
    [key: string]: any
  }
}

/**
 * Custom user profile
 */
export interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  provider: string
  bio: string | null
  website_url: string | null
  github_url: string | null
  twitter_handle: string | null
  preferences: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Combined user data for application use
 */
export interface AppUser {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  provider: string
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  created_at: string
}

/**
 * Session object
 */
export interface Session {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: 'bearer'
  user: AuthUser
}

/**
 * Auth state for UI
 */
export interface AuthState {
  session: Session | null
  user: AppUser | null
  loading: boolean
  error: Error | null
}
```

---

## Database Triggers

### Auto-create user_profiles on sign-up

```sql
-- Function to create profile on new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    avatar_url,
    provider
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Update timestamp on profile changes

```sql
-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_profiles update
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
```

---

## Migration Script

```sql
-- Migration: 001_create_user_profiles.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  provider text NOT NULL DEFAULT 'google',
  bio text,
  website_url text,
  github_url text,
  twitter_handle text,
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT bio_length CHECK (char_length(bio) <= 500),
  CONSTRAINT valid_website_url CHECK (website_url IS NULL OR website_url ~* '^https?://'),
  CONSTRAINT valid_github_url CHECK (github_url IS NULL OR github_url ~* '^https://github\.com/'),
  CONSTRAINT valid_twitter_handle CHECK (twitter_handle IS NULL OR twitter_handle ~* '^@')
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role can insert profiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_user_profiles_provider ON public.user_profiles(provider);
CREATE INDEX idx_user_profiles_updated_at ON public.user_profiles(updated_at DESC);

-- Trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    full_name,
    avatar_url,
    provider
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'google')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on user_profiles update
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.user_profiles IS 'Extended user profile data';
COMMENT ON COLUMN public.user_profiles.provider IS 'OAuth provider used for signup (google, github, etc.)';
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences as JSON (theme, notifications, etc.)';
```

---

## Data Access Patterns

### 1. Get User Profile (Server-Side)
```typescript
// src/lib/auth/user-profile.ts
export async function getUserProfile(userId: string): Promise<AppUser | null> {
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null

  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
  if (!authUser) return null

  return {
    id: profile.id,
    email: authUser.user.email!,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    provider: profile.provider,
    email_confirmed_at: authUser.user.email_confirmed_at,
    last_sign_in_at: authUser.user.last_sign_in_at,
    created_at: profile.created_at
  }
}
```

### 2. Update User Profile (Client-Side)
```typescript
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'full_name' | 'bio' | 'website_url' | 'github_url' | 'twitter_handle'>>
): Promise<{ success: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
```

### 3. Get Current Session (Middleware)
```typescript
export async function getCurrentSession(request: Request): Promise<Session | null> {
  const supabase = createServerClient(url, key, { cookies })
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) return null
  return session
}
```

---

## Validation Rules Summary

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| user_profiles.id | uuid | Yes | FK to auth.users.id |
| user_profiles.full_name | text | No | - |
| user_profiles.avatar_url | text | No | Valid URL |
| user_profiles.provider | text | Yes | Non-empty |
| user_profiles.bio | text | No | Max 500 chars |
| user_profiles.website_url | text | No | Valid HTTP(S) URL |
| user_profiles.github_url | text | No | github.com URL |
| user_profiles.twitter_handle | text | No | Starts with @ |
| user_profiles.preferences | jsonb | Yes | Valid JSON |

---

## Security Model

1. **auth.users**: Managed by Supabase, no direct access
2. **user_profiles**:
   - Users can view/update their own profile only
   - Service role can insert (via trigger)
   - RLS enforced at database level
3. **Sessions**: Managed by Supabase, token-based access
4. **Cookies**: HTTPOnly, Secure, SameSite=Lax

---

## Next: Phase 1 Contracts

Data model complete. Next artifacts:
1. API contracts for OAuth callback
2. Session management contracts
3. Contract tests
