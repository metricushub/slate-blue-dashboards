-- Create view for UI listing of Google Ads accounts
-- Use google_tokens to link user to accounts, then join with connections
CREATE OR REPLACE VIEW v_ads_accounts_ui AS
SELECT
  gt.user_id,
  a.customer_id,
  COALESCE(a.account_name, 'Account ' || a.customer_id) AS name,
  a.is_manager,
  (c.customer_id IS NOT NULL) AS is_linked,
  c.client_id
FROM accounts_map a
JOIN google_tokens gt ON gt.login_customer_id = '2478435835' -- Link through MCC
LEFT JOIN google_ads_connections c
  ON c.user_id = gt.user_id
  AND c.customer_id = a.customer_id
WHERE a.status = 'ENABLED' 
  AND a.is_manager = false;