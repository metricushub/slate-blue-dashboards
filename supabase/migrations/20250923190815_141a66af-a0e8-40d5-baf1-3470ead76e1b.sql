-- Enable RLS on tables without Row Level Security
-- This fixes the security warnings

-- Enable RLS on google_ads_connections table
ALTER TABLE public.google_ads_connections ENABLE ROW LEVEL SECURITY;

-- Create policy for google_ads_connections
CREATE POLICY "Public read access for google_ads_connections"
  ON public.google_ads_connections 
  FOR SELECT 
  USING (true);

-- Enable RLS on google_ads_credentials table  
ALTER TABLE public.google_ads_credentials ENABLE ROW LEVEL SECURITY;

-- Create policy for google_ads_credentials (no public access - system only)
CREATE POLICY "System only access for google_ads_credentials"
  ON public.google_ads_credentials 
  FOR ALL 
  USING (false);

-- Fix search path for existing functions
ALTER FUNCTION public.set_updated_at() SET search_path = 'public';