-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  stage TEXT NOT NULL DEFAULT 'novo',
  status TEXT NOT NULL DEFAULT 'active',
  value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  owner TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES public.clients(id),
  notes TEXT,
  last_contact_at TIMESTAMP WITH TIME ZONE,
  next_follow_up_at TIMESTAMP WITH TIME ZONE,
  lost_reason TEXT,
  lost_at TIMESTAMP WITH TIME ZONE,
  converted_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own leads" 
ON public.leads 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
ON public.leads 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
ON public.leads 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create lead_activities table for tracking interactions
CREATE TABLE public.lead_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stage_change', 'note_added', 'call', 'email', 'meeting', 'loss_reason', 'follow_up')),
  title TEXT NOT NULL,
  description TEXT,
  previous_value TEXT,
  new_value TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for activities
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for activities
CREATE POLICY "Users can view activities for their leads" 
ON public.lead_activities 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_activities.lead_id 
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create activities for their leads" 
ON public.lead_activities 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.leads 
    WHERE leads.id = lead_activities.lead_id 
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own activities" 
ON public.lead_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities" 
ON public.lead_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create lead_sources table for managing lead sources
CREATE TABLE public.lead_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cost_per_lead NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS for sources
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for sources
CREATE POLICY "Users can manage their own lead sources" 
ON public.lead_sources 
FOR ALL 
USING (auth.uid() = user_id);

-- Create lead_stages table for customizable pipeline stages
CREATE TABLE public.lead_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name),
  UNIQUE(user_id, order_index)
);

-- Enable RLS for stages
ALTER TABLE public.lead_stages ENABLE ROW LEVEL SECURITY;

-- RLS policies for stages
CREATE POLICY "Users can manage their own lead stages" 
ON public.lead_stages 
FOR ALL 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_stage ON public.leads(stage);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_owner ON public.leads(owner);
CREATE INDEX idx_leads_client_id ON public.leads(client_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_updated_at ON public.leads(updated_at DESC);

CREATE INDEX idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_type ON public.lead_activities(type);
CREATE INDEX idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- Create triggers for updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_sources_updated_at
  BEFORE UPDATE ON public.lead_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_stages_updated_at
  BEFORE UPDATE ON public.lead_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default lead stages for new users
INSERT INTO public.lead_sources (name, description, user_id) 
SELECT 
  source_name,
  source_description,
  auth.uid()
FROM (
  VALUES 
    ('Website', 'Leads que vieram do site'),
    ('Google Ads', 'Leads do Google Ads'),
    ('Meta Ads', 'Leads do Facebook/Instagram'),
    ('Indicação', 'Leads por indicação'),
    ('LinkedIn', 'Leads do LinkedIn'),
    ('Outros', 'Outras fontes')
) AS default_sources(source_name, source_description)
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.lead_stages (name, description, color, order_index, is_closed_won, is_closed_lost, user_id)
SELECT 
  stage_name,
  stage_description,
  stage_color,
  stage_order,
  stage_closed_won,
  stage_closed_lost,
  auth.uid()
FROM (
  VALUES 
    ('Novo', 'Lead recém cadastrado', '#64748b', 0, false, false),
    ('Qualificação', 'Lead em processo de qualificação', '#3b82f6', 1, false, false),
    ('Proposta', 'Proposta enviada', '#f59e0b', 2, false, false),
    ('Negociação', 'Em negociação', '#ef4444', 3, false, false),
    ('Fechado', 'Deal fechado com sucesso', '#10b981', 4, true, false),
    ('Perdido', 'Lead perdido', '#6b7280', 5, false, true)
) AS default_stages(stage_name, stage_description, stage_color, stage_order, stage_closed_won, stage_closed_lost)
WHERE auth.uid() IS NOT NULL;