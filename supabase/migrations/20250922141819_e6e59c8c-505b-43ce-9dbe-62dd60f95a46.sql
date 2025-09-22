-- Create sales funnel templates table
CREATE TABLE public.sales_funnel_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_funnel_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own funnel templates" 
ON public.sales_funnel_templates 
FOR SELECT 
USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create their own funnel templates" 
ON public.sales_funnel_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own funnel templates" 
ON public.sales_funnel_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own funnel templates" 
ON public.sales_funnel_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_sales_funnel_templates_updated_at
BEFORE UPDATE ON public.sales_funnel_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.sales_funnel_templates (user_id, name, description, stages, is_default) VALUES
('00000000-0000-0000-0000-000000000000', 'B2B Consultoria', 'Funil padrão para vendas B2B e consultoria', 
 '[
   {"name": "Prospecção", "color": "#3b82f6", "order_index": 0},
   {"name": "Qualificação", "color": "#8b5cf6", "order_index": 1},
   {"name": "Apresentação", "color": "#06b6d4", "order_index": 2},
   {"name": "Proposta", "color": "#f59e0b", "order_index": 3},
   {"name": "Negociação", "color": "#f97316", "order_index": 4},
   {"name": "Fechamento", "color": "#10b981", "order_index": 5}
 ]'::jsonb, true),

('00000000-0000-0000-0000-000000000000', 'Serviços', 'Funil para prestadores de serviços', 
 '[
   {"name": "Contato", "color": "#3b82f6", "order_index": 0},
   {"name": "Briefing", "color": "#8b5cf6", "order_index": 1},
   {"name": "Orçamento", "color": "#f59e0b", "order_index": 2},
   {"name": "Aprovação", "color": "#f97316", "order_index": 3},
   {"name": "Execução", "color": "#10b981", "order_index": 4}
 ]'::jsonb, true);