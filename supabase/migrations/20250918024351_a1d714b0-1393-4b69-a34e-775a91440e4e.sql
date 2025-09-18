-- Inserir clientes de exemplo
INSERT INTO public.clients (id, name, status, stage, owner, segment, website, monthly_budget, goals_leads, goals_cpa, goals_roas, latest_leads, latest_cpa, latest_roas, tags) VALUES
('11111111-1111-1111-1111-111111111111', 'Loja Virtual Fashion', 'ativo', 'crescimento', 'Ana Silva', 'E-commerce', 'https://fashionloja.com.br', 15000.00, 50, 80.00, 4.5, 42, 95.50, 4.2, ARRAY['moda', 'varejo', 'online']),
('22222222-2222-2222-2222-222222222222', 'Clínica Odontológica Sorrisos', 'ativo', 'expansao', 'Carlos Santos', 'Saúde', 'https://clinicasorrisos.com.br', 8000.00, 25, 120.00, 3.0, 28, 110.00, 3.2, ARRAY['saude', 'odontologia', 'local']),
('33333333-3333-3333-3333-333333333333', 'Academia FitMax', 'ativo', 'otimizacao', 'Mariana Costa', 'Fitness', 'https://academiafitmax.com.br', 12000.00, 60, 65.00, 5.0, 55, 70.00, 4.8, ARRAY['fitness', 'academia', 'saude']),
('44444444-4444-4444-4444-444444444444', 'Restaurante Sabor & Arte', 'ativo', 'crescimento', 'Pedro Lima', 'Alimentação', 'https://saborearte.com.br', 6000.00, 40, 45.00, 6.0, 35, 52.00, 5.5, ARRAY['restaurante', 'gastronomia', 'delivery']),
('55555555-5555-5555-5555-555555555555', 'Curso de Inglês FluentWay', 'ativo', 'expansao', 'Julia Oliveira', 'Educação', 'https://fluentway.com.br', 20000.00, 80, 100.00, 4.0, 75, 105.00, 3.8, ARRAY['educacao', 'idiomas', 'online']);

-- Inserir campanhas de exemplo
INSERT INTO public.campaigns (id, client_id, name, platform, status, objective, external_id) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Black Friday 2024 - Roupas Femininas', 'meta', 'ativa', 'conversions', 'meta_123456'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Promoção Verão - Biquínis', 'google_ads', 'ativa', 'traffic', 'gads_789012'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Clareamento Dental - Promoção', 'meta', 'ativa', 'lead_generation', 'meta_345678'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Matrícula Janeiro 2025', 'google_ads', 'pausada', 'conversions', 'gads_901234'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '44444444-4444-4444-4444-444444444444', 'Delivery Final de Semana', 'meta', 'ativa', 'conversions', 'meta_567890'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '55555555-5555-5555-5555-555555555555', 'Curso Intensivo de Inglês', 'google_ads', 'ativa', 'lead_generation', 'gads_123789');

-- Inserir métricas dos últimos 30 dias
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

-- Inserir alertas de exemplo
INSERT INTO public.alerts (id, client_id, title, message, type, level, action_url, is_read, dismissed) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CPA acima da meta', 'O CPA da campanha Black Friday está 15% acima da meta definida', 'performance', 'warning', '/client/11111111-1111-1111-1111-111111111111/optimizations', false, false),
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Orçamento quase esgotado', 'A campanha está com 85% do orçamento mensal consumido', 'budget', 'high', '/client/22222222-2222-2222-2222-222222222222/campaigns', false, false),
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Queda no CTR', 'CTR da campanha caiu 20% nos últimos 3 dias', 'performance', 'medium', '/client/33333333-3333-3333-3333-333333333333/analytics', true, false),
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Meta de leads atingida', 'Parabéns! Meta mensal de leads foi atingida com 5 dias de antecedência', 'success', 'info', '/client/44444444-4444-4444-4444-444444444444/dashboard', false, false);

-- Inserir tarefas de exemplo
INSERT INTO public.tasks (id, client_id, title, description, owner, priority, status, due_date) VALUES
('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Revisar copy dos anúncios', 'Analisar e otimizar o copy das campanhas de Black Friday para melhorar CTR', 'Ana Silva', 'high', 'open', CURRENT_DATE + INTERVAL '2 days'),
('t2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Configurar pixels de conversão', 'Implementar tracking adequado para procedimentos odontológicos', 'Carlos Santos', 'medium', 'in_progress', CURRENT_DATE + INTERVAL '5 days'),
('t3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Testar novas audiences', 'Criar e testar 3 novas audiences para campanhas de matrícula', 'Mariana Costa', 'medium', 'open', CURRENT_DATE + INTERVAL '7 days'),
('t4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Análise de concorrência', 'Mapear estratégias dos principais concorrentes no delivery', 'Pedro Lima', 'low', 'completed', CURRENT_DATE - INTERVAL '1 day'),
('t5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Criar landing page', 'Desenvolver LP específica para curso intensivo de inglês', 'Julia Oliveira', 'high', 'open', CURRENT_DATE + INTERVAL '3 days');

