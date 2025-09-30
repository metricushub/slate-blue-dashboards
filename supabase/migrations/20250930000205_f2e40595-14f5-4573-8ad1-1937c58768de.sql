-- Tighten security around the only remaining SECURITY DEFINER function
-- 1) Ensure get_current_user_role() is not SECURITY DEFINER (idempotent)
DROP FUNCTION IF EXISTS public.get_current_user_role();
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2) Reduce attack surface of SECURITY DEFINER trigger function
-- Ensure search_path is fixed and revoke public execute
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
-- Optionally, allow only the supabase internal auth role to execute if ever called directly
DO $$
BEGIN
  PERFORM 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin';
  IF FOUND THEN
    GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
  END IF;
END$$;

-- 3) Document why SECURITY DEFINER is necessary here
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY DEFINER required: Trigger runs during user creation and must bypass RLS to create profile records. EXECUTE revoked from PUBLIC; search_path pinned to public.';