-- Google Ads integration schema fixes
-- 1) google_ads_connections (mapping Google Ads account -> internal client per user)
CREATE TABLE IF NOT EXISTS public.google_ads_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  client_id UUID NULL REFERENCES public.clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_customer UNIQUE (user_id, customer_id)
);

ALTER TABLE public.google_ads_connections ENABLE ROW LEVEL SECURITY;

-- Policies: user can manage own mappings
CREATE POLICY IF NOT EXISTS "google_ads_connections_select_own"
ON public.google_ads_connections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "google_ads_connections_insert_own"
ON public.google_ads_connections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "google_ads_connections_update_own"
ON public.google_ads_connections FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "google_ads_connections_delete_own"
ON public.google_ads_connections FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_google_ads_connections_user ON public.google_ads_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_connections_customer ON public.google_ads_connections(customer_id);

-- 2) account_bindings (cache of resolved login-customer-id per child account)
CREATE TABLE IF NOT EXISTS public.account_bindings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  resolved_login_customer_id TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, customer_id)
);

ALTER TABLE public.account_bindings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "account_bindings_select_own"
ON public.account_bindings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "account_bindings_upsert_own"
ON public.account_bindings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "account_bindings_update_own"
ON public.account_bindings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "account_bindings_delete_own"
ON public.account_bindings FOR DELETE
USING (auth.uid() = user_id);

-- 3) google_tokens: ensure login_customer_id exists
ALTER TABLE public.google_tokens
ADD COLUMN IF NOT EXISTS login_customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_google_tokens_login_customer ON public.google_tokens(login_customer_id);

-- 4) accounts_map: ensure status and time_zone exist for UI/filters
ALTER TABLE public.accounts_map
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ENABLED',
ADD COLUMN IF NOT EXISTS time_zone TEXT;
CREATE INDEX IF NOT EXISTS idx_accounts_map_status ON public.accounts_map(status);
CREATE INDEX IF NOT EXISTS idx_accounts_map_is_manager ON public.accounts_map(is_manager);

-- 5) trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_google_ads_connections_updated_at ON public.google_ads_connections;
CREATE TRIGGER trg_google_ads_connections_updated_at
BEFORE UPDATE ON public.google_ads_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_account_bindings_updated_at ON public.account_bindings;
CREATE TRIGGER trg_account_bindings_updated_at
BEFORE UPDATE ON public.account_bindings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
