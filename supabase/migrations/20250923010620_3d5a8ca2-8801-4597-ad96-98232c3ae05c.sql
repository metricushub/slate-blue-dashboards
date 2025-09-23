-- Tabela para armazenar tokens OAuth2 do Google Ads
CREATE TABLE public.google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.clients(id),
  refresh_token TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  customer_id TEXT,
  login_customer_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para mapear contas do Google Ads
CREATE TABLE public.accounts_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.clients(id),
  customer_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  account_name TEXT,
  account_type TEXT DEFAULT 'REGULAR',
  status TEXT NOT NULL DEFAULT 'active',
  is_manager BOOLEAN DEFAULT false,
  currency_code TEXT,
  time_zone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, customer_id)
);

-- Tabela para controlar ingestões do Google Ads
CREATE TABLE public.google_ads_ingestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_ads_ingestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies para google_tokens
CREATE POLICY "Users can manage their own Google tokens" 
ON public.google_tokens 
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies para accounts_map
CREATE POLICY "Users can view accounts they have access to" 
ON public.accounts_map 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.google_tokens gt 
    WHERE gt.customer_id = accounts_map.customer_id 
    AND gt.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage accounts for their tokens" 
ON public.accounts_map 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.google_tokens gt 
    WHERE gt.customer_id = accounts_map.customer_id 
    AND gt.user_id = auth.uid()
  )
);

-- RLS Policies para google_ads_ingestions
CREATE POLICY "Users can manage their own ingestions" 
ON public.google_ads_ingestions 
FOR ALL 
USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON public.google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accounts_map_updated_at
  BEFORE UPDATE ON public.accounts_map
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para melhor performance
CREATE INDEX idx_google_tokens_user_id ON public.google_tokens(user_id);
CREATE INDEX idx_google_tokens_customer_id ON public.google_tokens(customer_id);
CREATE INDEX idx_accounts_map_customer_id ON public.accounts_map(customer_id);
CREATE INDEX idx_google_ads_ingestions_user_id ON public.google_ads_ingestions(user_id);
CREATE INDEX idx_google_ads_ingestions_status ON public.google_ads_ingestions(status);