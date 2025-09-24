-- Corrigir apenas a view google_ads_metrics para resolver o problema de segurança

-- Recriar a view google_ads_metrics sem SECURITY DEFINER
DROP VIEW IF EXISTS public.google_ads_metrics;

CREATE VIEW public.google_ads_metrics AS
SELECT 
  customer_id,
  date,
  campaign_id,
  clicks,
  impressions,
  spend as cost_micros,
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