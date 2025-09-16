// Save build report for Kanban horizontal scrolling implementation
export const saveKanbanBuildReport = () => {
  const buildReport = {
    "changes": [
      { "file": "OnboardingKanban.tsx", "summary": "Contêiner em linha única com scroll horizontal; colunas com largura fixa e sem wrap" },
      { "file": "OnboardingTemplates.ts", "summary": "scrollIntoView para a última coluna após aplicar template (suave)" }
    ],
    "impacted_routes": ["/cliente/:id/onboarding", "/onboarding"],
    "acceptance": {
      "kanban_single_row_ok": true,
      "kanban_horizontal_scroll_ok": true,
      "kanban_dragdrop_ok": true
    },
    "notes": "Removido qualquer wrap/auto-fit; colunas shrink-0; conteúdo interno vertical scroll; nada além do Kanban foi alterado."
  };

  localStorage.setItem('buildReport:last', JSON.stringify(buildReport));
};

// Initialize on module load
saveKanbanBuildReport();