-- SpeedPulse Database Schema
-- Run this in the Supabase SQL Editor to set up your tables.

-- Ads table — stores approved advertisements displayed on the site
CREATE TABLE ads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  headline TEXT NOT NULL,
  description TEXT,
  cta_text TEXT DEFAULT 'Learn More',
  cta_url TEXT,
  placement TEXT NOT NULL DEFAULT 'top',  -- 'top' or 'mid'
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Advertisers table — stores advertiser applications submitted via the form
CREATE TABLE advertisers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  package TEXT NOT NULL,           -- 'starter', 'mid-content', 'pro'
  headline TEXT,
  description TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row-Level Security (recommended for production)
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;

-- Public read access for approved ads (used by the anon key)
CREATE POLICY "Anyone can read approved ads"
  ON ads FOR SELECT
  USING (status = 'approved');

-- Allow anon inserts into advertisers (for the submission form)
CREATE POLICY "Anyone can submit advertiser applications"
  ON advertisers FOR INSERT
  WITH CHECK (true);
