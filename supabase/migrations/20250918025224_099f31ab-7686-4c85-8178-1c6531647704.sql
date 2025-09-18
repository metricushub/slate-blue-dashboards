-- Inserir apenas os clientes primeiro
INSERT INTO public.clients (id, name, status, stage, owner, segment, website, monthly_budget, goals_leads, goals_cpa, goals_roas, latest_leads, latest_cpa, latest_roas, tags) VALUES
('11111111-1111-1111-1111-111111111111', 'Loja Virtual Fashion', 'active', 'Rodando', 'Ana Silva', 'E-commerce', 'https://fashionloja.com.br', 15000.00, 50, 80.00, 4.5, 42, 95.50, 4.2, ARRAY['moda', 'varejo', 'online']),
('22222222-2222-2222-2222-222222222222', 'Clínica Odontológica Sorrisos', 'active', 'Onboarding: Setup', 'Carlos Santos', 'Saúde', 'https://clinicasorrisos.com.br', 8000.00, 25, 120.00, 3.0, 28, 110.00, 3.2, ARRAY['saude', 'odontologia', 'local']),
('33333333-3333-3333-3333-333333333333', 'Academia FitMax', 'active', 'Revisão', 'Mariana Costa', 'Fitness', 'https://academiafitmax.com.br', 12000.00, 60, 65.00, 5.0, 55, 70.00, 4.8, ARRAY['fitness', 'academia', 'saude']),
('44444444-4444-4444-4444-444444444444', 'Restaurante Sabor & Arte', 'active', 'Rodando', 'Pedro Lima', 'Alimentação', 'https://saborearte.com.br', 6000.00, 40, 45.00, 6.0, 35, 52.00, 5.5, ARRAY['restaurante', 'gastronomia', 'delivery']),
('55555555-5555-5555-5555-555555555555', 'Curso de Inglês FluentWay', 'active', 'Setup inicial', 'Julia Oliveira', 'Educação', 'https://fluentway.com.br', 20000.00, 80, 100.00, 4.0, 75, 105.00, 3.8, ARRAY['educacao', 'idiomas', 'online']);

-- Inserir campanhas de exemplo
INSERT INTO public.campaigns (id, client_id, name, platform, status, objective, external_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Black Friday 2024 - Roupas Femininas', 'meta', 'active', 'conversions', 'meta_123456'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Promoção Verão - Biquínis', 'google_ads', 'active', 'traffic', 'gads_789012'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Clareamento Dental - Promoção', 'meta', 'active', 'lead_generation', 'meta_345678'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Matrícula Janeiro 2025', 'google_ads', 'paused', 'conversions', 'gads_901234'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 'Delivery Final de Semana', 'meta', 'active', 'conversions', 'meta_567890'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555555', 'Curso Intensivo de Inglês', 'google_ads', 'active', 'lead_generation', 'gads_123789');

-- Inserir métricas dos últimos dias
INSERT INTO public.metrics (client_id, campaign_id, date, platform, impressions, clicks, spend, conversions, leads, revenue, ctr, cpa, roas, conv_rate) VALUES
-- Fashion Loja - últimos 7 dias
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '1 day', 'meta', 15420, 892, 1250.00, 12, 8, 4800.00, 5.78, 104.17, 3.84, 1.34),
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', CURRENT_DATE - INTERVAL '2 days', 'meta', 18230, 1045, 1480.00, 15, 11, 6150.00, 5.73, 98.67, 4.16, 1.44),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '1 day', 'google_ads', 12580, 756, 980.00, 9, 6, 3240.00, 6.01, 108.89, 3.31, 1.19),
('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', CURRENT_DATE - INTERVAL '2 days', 'google_ads', 14200, 824, 1120.00, 11, 8, 4180.00, 5.80, 101.82, 3.73, 1.33),

-- Clínica Sorrisos - últimos 7 dias
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '1 day', 'meta', 8450, 385, 650.00, 7, 12, 2100.00, 4.56, 92.86, 3.23, 1.82),
('22222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', CURRENT_DATE - INTERVAL '2 days', 'meta', 9200, 420, 720.00, 8, 14, 2520.00, 4.57, 90.00, 3.50, 1.90),

-- Academia FitMax - últimos 7 dias  
('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '3 days', 'google_ads', 11200, 672, 890.00, 13, 18, 5850.00, 6.00, 68.46, 6.57, 1.93),
('33333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', CURRENT_DATE - INTERVAL '4 days', 'google_ads', 10800, 648, 850.00, 12, 16, 5280.00, 6.00, 70.83, 6.21, 1.85),

-- Restaurante Sabor & Arte - últimos 7 dias
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '1 day', 'meta', 6800, 408, 450.00, 16, 12, 2160.00, 6.00, 28.13, 4.80, 3.92),
('44444444-4444-4444-4444-444444444444', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', CURRENT_DATE - INTERVAL '2 days', 'meta', 7200, 432, 480.00, 18, 14, 2520.00, 6.00, 26.67, 5.25, 4.17),

-- Curso FluentWay - últimos 7 dias
('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', CURRENT_DATE - INTERVAL '1 day', 'google_ads', 22400, 1344, 1680.00, 24, 32, 7200.00, 6.00, 70.00, 4.29, 1.79),
('55555555-5555-5555-5555-555555555555', 'ffffffff-ffff-ffff-ffff-ffffffffffff', CURRENT_DATE - INTERVAL '2 days', 'google_ads', 21800, 1308, 1620.00, 22, 28, 6600.00, 6.00, 73.64, 4.07, 1.68);