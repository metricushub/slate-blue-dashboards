-- Fix critical security issue: Restrict client_contacts access to authorized users only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage client_contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Authenticated users can view client_contacts" ON public.client_contacts;

-- Create secure RLS policies that restrict access based on client ownership
-- Users can only view contacts for clients they own or have access to
CREATE POLICY "Users can view contacts for their own clients" 
ON public.client_contacts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_contacts.client_id 
    AND c.owner = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Users can only insert contacts for clients they own
CREATE POLICY "Users can insert contacts for their own clients" 
ON public.client_contacts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_contacts.client_id 
    AND c.owner = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Users can only update contacts for clients they own
CREATE POLICY "Users can update contacts for their own clients" 
ON public.client_contacts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_contacts.client_id 
    AND c.owner = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Users can only delete contacts for clients they own
CREATE POLICY "Users can delete contacts for their own clients" 
ON public.client_contacts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_contacts.client_id 
    AND c.owner = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);