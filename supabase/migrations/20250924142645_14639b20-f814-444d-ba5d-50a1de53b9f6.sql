-- Criar view canônica para métricas do Google Ads
CREATE OR REPLACE VIEW public.google_ads_metrics AS
SELECT 
  customer_id,
  date,
  campaign_id,
  clicks,
  impressions,
  spend as cost_micros, -- mapeando spend para cost_micros
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