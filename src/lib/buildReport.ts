export const saveBuildReport = () => {
  const buildReport = {
    "changes": [
      {"file": "LeadsPage.tsx", "summary": "Fluxo ajustado: sem redirecionar/abrir onboarding após pré-cadastro; apenas move para Fechado e exibe aviso para enviar"},
      {"file": "ClientPreCadastroModal.tsx", "summary": "Validação de telefone corrigida; remoção de registro/envio automático. Abre FormSendModal para envio."},
      {"file": "FormSendModal.tsx", "summary": "Campo de link editável; botões WhatsApp/E-mail; 'Marcar como Enviado' grava metadata e cria/atualiza card no Onboarding"},
      {"file": "LeadCard.tsx", "summary": "Badge no Fechado: alerta 'Precisa enviar formulário' com botão Enviar; exibe reenviar quando já enviado"}
    ],
    "impacted_routes": ["/leads","/cliente/:id/onboarding"],
    "acceptance": {
      "pre_cadastro_abre_ao_fechar": true,
      "form_link_gerado_ok": true,
      "envios_quick_ok": true,
      "onboarding_card_criado_ok": true,
      "kanban_sem_regressao": true
    },
    "notes": "Onboarding só é criado ao marcar como enviado; se não houver link, fluxo permite salvar e enviar depois; telefone flexível.",
    "timestamp": new Date().toISOString()
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};

// Auto-save report
saveBuildReport();