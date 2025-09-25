-- Add login_customer_id to google_tokens if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'google_tokens' 
        AND column_name = 'login_customer_id'
    ) THEN
        ALTER TABLE public.google_tokens ADD COLUMN login_customer_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_google_tokens_login_customer ON public.google_tokens(login_customer_id);
    END IF;
END $$;