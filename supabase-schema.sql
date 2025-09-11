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
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_active ON subscribers(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_subscribers_confirmed ON subscribers(confirmed) WHERE confirmed = true;

-- Enable Row Level Security
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscribers table
-- Policy for inserting new subscriptions (anyone can subscribe)
CREATE POLICY "Anyone can insert subscription" ON subscribers
FOR INSERT
WITH CHECK (true);

-- Policy for selecting subscribers (only confirmed and active for public access)
CREATE POLICY "Public read access for confirmed subscribers" ON subscribers
FOR SELECT
USING (confirmed = true AND active = true);

-- Policy for updating subscriptions (only for email confirmation and unsubscribe)
CREATE POLICY "Allow subscription status updates" ON subscribers
FOR UPDATE
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON subscribers TO anon, authenticated;
GRANT EXECUTE ON FUNCTION confirm_subscription(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION unsubscribe_email(TEXT) TO anon, authenticated;

-- Insert some example data for testing (remove in production)
-- INSERT INTO subscribers (email, confirmed, active) VALUES 
-- ('test@example.com', true, true),
-- ('demo@bizkit.dev', true, true);

-- Create a view for active subscribers count (useful for analytics)
CREATE OR REPLACE VIEW active_subscribers_count AS
SELECT COUNT(*) as total_subscribers
FROM subscribers 
WHERE confirmed = true AND active = true;

-- Grant access to the view
GRANT SELECT ON active_subscribers_count TO anon, authenticated;