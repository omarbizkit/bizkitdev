-- Bizkit.dev Portfolio Database Schema
-- This file contains the SQL schema for the Supabase database

-- Enable RLS (Row Level Security)
-- Enable the "uuid-ossp" extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create subscribers table for email subscription management
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Email confirmation and unsubscribe tokens
  confirmation_token TEXT UNIQUE,
  unsubscribe_token TEXT UNIQUE,
  
  -- Timestamps for tracking subscription lifecycle
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  
  -- Email delivery tracking
  email_sent BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmed ON subscribers(confirmed) WHERE confirmed = true;

-- Indexes for token-based operations
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmation_token ON subscribers(confirmation_token) WHERE confirmation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token ON subscribers(unsubscribe_token) WHERE unsubscribe_token IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers table
-- ✅ WORKING: Explicit anon role policies (separate from authenticated)
CREATE POLICY "anon_can_insert_subscriptions" ON subscribers
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "anon_can_read_confirmed_subscriptions" ON subscribers
FOR SELECT
TO anon
USING (confirmed = true AND active = true);

CREATE POLICY "anon_can_update_subscriptions" ON subscribers
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- For future authenticated users (separate from anon policies)
CREATE POLICY "authenticated_can_insert_subscriptions" ON subscribers
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "authenticated_can_update_subscriptions" ON subscribers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create a function for email confirmation
CREATE OR REPLACE FUNCTION confirm_subscription(subscription_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscribers 
  SET confirmed = true, updated_at = NOW()
  WHERE email = subscription_email AND active = true;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function for unsubscribing
CREATE OR REPLACE FUNCTION unsubscribe_email(subscription_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE subscribers 
  SET active = false, updated_at = NOW()
  WHERE email = subscription_email;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions (separate for each role)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON subscribers TO anon;
GRANT EXECUTE ON FUNCTION confirm_subscription(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION unsubscribe_email(TEXT) TO anon;

-- Permissions for authenticated users (when you add user authentication)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON subscribers TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_subscription(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_email(TEXT) TO authenticated;

-- Insert some example data for testing (remove in production)
-- INSERT INTO subscribers (email, confirmed, active) VALUES 
-- ('test@example.com', true, true),
-- ('demo@bizkit.dev', true, true);

-- Create a view for active subscribers count (useful for analytics)
CREATE OR REPLACE VIEW active_subscribers_count AS
SELECT COUNT(*) as total_subscribers
FROM subscribers 
WHERE confirmed = true AND active = true;

-- Grant access to the view (separate for each role)
GRANT SELECT ON active_subscribers_count TO anon;
GRANT SELECT ON active_subscribers_count TO authenticated;