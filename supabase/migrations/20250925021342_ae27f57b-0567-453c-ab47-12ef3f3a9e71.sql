-- Recriar views sem SECURITY DEFINER para garantir RLS
-- Drop e recriar v_ads_accounts_ui
DROP VIEW IF EXISTS public.v_ads_accounts_ui CASCADE;

CREATE VIEW public.v_ads_accounts_ui AS 
SELECT 
  a.user_id,
  a.customer_id,
  COALESCE(a.descriptive_name, 'Account ' || a.customer_id) AS name,
  a.is_manager,
  (c.customer_id IS NOT NULL) AS is_linked,
  c.client_id
FROM public.google_ads_accounts a
LEFT JOIN public.google_ads_connections c ON (
  c.user_id = a.user_id AND 
  c.customer_id = a.customer_id
);

-- Drop e recriar google_ads_metrics
DROP VIEW IF EXISTS public.google_ads_metrics CASCADE;

CREATE VIEW public.google_ads_metrics AS 
SELECT 
  customer_id,
  date,
  campaign_id,
  clicks,
  impressions,
  spend AS cost_micros,
  platform,
  client_id,
  conversions,
  cpa,
  roas,
  ctr,
  conv_rate,
  leads,
  revenue,
  created_at,
  updated_at
FROM public.metrics;