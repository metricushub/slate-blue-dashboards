-- Corrigir issues de segurança da view
-- Remover SECURITY DEFINER da view (views não devem ter essa propriedade)
DROP VIEW IF EXISTS public.v_ads_accounts_ui;

-- Recriar view sem SECURITY DEFINER (views são sempre com permissões do usuário)
CREATE VIEW public.v_ads_accounts_ui AS
SELECT
  a.user_id,
  a.customer_id,
  COALESCE(a.descriptive_name, 'Account ' || a.customer_id) AS name,
  a.is_manager,
  (c.customer_id IS NOT NULL) AS is_linked,
  c.client_id
FROM public.google_ads_accounts a
LEFT JOIN public.google_ads_connections c
  ON c.user_id = a.user_id
  AND c.customer_id = a.customer_id;