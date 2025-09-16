export const saveBuildReport = () => {
  const buildReport = {
    "changes": [
      {"file": "LeadCard.tsx", "summary": "Desabilitado drag para leads Fechado; removido conflito entre click e drag que causava desaparecimento dos cards"},
      {"file": "layout/AppLayout", "summary": "Aplicado gutter único com var --content-gutter-x no wrapper de conteúdo"},
      {"file": "index.css", "summary": "Criada variável CSS --content-gutter-x responsiva (8px lg, 6px md, 4px sm)"}
    ],
    "impacted_routes": ["/leads","/home","/clientes","/cliente/:id/*"],
    "acceptance": {
      "cards_fechado_nao_somem": true,
      "gutter_global_ok": true,
      "gutter_cliente_ok": true,
      "sem_overlay_sidebar": true,
      "kanban_scroll_horizontal_ok": true,
      "sticky_headers_alinhados": true
    },
    "notes": "Correção crítica: cards em Fechado não desaparecem mais ao clicar; mantém funcionalidade de click e botões internos.",
    "timestamp": new Date().toISOString()
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};

// Auto-save report
saveBuildReport();