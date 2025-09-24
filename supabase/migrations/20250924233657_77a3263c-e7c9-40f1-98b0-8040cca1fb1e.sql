-- Criar tabela google_ads_accounts se não existir
CREATE TABLE IF NOT EXISTS public.google_ads_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  customer_id text NOT NULL,
  descriptive_name text,
  is_manager boolean DEFAULT false,
  status text DEFAULT 'ENABLED',
  currency_code text,
  time_zone text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, customer_id)
);

-- Habilitar RLS
ALTER TABLE public.google_ads_accounts ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS sel_accounts_self ON public.google_ads_accounts;
DROP POLICY IF EXISTS ins_accounts_self ON public.google_ads_accounts;
DROP POLICY IF EXISTS upd_accounts_self ON public.google_ads_accounts;
DROP POLICY IF EXISTS sel_connections_self ON public.google_ads_connections;
DROP POLICY IF EXISTS ins_connections_self ON public.google_ads_connections;
DROP POLICY IF EXISTS upd_connections_self ON public.google_ads_connections;
DROP POLICY IF EXISTS del_connections_self ON public.google_ads_connections;

-- Criar políticas RLS para google_ads_accounts
CREATE POLICY sel_accounts_self ON public.google_ads_accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ins_accounts_self ON public.google_ads_accounts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY upd_accounts_self ON public.google_ads_accounts
  FOR UPDATE USING (user_id = auth.uid());

-- Criar políticas RLS para google_ads_connections  
CREATE POLICY sel_connections_self ON public.google_ads_connections
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY ins_connections_self ON public.google_ads_connections
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY upd_connections_self ON public.google_ads_connections
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY del_connections_self ON public.google_ads_connections
  FOR DELETE USING (user_id = auth.uid());

-- Criar a view canônica
DROP VIEW IF EXISTS public.v_ads_accounts_ui;
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

-- Funções RPC com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.list_ads_accounts()
RETURNS TABLE (
  customer_id text,
  name text,
  is_manager boolean,
  is_linked boolean,
  client_id uuid
) SECURITY DEFINER SET search_path = public
LANGUAGE SQL AS $$
  SELECT customer_id, name, is_manager, is_linked, client_id
  FROM public.v_ads_accounts_ui
  WHERE user_id = auth.uid();
$$;

-- Faz o vínculo (upsert) para o usuário logado
CREATE OR REPLACE FUNCTION public.link_ads_account(p_customer_id text, p_client_id uuid)
RETURNS void SECURITY DEFINER SET search_path = public
LANGUAGE SQL AS $$
  INSERT INTO public.google_ads_connections (user_id, customer_id, client_id)
  VALUES (auth.uid(), p_customer_id, p_client_id)
  ON CONFLICT (user_id, customer_id) DO UPDATE
  SET client_id = EXCLUDED.client_id;
$$;

-- Desvincula conta do usuário logado
CREATE OR REPLACE FUNCTION public.unlink_ads_account(p_customer_id text)
RETURNS void SECURITY DEFINER SET search_path = public
LANGUAGE SQL AS $$
  DELETE FROM public.google_ads_connections
  WHERE user_id = auth.uid() AND customer_id = p_customer_id;
$$;