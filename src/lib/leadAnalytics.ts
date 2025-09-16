import { Lead, LeadStage } from '@/types';
import { LeadAnalytics, StageTransition } from '@/types/analytics';

export class LeadAnalyticsService {
  
  static calculateConversionRates(leads: Lead[]): LeadAnalytics['conversionRates'] {
    const stageCounts = this.getStageDistribution(leads);
    
    const novoToQualificacao = stageCounts.Novo > 0 
      ? (stageCounts.Qualificação + stageCounts.Proposta + stageCounts.Fechado) / stageCounts.Novo 
      : 0;
    
    const qualificacaoToProposta = stageCounts.Qualificação > 0
      ? (stageCounts.Proposta + stageCounts.Fechado) / stageCounts.Qualificação
      : 0;
    
    const propostaToFechado = stageCounts.Proposta > 0
      ? stageCounts.Fechado / stageCounts.Proposta
      : 0;
    
    const overall = leads.length > 0 ? stageCounts.Fechado / leads.length : 0;
    
    return {
      novoToQualificacao: Math.round(novoToQualificacao * 100),
      qualificacaoToProposta: Math.round(qualificacaoToProposta * 100),
      propostaToFechado: Math.round(propostaToFechado * 100),
      overall: Math.round(overall * 100),
    };
  }
  
  static getStageDistribution(leads: Lead[]): Record<LeadStage, number> {
    return leads.reduce((acc, lead) => {
      acc[lead.stage] = (acc[lead.stage] || 0) + 1;
      return acc;
    }, {} as Record<LeadStage, number>);
  }
  
  static calculateAverageTimeInStage(leads: Lead[]): LeadAnalytics['averageTimeInStage'] {
    // Simplified calculation - in real app would track stage transitions
    const now = new Date();
    
    const stageAverages = {
      novo: 0,
      qualificacao: 0,
      proposta: 0,
    };
    
    const stageCounts = { novo: 0, qualificacao: 0, proposta: 0 };
    
    leads.forEach(lead => {
      const createdDate = new Date(lead.created_at);
      const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (lead.stage) {
        case 'Novo':
          stageAverages.novo += daysSinceCreated;
          stageCounts.novo++;
          break;
        case 'Qualificação':
          stageAverages.qualificacao += daysSinceCreated;
          stageCounts.qualificacao++;
          break;
        case 'Proposta':
          stageAverages.proposta += daysSinceCreated;
          stageCounts.proposta++;
          break;
      }
    });
    
    return {
      novo: stageCounts.novo > 0 ? Math.round(stageAverages.novo / stageCounts.novo) : 0,
      qualificacao: stageCounts.qualificacao > 0 ? Math.round(stageAverages.qualificacao / stageCounts.qualificacao) : 0,
      proposta: stageCounts.proposta > 0 ? Math.round(stageAverages.proposta / stageCounts.proposta) : 0,
    };
  }
  
  static getLossReasons(leads: Lead[]): LeadAnalytics['lossReasons'] {
    const lostLeads = leads.filter(lead => lead.lossReason);
    const reasonCounts = lostLeads.reduce((acc, lead) => {
      if (lead.lossReason) {
        acc[lead.lossReason] = (acc[lead.lossReason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    const total = lostLeads.length;
    
    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  static getFunnelMetrics(leads: Lead[]): LeadAnalytics['funnelMetrics'] {
    const stages: LeadStage[] = ['Novo', 'Qualificação', 'Proposta', 'Fechado'];
    const stageData = this.getStageDistribution(leads);
    const totalLeads = leads.length;
    
    return stages.map((stage, index) => {
      const count = stageData[stage] || 0;
      const value = leads
        .filter(lead => lead.stage === stage)
        .reduce((sum, lead) => sum + (lead.value || 0), 0);
      
      const conversionRate = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
      const previousStageCount = index > 0 ? (stageData[stages[index - 1]] || 0) : totalLeads;
      const dropOffRate = previousStageCount > 0 ? Math.round(((previousStageCount - count) / previousStageCount) * 100) : 0;
      
      return {
        stage,
        count,
        value,
        conversionRate,
        dropOffRate: index > 0 ? dropOffRate : 0,
      };
    });
  }
  
  static getPeriodComparison(
    currentLeads: Lead[], 
    previousLeads: Lead[]
  ): LeadAnalytics['periodComparison'] {
    const currentClosed = currentLeads.filter(lead => lead.stage === 'Fechado');
    const previousClosed = previousLeads.filter(lead => lead.stage === 'Fechado');
    
    const currentRevenue = currentClosed.reduce((sum, lead) => sum + (lead.value || 0), 0);
    const previousRevenue = previousClosed.reduce((sum, lead) => sum + (lead.value || 0), 0);
    
    const leadGrowth = previousLeads.length > 0 
      ? Math.round(((currentLeads.length - previousLeads.length) / previousLeads.length) * 100)
      : 0;
    
    const dealsGrowth = previousClosed.length > 0
      ? Math.round(((currentClosed.length - previousClosed.length) / previousClosed.length) * 100)
      : 0;
    
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;
    
    return {
      current: {
        totalLeads: currentLeads.length,
        closedDeals: currentClosed.length,
        revenue: currentRevenue,
      },
      previous: {
        totalLeads: previousLeads.length,
        closedDeals: previousClosed.length,
        revenue: previousRevenue,
      },
      growth: {
        leads: leadGrowth,
        deals: dealsGrowth,
        revenue: revenueGrowth,
      },
    };
  }
  
  static generateAnalytics(currentLeads: Lead[], previousLeads: Lead[] = []): LeadAnalytics {
    return {
      conversionRates: this.calculateConversionRates(currentLeads),
      averageTimeInStage: this.calculateAverageTimeInStage(currentLeads),
      lossReasons: this.getLossReasons(currentLeads),
      funnelMetrics: this.getFunnelMetrics(currentLeads),
      periodComparison: this.getPeriodComparison(currentLeads, previousLeads),
    };
  }
}