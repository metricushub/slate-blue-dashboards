-- Fix Security Definer View issues - Remove unnecessary SECURITY DEFINER properties and fix view security

-- First, let's fix the v_ads_accounts_ui view to be user-specific
DROP VIEW IF EXISTS public.v_ads_accounts_ui;

CREATE VIEW public.v_ads_accounts_ui AS
SELECT 
    gt.user_id,
    am.customer_id,
    COALESCE(am.account_name, ('Account ' || am.customer_id)) AS name,
    am.is_manager,
    (c.customer_id IS NOT NULL) AS is_linked,
    c.client_id
FROM accounts_map am
LEFT JOIN google_tokens gt ON (gt.customer_id = am.customer_id OR gt.login_customer_id = am.customer_id)
LEFT JOIN google_ads_connections c ON (c.user_id = gt.user_id AND c.customer_id = am.customer_id)
WHERE gt.user_id IS NOT NULL;

-- Enable RLS on the view (views inherit RLS from underlying tables, but let's be explicit)
-- Note: RLS on views is handled by the underlying tables' policies

-- Recreate the list_ads_accounts function without SECURITY DEFINER
-- Since the view now properly filters by user tokens, we don't need SECURITY DEFINER
DROP FUNCTION IF EXISTS public.list_ads_accounts();

CREATE OR REPLACE FUNCTION public.list_ads_accounts()
RETURNS TABLE(customer_id text, name text, is_manager boolean, is_linked boolean, client_id uuid)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT customer_id, name, is_manager, is_linked, client_id
  FROM public.v_ads_accounts_ui
  WHERE user_id = auth.uid();
$$;

-- Recreate link_ads_account function without SECURITY DEFINER
-- The RLS policies on google_ads_connections already ensure users can only insert their own records
DROP FUNCTION IF EXISTS public.link_ads_account(text, uuid);

CREATE OR REPLACE FUNCTION public.link_ads_account(p_customer_id text, p_client_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  INSERT INTO public.google_ads_connections (user_id, customer_id, client_id)
  VALUES (auth.uid(), p_customer_id, p_client_id)
  ON CONFLICT (user_id, customer_id) DO UPDATE
  SET client_id = EXCLUDED.client_id;
$$;

-- Recreate unlink_ads_account function without SECURITY DEFINER
-- The RLS policies on google_ads_connections already ensure users can only delete their own records
DROP FUNCTION IF EXISTS public.unlink_ads_account(text);

CREATE OR REPLACE FUNCTION public.unlink_ads_account(p_customer_id text)
RETURNS void
LANGUAGE sql
SET search_path = public
AS $$
  DELETE FROM public.google_ads_connections
  WHERE user_id = auth.uid() AND customer_id = p_customer_id;
$$;

-- Keep handle_new_user and get_current_user_role as SECURITY DEFINER since they legitimately need elevated privileges
-- handle_new_user needs to insert into profiles table
-- get_current_user_role needs to read user role information

-- Grant necessary permissions for the functions to work without SECURITY DEFINER
GRANT SELECT ON public.v_ads_accounts_ui TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_ads_connections TO authenticated;

-- Add a comment explaining why some functions still use SECURITY DEFINER
COMMENT ON FUNCTION public.handle_new_user() IS 'Uses SECURITY DEFINER to create user profile - requires elevated privileges';
COMMENT ON FUNCTION public.get_current_user_role() IS 'Uses SECURITY DEFINER to read user role - requires elevated privileges for profile access';