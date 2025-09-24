-- Fix numeric field overflow in metrics table

-- Update conversions to bigint to handle large numbers
ALTER TABLE public.metrics 
ALTER COLUMN conversions TYPE BIGINT USING conversions::BIGINT;

-- Increase precision for rate fields
ALTER TABLE public.metrics 
ALTER COLUMN ctr TYPE NUMERIC(10,6) USING ctr::NUMERIC(10,6);

ALTER TABLE public.metrics 
ALTER COLUMN conv_rate TYPE NUMERIC(10,6) USING conv_rate::NUMERIC(10,6);

-- Increase spend precision to handle cost_micros values
ALTER TABLE public.metrics 
ALTER COLUMN spend TYPE NUMERIC(18,2) USING spend::NUMERIC(18,2);