-- Inserir otimizações de exemplo
INSERT INTO public.optimizations (id, client_id, title, type, objective, hypothesis, status, start_date, expected_impact, target_metric, campaigns) VALUES
('o1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Otimização de Audiences Lookalike', 'audience', 'Reduzir CPA em 20%', 'Audiences lookalike baseadas em compradores recentes devem ter melhor qualidade', 'in_progress', CURRENT_DATE - INTERVAL '3 days', 'medium', 'cpa', ARRAY['Black Friday 2024 - Roupas Femininas']),
('o2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Ajuste de Horários de Veiculação', 'scheduling', 'Aumentar lead quality', 'Veicular anúncios apenas em horários comerciais deve melhorar qualidade dos leads', 'planned', CURRENT_DATE + INTERVAL '1 day', 'high', 'lead_quality', ARRAY['Clareamento Dental - Promoção']),
('o3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Teste A/B de Criativos', 'creative', 'Melhorar CTR em 15%', 'Criativos com pessoas fazendo exercícios devem ter melhor performance', 'completed', CURRENT_DATE - INTERVAL '10 days', 'high', 'ctr', ARRAY['Matrícula Janeiro 2025']),
('o4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Implementação de Smart Bidding', 'bidding', 'Otimizar automaticamente lances', 'Smart Bidding deve melhorar performance geral das campanhas', 'planned', CURRENT_DATE + INTERVAL '5 days', 'medium', 'roas', ARRAY['Curso Intensivo de Inglês']);

-- Inserir notas de exemplo
INSERT INTO public.notes (id, client_id, title, content, tags, pinned) VALUES
('n1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Reunião de Briefing - Black Friday', 'Cliente solicitou foco em produtos com maior margem durante a Black Friday. Priorizar vestidos e casacos. Orçamento extra de R$ 5.000 aprovado para o período.', ARRAY['reuniao', 'briefing', 'black-friday'], true),
('n2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Insights do Google Analytics', 'Usuários que chegam via anúncios do Google têm 30% mais chance de agendar consulta que os do Meta. Considerar realocar orçamento.', ARRAY['analytics', 'insights', 'conversao'], false),
('n3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Feedback do Cliente', 'Academia reportou aumento de 40% nas matrículas vindas dos anúncios online. Cliente muito satisfeito com resultados.', ARRAY['feedback', 'resultados', 'satisfacao'], true),
('n4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Sazonalidade do Delivery', 'Pedidos aumentam 60% nos finais de semana. Ajustar estratégia de lances para sexta, sábado e domingo.', ARRAY['sazonalidade', 'delivery', 'weekend'], false);

-- Inserir contatos dos clientes
INSERT INTO public.client_contacts (client_id, name, email, phone, role, is_primary) VALUES
('11111111-1111-1111-1111-111111111111', 'Maria Fernanda', 'maria@fashionloja.com.br', '(11) 99999-1111', 'Proprietária', true),
('11111111-1111-1111-1111-111111111111', 'João Marketing', 'joao@fashionloja.com.br', '(11) 99999-1112', 'Coordenador de Marketing', false),
('22222222-2222-2222-2222-222222222222', 'Dr. Roberto Silva', 'roberto@clinicasorrisos.com.br', '(11) 99999-2222', 'Dentista Proprietário', true),
('33333333-3333-3333-3333-333333333333', 'Carla Fitness', 'carla@academiafitmax.com.br', '(11) 99999-3333', 'Gerente Geral', true),
('44444444-4444-4444-4444-444444444444', 'Chef André', 'andre@saborearte.com.br', '(11) 99999-4444', 'Chef e Proprietário', true),
('55555555-5555-5555-5555-555555555555', 'Professora Elena', 'elena@fluentway.com.br', '(11) 99999-5555', 'Diretora Pedagógica', true);

-- Inserir informações de acesso dos clientes
INSERT INTO public.client_access (client_id, has_google_ads_access, has_meta_access, has_ga4_access, google_ads_customer_id, meta_ad_account_id, ga4_property_id, business_manager, notes) VALUES
('11111111-1111-1111-1111-111111111111', true, true, true, '123-456-7890', 'act_1234567890', 'GA4-FASHION-001', 'BM Fashion Store', 'Acesso completo liberado. Pixel instalado corretamente.'),
('22222222-2222-2222-2222-222222222222', false, true, true, null, 'act_2345678901', 'GA4-CLINICA-002', 'BM Clínica Sorrisos', 'Pendente liberação Google Ads. Meta funcionando bem.'),
('33333333-3333-3333-3333-333333333333', true, false, true, '234-567-8901', null, 'GA4-FITMAX-003', null, 'Meta Ads em processo de aprovação. Google Ads ativo.'),
('44444444-4444-4444-4444-444444444444', true, true, false, '345-678-9012', 'act_3456789012', null, 'BM Sabor Arte', 'GA4 em implementação. Campanhas funcionando normalmente.'),
('55555555-5555-5555-5555-555555555555', true, true, true, '456-789-0123', 'act_4567890123', 'GA4-FLUENT-005', 'BM FluentWay', 'Setup completo. Tracking de leads configurado corretamente.');