-- Recriar as views sem SECURITY DEFINER para resolver o aviso de segurança
DROP VIEW IF EXISTS v_ads_daily_campaign;
DROP VIEW IF EXISTS v_ads_last30_summary;

-- Recriar view diária por campanha (sem security definer)
CREATE OR REPLACE VIEW v_ads_daily_campaign AS
SELECT
  customer_id, 
  date,
  campaign_id,
  SUM(clicks)::BIGINT AS clicks,
  SUM(impressions)::BIGINT AS impressions,
  SUM(cost_micros)::BIGINT AS cost_micros,
  (SUM(cost_micros)/1000000.0)::NUMERIC(18,2) AS cost,
  CASE 
    WHEN SUM(impressions) > 0 THEN (SUM(clicks)::NUMERIC / SUM(impressions))::NUMERIC(10,6)
    ELSE 0 
  END AS ctr,
  CASE 
    WHEN SUM(clicks) > 0 THEN ((SUM(cost_micros)/1000000.0) / SUM(clicks))::NUMERIC(10,6)
    ELSE 0 
  END AS cpc
FROM public.google_ads_metrics
GROUP BY customer_id, date, campaign_id;

-- Recriar view resumo últimos 30 dias (sem security definer)
CREATE OR REPLACE VIEW v_ads_last30_summary AS
SELECT
  customer_id,
  SUM(clicks)::BIGINT AS clicks,
  SUM(impressions)::BIGINT AS impressions,
  (SUM(cost_micros)/1000000.0)::NUMERIC(18,2) AS cost
FROM public.google_ads_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY customer_id;