-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para executar a ingestão diária às 06:00 UTC
SELECT cron.schedule(
  'google-ads-daily-ingestion',
  '0 6 * * *', -- Todos os dias às 06:00 UTC
  $$
  SELECT
    net.http_post(
        url:='https://zoahzxfjefjmkxylbfxf.supabase.co/functions/v1/google-ads-ingest-daily',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvYWh6eGZqZWZqbWt4eWxiZnhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzkzMzEsImV4cCI6MjA3MzcxNTMzMX0.tjxHTtuqbh6zWPmZif8T5oL3cWroYMLFt5BCYc0GQ2c"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);