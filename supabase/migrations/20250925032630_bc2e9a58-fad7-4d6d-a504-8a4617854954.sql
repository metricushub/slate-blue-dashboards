-- Remove demo/test accounts that are not real Google Ads accounts
DELETE FROM accounts_map 
WHERE customer_id IN ('1111111111', '1234567890', '0987654321')
   OR account_name LIKE '%Demo%'
   OR account_name LIKE '%Teste%';

-- Also clean up from google_ads_accounts table if they exist there
DELETE FROM google_ads_accounts 
WHERE customer_id IN ('1111111111', '1234567890', '0987654321')
   OR descriptive_name LIKE '%Demo%'
   OR descriptive_name LIKE '%Teste%';