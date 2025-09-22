-- Create financial_categories table
CREATE TABLE public.financial_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, type, name)
);

-- Enable Row Level Security
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for financial_categories
CREATE POLICY "Users can view their own categories and default categories" 
ON public.financial_categories 
FOR SELECT 
USING (auth.uid() = user_id OR is_default = true);

CREATE POLICY "Users can create their own categories" 
ON public.financial_categories 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can update their own categories" 
ON public.financial_categories 
FOR UPDATE 
USING (auth.uid() = user_id AND is_default = false);

CREATE POLICY "Users can delete their own categories" 
ON public.financial_categories 
FOR DELETE 
USING (auth.uid() = user_id AND is_default = false);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_categories_updated_at
BEFORE UPDATE ON public.financial_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default income categories
INSERT INTO public.financial_categories (user_id, type, name, is_default, color) VALUES
('00000000-0000-0000-0000-000000000000', 'income', 'Serviços de Marketing', true, '#10b981'),
('00000000-0000-0000-0000-000000000000', 'income', 'Consultoria', true, '#059669'),
('00000000-0000-0000-0000-000000000000', 'income', 'Produtos Digitais', true, '#0d9488'),
('00000000-0000-0000-0000-000000000000', 'income', 'Assinatura/Recorrente', true, '#0891b2'),
('00000000-0000-0000-0000-000000000000', 'income', 'Comissões', true, '#0284c7'),
('00000000-0000-0000-0000-000000000000', 'income', 'Outros', true, '#6366f1');

-- Insert default expense categories
INSERT INTO public.financial_categories (user_id, type, name, is_default, color) VALUES
('00000000-0000-0000-0000-000000000000', 'expense', 'Software/Ferramentas', true, '#dc2626'),
('00000000-0000-0000-0000-000000000000', 'expense', 'Marketing e Publicidade', true, '#ea580c'),
('00000000-0000-0000-0000-000000000000', 'expense', 'Freelancers/Terceiros', true, '#d97706'),
('00000000-0000-0000-0000-000000000000', 'expense', 'Educação/Cursos', true, '#ca8a04'),
('00000000-0000-0000-0000-000000000000', 'expense', 'Operacional', true, '#65a30d'),
('00000000-0000-0000-0000-000000000000', 'expense', 'Outros', true, '#7c3aed');