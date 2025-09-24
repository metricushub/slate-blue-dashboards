-- Habilitar RLS nas tabelas de backup para resolver os problemas de segurança
ALTER TABLE google_ads_metrics_backup ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients_backup ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas para as tabelas de backup (somente admin/sistema)
CREATE POLICY "System access only" ON google_ads_metrics_backup FOR ALL USING (false);
CREATE POLICY "System access only" ON clients_backup FOR ALL USING (false);