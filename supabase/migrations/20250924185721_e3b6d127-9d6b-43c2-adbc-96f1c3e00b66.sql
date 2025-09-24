-- Recriar a view google_ads_metrics para garantir que não tenha security definer
DROP VIEW IF EXISTS google_ads_metrics CASCADE;

CREATE VIEW google_ads_metrics AS
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
FROM metrics;

-- Corrigir search_path das funções existentes
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.generate_metrics_row_key(text, date, text, text) SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;