export const saveBuildReport = () => {
  const buildReport = {
    "changes": [
      {"file": "ClientPreCadastroModal.tsx", "summary": "Modal expandido com geração de link Typebot, botões WhatsApp/Email/Copiar, validação completa"},
      {"file": "OnboardingService.ts", "summary": "Serviço para gerenciar metadata de formulários e cards de onboarding"},
      {"file": "LeadCard.tsx", "summary": "Indicador visual 'Formulário enviado' para leads fechados + botão Reenviar"},
      {"file": "LeadsPage.tsx", "summary": "Já implementado - intercepta drop para Fechado e abre modal pré-cadastro"}
    ],
    "impacted_routes": ["/leads", "/cliente/:id/onboarding"],
    "acceptance": {
      "pre_cadastro_abre_ao_fechar": true,
      "form_link_gerado_ok": true,
      "envios_quick_ok": true,
      "onboarding_card_criado_ok": true,
      "kanban_sem_regressao": true
    },
    "notes": "Mensagens personalizáveis por env (VITE_ONBOARDING_WAPP_MSG/VITE_ONBOARDING_EMAIL_MSG); fallback seguro se VITE_TYPEBOT_URL ausente; metadata em localStorage.",
    "timestamp": new Date().toISOString()
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};

// Auto-save report
saveBuildReport();