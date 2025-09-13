import React, { useState, useEffect } from 'react';
import { ModalFrameV2 } from "../../pages/client-dashboard/overview/ModalFrameV2";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Settings, Eye, EyeOff } from "lucide-react";
import { useClientPrefs } from "@/shared/prefs/useClientPrefs";
import { useToast } from "@/hooks/use-toast";

interface CampaignsColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const COLUMN_OPTIONS = [
  { key: 'status', label: 'Status', category: 'Básico' },
  { key: 'platform', label: 'Plataforma', category: 'Básico' },
  { key: 'name', label: 'Campanha', category: 'Básico' },
  { key: 'spend', label: 'Investimento', category: 'Básico' },
  { key: 'leads', label: 'Leads', category: 'Performance' },
  { key: 'cpl', label: 'CPL', category: 'Performance' },
  { key: 'cpa', label: 'CPA', category: 'Performance' },
  { key: 'roas', label: 'ROAS', category: 'Performance' },
  { key: 'clicks', label: 'Cliques', category: 'Tráfego' },
  { key: 'impressions', label: 'Impressões', category: 'Tráfego' },
  { key: 'ctr', label: 'CTR', category: 'Tráfego' },
  { key: 'cpc', label: 'CPC', category: 'Tráfego' },
  { key: 'cpm', label: 'CPM', category: 'Tráfego' },
  { key: 'conversions', label: 'Conversões', category: 'Conversão' },
  { key: 'revenue', label: 'Receita', category: 'Conversão' },
  { key: 'convRate', label: 'Taxa Conv.', category: 'Conversão' },
  { key: 'last_sync', label: 'Última Sync', category: 'Sistema' }
];

const DEFAULT_VISIBLE_COLUMNS = [
  'status', 'platform', 'name', 'spend', 'leads', 'cpl', 'cpa', 'roas'
];

export function CampaignsColumnsModal({ isOpen, onClose, clientId }: CampaignsColumnsModalProps) {
  const { prefs, patch } = useClientPrefs(clientId);
  const { toast } = useToast();
  
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Convert array to visibility map
  const toVisibilityFromList = (columnsList: string[]) => {
    const visibility: Record<string, boolean> = {};
    COLUMN_OPTIONS.forEach(col => {
      visibility[col.key] = columnsList.includes(col.key);
    });
    return visibility;
  };

  // Convert visibility map to array
  const toListFromVisibility = (visibility: Record<string, boolean>) => {
    return Object.entries(visibility)
      .filter(([_, visible]) => visible)
      .map(([key]) => key);
  };

  // Initialize state from prefs when modal opens
  useEffect(() => {
    if (isOpen) {
      if (prefs.campaignTableCols) {
        // Convert from object format to visibility map
        const columnsList = Object.entries(prefs.campaignTableCols)
          .filter(([_, visible]) => visible)
          .map(([key]) => key);
        setVisibleColumns(toVisibilityFromList(columnsList));
      } else {
        // Use default columns
        setVisibleColumns(toVisibilityFromList(DEFAULT_VISIBLE_COLUMNS));
      }
      setIsDirty(false);
    }
  }, [isOpen, prefs.campaignTableCols]);

  const handleColumnToggle = (columnKey: string, checked: boolean) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: checked
    }));
    setIsDirty(true);
  };

  const handleSelectAll = () => {
    const allVisible: Record<string, boolean> = {};
    COLUMN_OPTIONS.forEach(col => {
      allVisible[col.key] = true;
    });
    setVisibleColumns(allVisible);
    setIsDirty(true);
  };

  const handleSelectDefault = () => {
    setVisibleColumns(toVisibilityFromList(DEFAULT_VISIBLE_COLUMNS));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const columnsList = toListFromVisibility(visibleColumns);
      const columnVisibility: Record<string, boolean> = {};
      COLUMN_OPTIONS.forEach(col => {
        columnVisibility[col.key] = columnsList.includes(col.key);
      });
      
      await patch({ campaignTableCols: columnVisibility });
      toast({ title: "Colunas salvas", description: "A configuração da tabela foi atualizada." });
      setIsDirty(false);
      onClose();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to current prefs
    if (prefs.campaignTableCols) {
      const columnsList = Object.entries(prefs.campaignTableCols)
        .filter(([_, visible]) => visible)
        .map(([key]) => key);
      setVisibleColumns(toVisibilityFromList(columnsList));
    }
    setIsDirty(false);
    onClose();
  };

  // Group columns by category
  const groupedColumns = COLUMN_OPTIONS.reduce((acc, col) => {
    if (!acc[col.category]) {
      acc[col.category] = [];
    }
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, typeof COLUMN_OPTIONS>);

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;

  // Footer buttons
  const footerButtons = (
    <>
      <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
      <Button variant="secondary" onClick={handleSelectDefault}>Restaurar padrão</Button>
      <Button onClick={handleSave} disabled={!isDirty || isSaving}>
        {isSaving ? "Salvando…" : "Salvar"}
      </Button>
    </>
  );

  // Modal content
  const modalContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          {visibleCount} de {COLUMN_OPTIONS.length} colunas selecionadas
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            <Eye className="h-3 w-3 mr-1" />
            Todas
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectDefault}>
            <EyeOff className="h-3 w-3 mr-1" />
            Padrão
          </Button>
        </div>
      </div>

      <ScrollArea className="space-y-4">
        {Object.entries(groupedColumns).map(([category, columns]) => (
          <div key={category} className="space-y-3">
            <h4 className="text-sm font-medium text-slate-900 border-b border-slate-200 pb-1">
              {category}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {columns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2 p-2 rounded hover:bg-slate-50">
                  <Checkbox
                    id={`column-${column.key}`}
                    checked={visibleColumns[column.key] || false}
                    onCheckedChange={(checked) => handleColumnToggle(column.key, Boolean(checked))}
                  />
                  <label
                    htmlFor={`column-${column.key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {column.label}
                  </label>
                  {visibleColumns[column.key] && (
                    <Eye className="h-3 w-3 text-green-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );

  return (
    <ModalFrameV2 
      isOpen={isOpen} 
      onClose={handleCancel} 
      title="Configurar Colunas da Tabela"
      maxWidth="lg"
      footer={footerButtons}
    >
      {modalContent}
    </ModalFrameV2>
  );
}