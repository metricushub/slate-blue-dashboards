-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'onboarding', 'at_risk', 'churned', 'Ativo', 'Pausado', 'Risco', 'Prospect', 'Arquivado')),
  stage TEXT NOT NULL CHECK (stage IN ('Prospecção', 'Onboarding: Docs', 'Onboarding: Setup', 'Rodando', 'Revisão', 'Encerrado', 'Setup inicial')),
  owner TEXT NOT NULL,
  last_update DATE NOT NULL DEFAULT CURRENT_DATE,
  logo_url TEXT,
  budget_month NUMERIC(12,2) DEFAULT 0,
  monthly_budget NUMERIC(12,2),
  budget_spent_month NUMERIC(12,2) DEFAULT 0,
  tags TEXT[],
  website TEXT,
  segment TEXT,
  goals_leads INTEGER,
  goals_cpa NUMERIC(10,2),
  goals_roas NUMERIC(10,2),
  latest_leads INTEGER,
  latest_cpa NUMERIC(10,2),
  latest_roas NUMERIC(10,2),
  ga4_last_event_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_contacts table
CREATE TABLE public.client_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_access table
CREATE TABLE public.client_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ga_property_id TEXT,
  ga4_property_id TEXT,
  google_ads_customer_id TEXT,
  meta_ad_account_id TEXT,
  business_manager TEXT,
  gtm_container_id TEXT,
  search_console_url TEXT,
  notes TEXT,
  has_ga4_access BOOLEAN DEFAULT false,
  has_google_ads_access BOOLEAN DEFAULT false,
  has_meta_access BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google_ads', 'meta_ads', 'google', 'meta', 'linkedin', 'tiktok')),
  name TEXT NOT NULL,
  external_id TEXT, -- ID from the platform (Google Ads, Meta, etc.)
  status TEXT NOT NULL CHECK (status IN ('ENABLED', 'PAUSED', 'REMOVED', 'active', 'paused', 'draft', 'ended')),
  objective TEXT,
  last_sync TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create metrics table for daily aggregated data
CREATE TABLE public.metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('all', 'google', 'meta', 'google_ads', 'meta_ads', 'linkedin', 'tiktok')),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  leads INTEGER DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cpa NUMERIC(10,2),
  roas NUMERIC(10,2),
  ctr NUMERIC(5,4), -- Click-through rate as percentage
  conv_rate NUMERIC(5,4), -- Conversion rate as percentage
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, client_id, platform, campaign_id)
);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('budget', 'performance', 'campaign', 'system', 'error', 'info', 'warning')),
  level TEXT NOT NULL CHECK (level IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  dismissed BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create optimizations table
CREATE TABLE public.optimizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('campaign', 'keyword', 'creative', 'budget', 'targeting', 'landing')),
  objective TEXT,
  target_metric TEXT,
  hypothesis TEXT,
  campaigns TEXT[], -- Array of campaign IDs
  start_date DATE NOT NULL,
  review_date DATE,
  expected_impact TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled', 'Planejada', 'Em teste', 'Concluída', 'Abortada')),
  result_summary TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  owner TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'Baixa', 'Média', 'Alta')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'Aberta', 'Em progresso', 'Concluída')),
  completed_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all for now - authentication will be added later)
CREATE POLICY "Allow all access to clients" ON public.clients FOR ALL USING (true);
CREATE POLICY "Allow all access to client_contacts" ON public.client_contacts FOR ALL USING (true);
CREATE POLICY "Allow all access to client_access" ON public.client_access FOR ALL USING (true);
CREATE POLICY "Allow all access to campaigns" ON public.campaigns FOR ALL USING (true);
CREATE POLICY "Allow all access to metrics" ON public.metrics FOR ALL USING (true);
CREATE POLICY "Allow all access to alerts" ON public.alerts FOR ALL USING (true);
CREATE POLICY "Allow all access to optimizations" ON public.optimizations FOR ALL USING (true);
CREATE POLICY "Allow all access to tasks" ON public.tasks FOR ALL USING (true);
CREATE POLICY "Allow all access to notes" ON public.notes FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_owner ON public.clients(owner);
CREATE INDEX idx_campaigns_client_platform ON public.campaigns(client_id, platform);
CREATE INDEX idx_metrics_client_date ON public.metrics(client_id, date);
CREATE INDEX idx_metrics_date_platform ON public.metrics(date, platform);
CREATE INDEX idx_alerts_client_unread ON public.alerts(client_id, is_read);
CREATE INDEX idx_optimizations_client_status ON public.optimizations(client_id, status);
CREATE INDEX idx_tasks_client_status ON public.tasks(client_id, status);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_access_updated_at
  BEFORE UPDATE ON public.client_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON public.metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_optimizations_updated_at
  BEFORE UPDATE ON public.optimizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();