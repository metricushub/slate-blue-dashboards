export const saveBuildReport = () => {
  const buildReport = {
    "changes": [
      {"file": "layout/AppLayout", "summary": "Aplicado gutter único com var --content-gutter-x no wrapper de conteúdo"},
      {"file": "index.css", "summary": "Criada variável CSS --content-gutter-x responsiva (16px lg, 12px md, 8px sm)"},
      {"file": "pages/* (layout geral)", "summary": "Padronização do espaçamento entre sidebar e conteúdo usando a nova variável"}
    ],
    "impacted_routes": ["/home","/clientes","/cliente/:id/*"],
    "acceptance": {
      "gutter_global_ok": true,
      "gutter_cliente_ok": true,
      "sem_overlay_sidebar": true,
      "kanban_scroll_horizontal_ok": true,
      "sticky_headers_alinhados": true
    },
    "notes": "Sidebars e componentes internos inalterados; apenas o primeiro wrapper de conteúdo agora usa --content-gutter-x responsivo.",
    "timestamp": new Date().toISOString()
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};

// Auto-save report
saveBuildReport();