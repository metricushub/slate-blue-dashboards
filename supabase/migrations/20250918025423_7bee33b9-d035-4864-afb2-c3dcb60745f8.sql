-- Inserir o restante dos dados de exemplo

-- Alertas
INSERT INTO public.alerts (id, client_id, title, message, type, level, action_url, is_read, dismissed) VALUES
('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CPA acima da meta', 'O CPA da campanha Black Friday está 15% acima da meta definida', 'performance', 'medium', '/client/11111111-1111-1111-1111-111111111111/optimizations', false, false),
('a2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Orçamento quase esgotado', 'A campanha está com 85% do orçamento mensal consumido', 'budget', 'high', '/client/22222222-2222-2222-2222-222222222222/campaigns', false, false),
('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Queda no CTR', 'CTR da campanha caiu 20% nos últimos 3 dias', 'performance', 'medium', '/client/33333333-3333-3333-3333-333333333333/analytics', true, false),
('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Meta de leads atingida', 'Parabéns! Meta mensal de leads foi atingida com 5 dias de antecedência', 'info', 'low', '/client/44444444-4444-4444-4444-444444444444/dashboard', false, false);

-- Tarefas
INSERT INTO public.tasks (id, client_id, title, description, owner, priority, status, due_date) VALUES
('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Revisar copy dos anúncios', 'Analisar e otimizar o copy das campanhas de Black Friday para melhorar CTR', 'Ana Silva', 'high', 'open', CURRENT_DATE + INTERVAL '2 days'),
('t2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Configurar pixels de conversão', 'Implementar tracking adequado para procedimentos odontológicos', 'Carlos Santos', 'medium', 'in_progress', CURRENT_DATE + INTERVAL '5 days'),
('t3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Testar novas audiences', 'Criar e testar 3 novas audiences para campanhas de matrícula', 'Mariana Costa', 'medium', 'open', CURRENT_DATE + INTERVAL '7 days'),
('t4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Análise de concorrência', 'Mapear estratégias dos principais concorrentes no delivery', 'Pedro Lima', 'low', 'completed', CURRENT_DATE - INTERVAL '1 day'),
('t5555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', 'Criar landing page', 'Desenvolver LP específica para curso intensivo de inglês', 'Julia Oliveira', 'high', 'open', CURRENT_DATE + INTERVAL '3 days');

-- Otimizações
INSERT INTO public.optimizations (id, client_id, title, type, objective, hypothesis, status, start_date, expected_impact, target_metric, campaigns) VALUES
('o1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Otimização de Audiences Lookalike', 'audience', 'Reduzir CPA em 20%', 'Audiences lookalike baseadas em compradores recentes devem ter melhor qualidade', 'in_progress', CURRENT_DATE - INTERVAL '3 days', 'medium', 'cpa', ARRAY['Black Friday 2024 - Roupas Femininas']),
('o2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Ajuste de Horários de Veiculação', 'scheduling', 'Aumentar lead quality', 'Veicular anúncios apenas em horários comerciais deve melhorar qualidade dos leads', 'planned', CURRENT_DATE + INTERVAL '1 day', 'high', 'lead_quality', ARRAY['Clareamento Dental - Promoção']),
('o3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Teste A/B de Criativos', 'creative', 'Melhorar CTR em 15%', 'Criativos com pessoas fazendo exercícios devem ter melhor performance', 'completed', CURRENT_DATE - INTERVAL '10 days', 'high', 'ctr', ARRAY['Matrícula Janeiro 2025']),
('o4444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'Implementação de Smart Bidding', 'bidding', 'Otimizar automaticamente lances', 'Smart Bidding deve melhorar performance geral das campanhas', 'planned', CURRENT_DATE + INTERVAL '5 days', 'medium', 'roas', ARRAY['Curso Intensivo de Inglês']);

-- Notas
INSERT INTO public.notes (id, client_id, title, content, tags, pinned) VALUES
('n1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Reunião de Briefing - Black Friday', 'Cliente solicitou foco em produtos com maior margem durante a Black Friday. Priorizar vestidos e casacos. Orçamento extra de R$ 5.000 aprovado para o período.', ARRAY['reuniao', 'briefing', 'black-friday'], true),
('n2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Insights do Google Analytics', 'Usuários que chegam via anúncios do Google têm 30% mais chance de agendar consulta que os do Meta. Considerar realocar orçamento.', ARRAY['analytics', 'insights', 'conversao'], false),
('n3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Feedback do Cliente', 'Academia reportou aumento de 40% nas matrículas vindas dos anúncios online. Cliente muito satisfeito com resultados.', ARRAY['feedback', 'resultados', 'satisfacao'], true),
('n4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'Sazonalidade do Delivery', 'Pedidos aumentam 60% nos finais de semana. Ajustar estratégia de lances para sexta, sábado e domingo.', ARRAY['sazonalidade', 'delivery', 'weekend'], false);

-- Contatos dos clientes
INSERT INTO public.client_contacts (client_id, name, email, phone, role, is_primary) VALUES
('11111111-1111-1111-1111-111111111111', 'Maria Fernanda', 'maria@fashionloja.com.br', '(11) 99999-1111', 'Proprietária', true),
('11111111-1111-1111-1111-111111111111', 'João Marketing', 'joao@fashionloja.com.br', '(11) 99999-1112', 'Coordenador de Marketing', false),
('22222222-2222-2222-2222-222222222222', 'Dr. Roberto Silva', 'roberto@clinicasorrisos.com.br', '(11) 99999-2222', 'Dentista Proprietário', true),
('33333333-3333-3333-3333-333333333333', 'Carla Fitness', 'carla@academiafitmax.com.br', '(11) 99999-3333', 'Gerente Geral', true),
('44444444-4444-4444-4444-444444444444', 'Chef André', 'andre@saborearte.com.br', '(11) 99999-4444', 'Chef e Proprietário', true),
('55555555-5555-5555-5555-555555555555', 'Professora Elena', 'elena@fluentway.com.br', '(11) 99999-5555', 'Diretora Pedagógica', true);

-- Informações de acesso dos clientes
INSERT INTO public.client_access (client_id, has_google_ads_access, has_meta_access, has_ga4_access, google_ads_customer_id, meta_ad_account_id, ga4_property_id, business_manager, notes) VALUES
('11111111-1111-1111-1111-111111111111', true, true, true, '123-456-7890', 'act_1234567890', 'GA4-FASHION-001', 'BM Fashion Store', 'Acesso completo liberado. Pixel instalado corretamente.'),
('22222222-2222-2222-2222-222222222222', false, true, true, null, 'act_2345678901', 'GA4-CLINICA-002', 'BM Clínica Sorrisos', 'Pendente liberação Google Ads. Meta funcionando bem.'),
('33333333-3333-3333-3333-333333333333', true, false, true, '234-567-8901', null, 'GA4-FITMAX-003', null, 'Meta Ads em processo de aprovação. Google Ads ativo.'),
('44444444-4444-4444-4444-444444444444', true, true, false, '345-678-9012', 'act_3456789012', null, 'BM Sabor Arte', 'GA4 em implementação. Campanhas funcionando normalmente.'),
('55555555-5555-5555-5555-555555555555', true, true, true, '456-789-0123', 'act_4567890123', 'GA4-FLUENT-005', 'BM FluentWay', 'Setup completo. Tracking de leads configurado corretamente.');

-- Corrigir o search_path das funções existentes para resolver warning de segurança
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;