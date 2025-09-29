-- Fix remaining Security Definer View issue
-- Remove SECURITY DEFINER from get_current_user_role since RLS policies already allow users to read their own profile

-- Recreate get_current_user_role function without SECURITY DEFINER
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- The handle_new_user function must keep SECURITY DEFINER because:
-- 1. It's a trigger function called by the auth system
-- 2. It needs to insert into profiles table regardless of RLS policies
-- 3. This is a legitimate and necessary use case for SECURITY DEFINER

-- Add comment explaining why handle_new_user still uses SECURITY DEFINER
COMMENT ON FUNCTION public.handle_new_user() IS 'SECURITY DEFINER required: This trigger function runs during user creation and must bypass RLS to create profile records';