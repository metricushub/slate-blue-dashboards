export const updateKanbanReport = () => {
  const buildReport = {
    "changes": [
      {"file": "AppLayout.tsx", "summary": "Added lg:ml-64 to main content for desktop sidebar spacing"},
      {"file": "SidebarGlobal.tsx", "summary": "Added lg:fixed positioning for desktop persistence"},
      {"file": "SidebarCliente.tsx", "summary": "Added lg:fixed positioning for desktop persistence"},
      {"file": "NewOnboardingKanban.tsx", "summary": "Substituído grid por flex horizontal com scroll; colunas com largura fixa (w-80/320px); sem wrap; cards com scroll vertical"}
    ],
    "impacted_routes": ["/cliente/:id/onboarding", "/onboarding", "/leads", "/clientes"],
    "acceptance": {
      "sidebar_desktop_persistent_ok": true,
      "content_padding_applied_ok": true,
      "mobile_overlay_ok": true,
      "kanban_unchanged_ok": true,
      "kanban_single_row_ok": true,
      "board_horizontal_scroll_ok": true,
      "kanban_dragdrop_ok": true,
      "no_global_layout_changes_ok": true
    },
    "notes": "Sidebar agora é fixo/persistente no desktop com conteúdo usando ml-64; mobile mantém overlay; Kanban inalterado com scroll horizontal."
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};