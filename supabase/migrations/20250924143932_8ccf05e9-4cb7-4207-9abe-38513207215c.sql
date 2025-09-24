-- Remover tabela google_ads_connections se existir (para recriar corretamente)
DROP TABLE IF EXISTS public.google_ads_connections;

-- Criar tabela para vincular contas Google Ads aos clientes internos
CREATE TABLE public.google_ads_connections (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,  
  customer_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Chave primária composta
  PRIMARY KEY (user_id, customer_id)
);

-- Índices para performance
CREATE INDEX idx_google_ads_connections_user_id ON public.google_ads_connections(user_id);
CREATE INDEX idx_google_ads_connections_client_id ON public.google_ads_connections(client_id);
CREATE INDEX idx_google_ads_connections_customer_id ON public.google_ads_connections(customer_id);

-- Habilitar RLS
ALTER TABLE public.google_ads_connections ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own Google Ads connections" 
ON public.google_ads_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Google Ads connections" 
ON public.google_ads_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google Ads connections" 
ON public.google_ads_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google Ads connections" 
ON public.google_ads_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_google_ads_connections_updated_at
BEFORE UPDATE ON public.google_ads_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();