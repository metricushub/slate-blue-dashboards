-- ================================================
-- FIX GOOGLE ADS INTEGRATION - DATABASE STRUCTURE
-- ================================================

-- 1. Criar tabela google_tokens se não existir
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  customer_id TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Criar tabela accounts_map se não existir
CREATE TABLE IF NOT EXISTS public.accounts_map (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id TEXT NOT NULL,
  account_name TEXT,
  account_type TEXT,
  currency_code TEXT DEFAULT 'BRL',
  is_manager BOOLEAN DEFAULT false,
  parent_customer_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(customer_id)
);

-- 3. Criar tabela google_ads_ingestions se não existir  
CREATE TABLE IF NOT EXISTS public.google_ads_ingestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON public.google_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_map_customer_id ON public.accounts_map(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_map_user_id ON public.accounts_map(user_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ingestions_user_id ON public.google_ads_ingestions(user_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_ingestions_customer_id ON public.google_ads_ingestions(customer_id);

-- 5. Habilitar RLS em todas as tabelas
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_ingestions ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS para google_tokens
CREATE POLICY "Users can view their own tokens" 
ON public.google_tokens FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
ON public.google_tokens FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.google_tokens FOR UPDATE 
USING (auth.uid() = user_id);

-- 7. Criar políticas RLS para accounts_map
CREATE POLICY "Users can view their own accounts" 
ON public.accounts_map FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert accounts" 
ON public.accounts_map FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update accounts" 
ON public.accounts_map FOR UPDATE 
USING (auth.uid() = user_id OR user_id IS NULL);

-- 8. Criar políticas RLS para google_ads_ingestions
CREATE POLICY "Users can view their own ingestions" 
ON public.google_ads_ingestions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ingestions" 
ON public.google_ads_ingestions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ingestions" 
ON public.google_ads_ingestions FOR UPDATE 
USING (auth.uid() = user_id);

-- 9. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Triggers para updated_at
CREATE TRIGGER update_google_tokens_updated_at
BEFORE UPDATE ON public.google_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_map_updated_at
BEFORE UPDATE ON public.accounts_map
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Criar view para facilitar visualização das conexões
CREATE OR REPLACE VIEW public.google_ads_connections_view AS
SELECT 
  gac.user_id,
  gac.customer_id,
  gac.client_id,
  c.name as client_name,
  am.account_name as google_account_name,
  am.account_type,
  am.is_manager,
  gac.created_at,
  gac.updated_at
FROM public.google_ads_connections gac
LEFT JOIN public.clients c ON c.id = gac.client_id
LEFT JOIN public.accounts_map am ON am.customer_id = gac.customer_id;

-- 12. Grant necessários
GRANT ALL ON public.google_tokens TO authenticated;
GRANT ALL ON public.accounts_map TO authenticated;
GRANT ALL ON public.google_ads_ingestions TO authenticated;
GRANT SELECT ON public.google_ads_connections_view TO authenticated;

-- ================================================
-- FIM DO SCRIPT DE CORREÇÃO
-- ================================================

-- Para executar este script:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script e execute
-- 4. Verifique se não houve erros