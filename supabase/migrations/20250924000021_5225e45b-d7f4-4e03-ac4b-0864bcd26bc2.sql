-- Add customer_id field to metrics table for storing Google Ads customer IDs
ALTER TABLE public.metrics ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Make client_id nullable since we may not always have a mapped client
ALTER TABLE public.metrics ALTER COLUMN client_id DROP NOT NULL;

-- Create google_ads_connections table for mapping customer_id to client_id
CREATE TABLE IF NOT EXISTS public.google_ads_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  customer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, customer_id)
);