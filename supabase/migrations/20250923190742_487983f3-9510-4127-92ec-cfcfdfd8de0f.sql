-- Add unique constraint on user_id for google_tokens table
-- This allows proper upsert behavior in the OAuth flow

ALTER TABLE public.google_tokens 
ADD CONSTRAINT google_tokens_user_id_unique UNIQUE (user_id);