-- Backup das métricas atuais (segurança)
CREATE TABLE IF NOT EXISTS google_ads_metrics_backup AS
SELECT * FROM public.google_ads_metrics;

-- Backup dos clientes atuais (segurança)  
CREATE TABLE IF NOT EXISTS clients_backup AS
SELECT * FROM public.clients;

-- Remover clientes com dados fictícios (apenas por nome)
DELETE FROM clients
WHERE name ILIKE '%teste%'
   OR name ILIKE '%fake%'
   OR name ILIKE '%demo%'
   OR name ILIKE '%example%'
   OR name ILIKE '%sample%';

-- Remover métricas com customer_id que não existe na tabela google_ads_connections
-- (mantém apenas métricas de contas reais vinculadas)
DELETE FROM google_ads_metrics
WHERE customer_id NOT IN (
  SELECT DISTINCT customer_id 
  FROM google_ads_connections
  WHERE customer_id IS NOT NULL
);

-- Remover campanhas órfãs (sem métricas correspondentes)
DELETE FROM campaigns
WHERE external_id NOT IN (
  SELECT DISTINCT campaign_id 
  FROM google_ads_metrics
  WHERE campaign_id IS NOT NULL
);

-- Limpar alertas relacionados a clientes que foram removidos
DELETE FROM alerts
WHERE client_id NOT IN (
  SELECT id FROM clients
);

-- Limpar notas relacionadas a clientes que foram removidos  
DELETE FROM notes
WHERE client_id NOT IN (
  SELECT id FROM clients
);

-- Limpar otimizações relacionadas a clientes que foram removidos
DELETE FROM optimizations
WHERE client_id NOT IN (
  SELECT id FROM clients
);

-- Limpar tarefas relacionadas a clientes que foram removidos
DELETE FROM tasks
WHERE client_id NOT IN (
  SELECT id FROM clients
);