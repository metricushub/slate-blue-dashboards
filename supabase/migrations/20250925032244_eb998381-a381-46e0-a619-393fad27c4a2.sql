-- Fix v_ads_accounts_ui view to use accounts_map instead of google_ads_accounts
DROP VIEW IF EXISTS v_ads_accounts_ui;

CREATE VIEW v_ads_accounts_ui AS
SELECT 
  gt.user_id,
  am.customer_id,
  COALESCE(am.account_name, 'Account ' || am.customer_id) AS name,
  am.is_manager,
  (c.customer_id IS NOT NULL) AS is_linked,
  c.client_id
FROM accounts_map am
LEFT JOIN google_tokens gt ON gt.login_customer_id = '2478435835'
LEFT JOIN google_ads_connections c ON (c.user_id = gt.user_id AND c.customer_id = am.customer_id)
WHERE gt.user_id IS NOT NULL;