-- Fix UUID columns in metrics table
-- First drop any foreign key constraints on campaign_id if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'metrics_campaign_id_fkey' 
        AND table_name = 'metrics'
    ) THEN
        ALTER TABLE public.metrics DROP CONSTRAINT metrics_campaign_id_fkey;
    END IF;
END $$;

-- Add customer_id as TEXT if it doesn't exist
ALTER TABLE public.metrics 
ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- Make client_id nullable 
ALTER TABLE public.metrics 
ALTER COLUMN client_id DROP NOT NULL;

-- Convert campaign_id from UUID to TEXT
ALTER TABLE public.metrics 
ALTER COLUMN campaign_id TYPE TEXT USING campaign_id::TEXT;