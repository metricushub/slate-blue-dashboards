-- Inserir dados de exemplo para testar o fluxo 1-clique
-- Usar o user_id do usuário atual no sistema
INSERT INTO public.accounts_map (
  customer_id,
  client_id,
  account_name,
  currency_code,
  time_zone,
  is_manager,
  account_type,
  status
) VALUES
  ('1234567890', '1234567890', 'Conta Teste Google Ads 1', 'BRL', 'America/Sao_Paulo', false, 'REGULAR', 'ENABLED'),
  ('0987654321', '0987654321', 'Conta Teste Google Ads 2', 'USD', 'America/New_York', false, 'REGULAR', 'ENABLED'),
  ('6714666141', '6714666141', 'Conta Principal Metricus', 'BRL', 'America/Sao_Paulo', false, 'REGULAR', 'ENABLED'),
  ('1111111111', '1111111111', 'Conta Demo Desenvolvimento', 'EUR', 'Europe/London', false, 'REGULAR', 'ENABLED')
ON CONFLICT (customer_id) DO UPDATE SET 
  account_name = EXCLUDED.account_name,
  currency_code = EXCLUDED.currency_code,
  time_zone = EXCLUDED.time_zone,
  is_manager = EXCLUDED.is_manager,
  account_type = EXCLUDED.account_type,
  status = EXCLUDED.status;