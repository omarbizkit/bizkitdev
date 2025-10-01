-- Migration: 001_create_user_profiles.sql
-- Feature: Google OAuth Authentication with Cross-Subdomain Session Sharing
-- Date: 2025-09-30

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

-- Comments for documentation
COMMENT ON TABLE public.user_profiles IS 'Extended user profile data';
COMMENT ON COLUMN public.user_profiles.provider IS 'OAuth provider used for signup (google, github, etc.)';
COMMENT ON COLUMN public.user_profiles.preferences IS 'User preferences as JSON (theme, notifications, etc.)';
