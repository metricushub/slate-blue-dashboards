-- Inserir dados de exemplo para testar o sistema
-- Primeiro vamos verificar se há um usuário atual
INSERT INTO public.google_ads_accounts (user_id, customer_id, descriptive_name, is_manager, status)
SELECT 
  '4e4aa8cc-3150-432a-ba7c-941211b66ff0'::uuid as user_id,
  customer_id,
  descriptive_name,
  is_manager,
  status
FROM (VALUES
  ('1234567890', 'Conta Teste 1', false, 'ENABLED'),
  ('0987654321', 'Conta Teste 2', false, 'ENABLED'),
  ('6714666141', 'Conta Principal', false, 'ENABLED'),
  ('1111111111', 'Conta Demo', false, 'ENABLED')
) AS example_accounts(customer_id, descriptive_name, is_manager, status)
ON CONFLICT (user_id, customer_id) DO UPDATE SET 
  descriptive_name = EXCLUDED.descriptive_name,
  is_manager = EXCLUDED.is_manager,
  status = EXCLUDED.status;