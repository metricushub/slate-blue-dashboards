export interface LeadAnalytics {
  conversionRates: {
    novoToQualificacao: number;
    qualificacaoToProposta: number;
    propostaToFechado: number;
    overall: number;
  };
  averageTimeInStage: {
    novo: number; // days
    qualificacao: number;
    proposta: number;
  };
  lossReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  funnelMetrics: {
    stage: string;
    count: number;
    value: number;
    conversionRate: number;
    dropOffRate: number;
  }[];
  periodComparison: {
    current: {
      totalLeads: number;
      closedDeals: number;
      revenue: number;
    };
    previous: {
      totalLeads: number;
      closedDeals: number;
      revenue: number;
    };
    growth: {
      leads: number;
      deals: number;
      revenue: number;
    };
  };
}

export interface StageTransition {
  id: string;
  leadId: string;
  fromStage: string;
  toStage: string;
  timestamp: string;
  userId?: string;
  notes?: string;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'stage_change' | 'note_added' | 'call' | 'email' | 'meeting' | 'loss_reason';
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}