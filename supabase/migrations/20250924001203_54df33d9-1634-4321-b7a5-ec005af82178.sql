-- Add row_key column to metrics table
ALTER TABLE public.metrics 
ADD COLUMN IF NOT EXISTS row_key TEXT;

-- Create unique index on row_key
CREATE UNIQUE INDEX IF NOT EXISTS ux_metrics_row_key
ON public.metrics (row_key);

-- Create function to generate row key
CREATE OR REPLACE FUNCTION generate_metrics_row_key(
  p_customer_id TEXT,
  p_date DATE,
  p_campaign_id TEXT,
  p_platform TEXT
) RETURNS TEXT AS $$
BEGIN
  RETURN md5(
    coalesce(p_customer_id, '') || ':' ||
    coalesce(p_date::text, '') || ':' ||
    coalesce(p_campaign_id, '') || ':' ||
    coalesce(p_platform, '')
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;