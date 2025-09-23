-- Deduplicate existing rows by keeping the earliest created per customer_id
WITH keep AS (
  SELECT DISTINCT ON (customer_id) id, customer_id
  FROM public.accounts_map
  ORDER BY customer_id, created_at ASC, id ASC
)
DELETE FROM public.accounts_map a
USING keep k
WHERE a.customer_id = k.customer_id
  AND a.id <> k.id;

-- Add unique constraint on customer_id to prevent duplicates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uniq_accounts_map_customer_id'
  ) THEN
    ALTER TABLE public.accounts_map
    ADD CONSTRAINT uniq_accounts_map_customer_id UNIQUE (customer_id);
  END IF;
END $$;