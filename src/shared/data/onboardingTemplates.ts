// Templates de cards de onboarding para cada etapa

export interface OnboardingTemplate {
  stage: 'dados-gerais' | 'financeiro' | 'implementacao' | 'briefing' | 'configuracao';
  title: string;
  checklist: string[];
}

export const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    stage: 'dados-gerais',
    title: 'Coleta de Dados Gerais do Cliente',
    checklist: [
      'Coletar informações básicas da empresa (razão social, CNPJ, endereço)',
      'Definir pessoas-chave de contato (comercial, técnico, financeiro)',
      'Identificar estrutura organizacional e hierarquias',
      'Levantar informações sobre mercado e público-alvo',
      'Documentar objetivos e expectativas do cliente',
      'Avaliar histórico de marketing digital anterior',
      'Definir cronograma inicial do projeto'
    ]
  },
  {
    stage: 'financeiro',
    title: 'Configuração Financeira',
    checklist: [
      'Cadastrar cliente no sistema financeiro',
      'Configurar dados bancários para faturamento',
      'Definir ciclo de cobrança e forma de pagamento',
      'Estabelecer limites de investimento em mídia',
      'Configurar aprovações orçamentárias',
      'Documentar política de reembolsos e ajustes',
      'Criar estrutura de relatórios financeiros'
    ]
  },
  {
    stage: 'implementacao',
    title: 'Implementação Cliente',
    checklist: [
      'Configurar acessos às plataformas de mídia',
      'Instalar pixels de conversão nos sites',
      'Configurar Google Analytics e Google Tag Manager',
      'Implementar ferramentas de tracking',
      'Testar integrações de dados',
      'Configurar dashboards de monitoramento',
      'Validar fluxos de conversão'
    ]
  },
  {
    stage: 'briefing',
    title: 'Briefing & 1º Contato/Reuniões',
    checklist: [
      'Agendar reunião de kickoff do projeto',
      'Apresentar equipe e metodologia de trabalho',
      'Coletar briefing detalhado de campanhas',
      'Definir personas e público-alvo',
      'Estabelecer KPIs e metas de performance',
      'Alinhar expectativas e cronograma',
      'Documentar acordos da reunião'
    ]
  },
  {
    stage: 'configuracao',
    title: 'Reunião de Configuração — Informações Necessárias',
    checklist: [
      'Revisar todas as configurações técnicas',
      'Validar estrutura de campanhas proposta',
      'Confirmar orçamentos e distribuição de verba',
      'Testar todos os pontos de integração',
      'Definir processo de comunicação e reportes',
      'Estabelecer calendário de reuniões regulares',
      'Finalizar documentação do onboarding'
    ]
  }
];

// Função para criar card a partir de template
export function createCardFromTemplate(
  template: OnboardingTemplate, 
  clientId?: string, 
  clientName?: string,
  responsavel?: string
) {
  return {
    title: template.title,
    clientId: clientId || '',
    clientName: clientName || '',
    responsavel: responsavel || '',
    vencimento: '',
    checklist: [...template.checklist],
    notas: `Template criado para ${template.stage}`,
    stage: template.stage,
    subStage: undefined as any,
  };
}

// Função para obter template por etapa
export function getTemplateByStage(stage: string): OnboardingTemplate | undefined {
  // Get templates from localStorage with updated structure
  const getStoredTemplates = () => {
    try {
      const stored = localStorage.getItem('onboarding:templates');
      if (stored) {
        const templates = JSON.parse(stored);
        return templates.find((t: any) => t.stage === stage && t.isDefault) || 
               templates.find((t: any) => t.stage === stage) ||
               ONBOARDING_TEMPLATES.find(t => t.stage === stage);
      }
    } catch (error) {
      console.warn('Error loading stored templates:', error);
    }
    return ONBOARDING_TEMPLATES.find(t => t.stage === stage);
  };

  const template = getStoredTemplates();
  return template;
}

// Get all available templates for a stage (including custom ones)
export function getTemplatesByStage(stage: string): OnboardingTemplate[] {
  const templates: OnboardingTemplate[] = [];
  
  // Add stored custom templates
  try {
    const stored = localStorage.getItem('onboarding:templates');
    if (stored) {
      const customTemplates = JSON.parse(stored);
      templates.push(...customTemplates.filter((t: any) => t.stage === stage));
    }
  } catch (error) {
    console.warn('Error loading stored templates:', error);
  }
  
  // Add default templates if no custom ones exist for this stage
  if (templates.length === 0) {
    const defaultTemplate = ONBOARDING_TEMPLATES.find(t => t.stage === stage);
    if (defaultTemplate) {
      templates.push(defaultTemplate);
    }
  }
  
  return templates;
}

// Get all templates for wizard selection
export function getAllTemplateOptions() {
  try {
    const stored = localStorage.getItem('onboarding:templates');
    if (stored) {
      const customTemplates = JSON.parse(stored);
      return customTemplates.map((t: any) => ({
        id: t.id,
        name: t.name, 
        description: t.description,
        stage: t.stage,
        isDefault: t.isDefault
      }));
    }
  } catch (error) {
    console.warn('Error loading stored templates:', error);
  }
  
  // Return default template options
  return [
    { id: 'padrao', name: 'Padrão', description: 'Template completo com todas as etapas', isDefault: true },
    { id: 'express', name: 'Express', description: 'Versão simplificada para clientes urgentes', isDefault: false },
    { id: 'premium', name: 'Premium', description: 'Template avançado com etapas extras', isDefault: false }
  ];
}