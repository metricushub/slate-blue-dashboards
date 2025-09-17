-- Security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to handle new user signups (if not exists)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update RLS policies for all tables to be authentication-based

-- Profiles policies
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Clients policies - only authenticated users can access
DROP POLICY IF EXISTS "Allow all access to clients" ON public.clients;
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage clients" ON public.clients
  FOR ALL TO authenticated USING (true);

-- Campaigns policies
DROP POLICY IF EXISTS "Allow all access to campaigns" ON public.campaigns;
CREATE POLICY "Authenticated users can view campaigns" ON public.campaigns
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage campaigns" ON public.campaigns
  FOR ALL TO authenticated USING (true);

-- Metrics policies
DROP POLICY IF EXISTS "Allow all access to metrics" ON public.metrics;
CREATE POLICY "Authenticated users can view metrics" ON public.metrics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage metrics" ON public.metrics
  FOR ALL TO authenticated USING (true);

-- Alerts policies
DROP POLICY IF EXISTS "Allow all access to alerts" ON public.alerts;
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage alerts" ON public.alerts
  FOR ALL TO authenticated USING (true);

-- Tasks policies
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
CREATE POLICY "Authenticated users can view tasks" ON public.tasks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage tasks" ON public.tasks
  FOR ALL TO authenticated USING (true);

-- Notes policies
DROP POLICY IF EXISTS "Allow all access to notes" ON public.notes;
CREATE POLICY "Authenticated users can view notes" ON public.notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage notes" ON public.notes
  FOR ALL TO authenticated USING (true);

-- Optimizations policies
DROP POLICY IF EXISTS "Allow all access to optimizations" ON public.optimizations;
CREATE POLICY "Authenticated users can view optimizations" ON public.optimizations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage optimizations" ON public.optimizations
  FOR ALL TO authenticated USING (true);

-- Client access policies
DROP POLICY IF EXISTS "Allow all access to client_access" ON public.client_access;
CREATE POLICY "Authenticated users can view client_access" ON public.client_access
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage client_access" ON public.client_access
  FOR ALL TO authenticated USING (true);

-- Client contacts policies
DROP POLICY IF EXISTS "Allow all access to client_contacts" ON public.client_contacts;
CREATE POLICY "Authenticated users can view client_contacts" ON public.client_contacts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage client_contacts" ON public.client_contacts
  FOR ALL TO authenticated USING (true);