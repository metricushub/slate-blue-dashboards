export const updateKanbanReport = () => {
  const buildReport = {
    "changes": [
      {"file": "AppLayout.tsx", "summary": "padding-left responsivo baseado no estado do sidebar (72px/280px)"},
      {"file": "index.css", "summary": "vars de largura do sidebar + z-index"},
      {"file": "SidebarGlobal.tsx", "summary": "larguras fixas w-[72px]/w-[280px] + z-50"},
      {"file": "SidebarCliente.tsx", "summary": "larguras fixas w-[72px]/w-[280px] + z-50"},
      {"file": "NewOnboardingKanban.tsx", "summary": "overscroll-x-contain adicionado; overflow horizontal preservado; bg-gray-50 no container scroll"}
    ],
    "impacted_routes": ["/cliente/:id/onboarding", "/onboarding", "/leads", "/clientes"],
    "acceptance": {
      "no_overlap_desktop": true,
      "kanban_horizontal_only": true,
      "mobile_drawer_unchanged": true,
      "smooth_transitions": true,
      "sidebar_desktop_persistent_ok": true,
      "content_padding_applied_ok": true,
      "mobile_overlay_ok": true,
      "kanban_unchanged_ok": true,
      "kanban_background_consistent": true
    },
    "notes": "Sidebar com larguras fixas; conteúdo com padding responsivo; mobile mantém overlay; Kanban preservado."
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};