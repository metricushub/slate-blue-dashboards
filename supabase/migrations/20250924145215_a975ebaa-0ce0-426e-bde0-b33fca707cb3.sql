-- Create account_bindings table for MCC resolution caching
CREATE TABLE public.account_bindings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL,
  resolved_login_customer_id TEXT NOT NULL,
  last_verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, customer_id)
);

-- Enable RLS
ALTER TABLE public.account_bindings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own account bindings"
  ON public.account_bindings
  FOR ALL
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_account_bindings_updated_at
  BEFORE UPDATE ON public.account_bindings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for performance
CREATE INDEX idx_account_bindings_user_customer 
  ON public.account_bindings(user_id, customer_id);

CREATE INDEX idx_account_bindings_last_verified 
  ON public.account_bindings(last_verified_at);