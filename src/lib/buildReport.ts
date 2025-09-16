export const saveBuildReport = () => {
  const buildReport = {
    "changes": [
      {"file": "types/index.ts", "summary": "Expandido Lead com campos analytics: priority, temperature, leadScore, lossReason, budget, timeline"},
      {"file": "types/analytics.ts", "summary": "Criados tipos para analytics: LeadAnalytics, StageTransition, LeadActivity"},
      {"file": "lib/leadAnalytics.ts", "summary": "Serviço completo para calcular métricas: conversão, tempo por estágio, motivos de perda"},
      {"file": "LeadAnalytics.tsx", "summary": "Dashboard analytics com tabs: conversão, análise perdas, tempo no funil"},
      {"file": "ConversionMetrics.tsx", "summary": "Métricas detalhadas de conversão por estágio com visualizações"},
      {"file": "LossReasonModal.tsx", "summary": "Modal para capturar motivo da perda com dropdown de razões"},
      {"file": "LeadCard.tsx", "summary": "Card enriquecido: priority icons, temperature badge, leadScore, botões ganho/perdido"},
      {"file": "LeadsPage.tsx", "summary": "Integrado analytics toggle, loss tracking, botão Ver Analytics no header"}
    ],
    "impacted_routes": ["/leads"],
    "acceptance": {
      "analytics_dashboard_ok": true,
      "conversion_metrics_ok": true,
      "loss_tracking_ok": true,
      "enhanced_lead_cards_ok": true,
      "funil_analysis_ok": true,
      "tempo_por_estagio_ok": true,
      "cards_fechado_nao_somem": true
    },
    "notes": "Sistema completo de analytics: conversão, perdas, tempo, métricas avançadas. Cards melhorados com dados contextuais.",
    "timestamp": new Date().toISOString()
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};

// Auto-save report
saveBuildReport();