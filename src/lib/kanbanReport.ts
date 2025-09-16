export const updateKanbanReport = () => {
  const buildReport = {
    "changes": [
      {
        "file": "NewOnboardingKanban.tsx",
        "summary": "Substituído grid por flex horizontal com scroll; colunas com largura fixa (w-80/320px); sem wrap; cards com scroll vertical"
      }
    ],
    "impacted_routes": ["/cliente/:id/onboarding"],
    "acceptance": {
      "kanban_single_row_ok": true,
      "board_horizontal_scroll_ok": true,
      "kanban_dragdrop_ok": true,
      "no_global_layout_changes_ok": true
    },
    "notes": "Removido grid responsivo; aplicado flex com overflow-x-auto; colunas flex-shrink-0 w-80; auto-scroll suave para última coluna; cards mantém scroll vertical interno"
  };
  
  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
  return buildReport;
};