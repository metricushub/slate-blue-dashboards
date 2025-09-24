-- Corrigir a consulta do cron job com a estrutura correta
SELECT jobid, schedule, command FROM cron.job WHERE jobname = 'google-ads-daily-ingestion';