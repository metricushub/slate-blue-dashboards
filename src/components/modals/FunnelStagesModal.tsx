import React, { useState, useEffect, useMemo } from 'react';
import { ModalFrameV2 } from "../../pages/client-dashboard/overview/ModalFrameV2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { useClientPrefs, FunnelStagePrefs } from "@/shared/prefs/useClientPrefs";
import { useToast } from "@/hooks/use-toast";

interface FunnelStagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const AVAILABLE_METRICS = [
  { key: 'impressions', label: 'Impressões' },
  { key: 'clicks', label: 'Cliques' },
  { key: 'leads', label: 'Leads' },
  { key: 'revenue', label: 'Receita' },
  { key: 'spend', label: 'Investimento' },
  { key: 'conversions', label: 'Conversões' }
];

const DEFAULT_STAGES: FunnelStagePrefs[] = [
  { id: 's1', label: 'Impressões', metric: 'impressions', userLabel: false },
  { id: 's2', label: 'Cliques', metric: 'clicks', userLabel: false },
  { id: 's3', label: 'Leads', metric: 'leads', userLabel: false },
  { id: 's4', label: 'Receita', metric: 'revenue', userLabel: false }
];

export function FunnelStagesModal({ isOpen, onClose, clientId }: FunnelStagesModalProps) {
  const { prefs, patch } = useClientPrefs(clientId);
  const { toast } = useToast();
  
  const [stages, setStages] = useState<FunnelStagePrefs[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get stages from prefs or use defaults - never null/undefined
  const initialStages = useMemo(() => {
    return prefs?.funnelPrefs?.stages?.length > 0 ? prefs.funnelPrefs.stages : DEFAULT_STAGES;
  }, [prefs]);

  // Initialize stages when modal opens or prefs change
  useEffect(() => {
    if (isOpen) {
      setStages([...initialStages]);
      setIsDirty(false);
    }
  }, [isOpen, initialStages]);

  const handleAddStage = () => {
    if (stages.length >= 8) {
      toast({
        title: "Máximo de estágios atingido",
        description: "Máx. 8 estágios no funil.",
        variant: "destructive"
      });
      return;
    }

    const newStage: FunnelStagePrefs = {
      id: `stage-${Date.now()}`,
      label: `Estágio ${stages.length + 1}`,
      metric: 'impressions',
      userLabel: false
    };

    setStages([...stages, newStage]);
    setIsDirty(true);
  };

  const handleRemoveStage = (stageId: string) => {
    if (stages.length <= 2) {
      toast({
        title: "Mínimo de estágios necessário",
        description: "Mín. 2 estágios no funil.",
        variant: "destructive"
      });
      return;
    }

    setStages(stages.filter(s => s.id !== stageId));
    setIsDirty(true);
  };

  const handleUpdateStage = (stageId: string, updates: Partial<FunnelStagePrefs>) => {
    setStages(stages.map(stage => 
      stage.id === stageId 
        ? { ...stage, ...updates, userLabel: updates.label ? true : stage.userLabel }
        : stage
    ));
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedFunnelPrefs = {
        ...prefs.funnelPrefs,
        stages
      };
      await patch({ funnelPrefs: updatedFunnelPrefs });
      toast({ title: "Funil salvo", description: "A configuração do funil foi atualizada." });
      setIsDirty(false);
      onClose();
    } catch (error) {
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar as alterações.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setStages([...initialStages]);
    setIsDirty(false);
    onClose();
  };

  const handleRestore = () => {
    setStages([...DEFAULT_STAGES]);
    setIsDirty(true);
  };

  // RENDER GUARD: Never return null - show skeleton if loading
  const isLoading = !clientId || !prefs;

  return (
    <ModalFrameV2 isOpen={isOpen} onClose={handleCancel} title="" maxWidth="lg">
      <div className="w-[92vw] max-w-lg h-auto max-h-[72svh] overflow-hidden rounded-2xl bg-white shadow-xl [contain:size_layout_paint] no-height-anim">
        {/* Header fixo */}
        <div className="sticky top-0 z-10 border-b bg-white px-5 py-4">
          <h3 className="text-base font-medium">Configurar estágios do funil</h3>
          <p className="text-sm text-muted-foreground">2 a 8 estágios. Rótulo + Métrica.</p>
        </div>

        {/* Body: único scroller */}
        <div className="flex-1 min-h-0 max-h-[60svh] overflow-y-auto px-5 py-4 [overflow-anchor:none]">
          {isLoading ? (
            // Skeleton loading state - never return null
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-24" />
                      <div className="grid grid-cols-2 gap-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-slate-900">
                  Configurar estágios ({stages.length}/8)
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddStage}
                  disabled={stages.length >= 8}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {stages.map((stage, index) => (
                  <Card key={stage.id} className="border border-slate-200">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">
                            Estágio {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStage(stage.id)}
                            disabled={stages.length <= 2}
                            className="h-8 w-8 p-0 hover:bg-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                              Rótulo
                            </label>
                            <Input
                              value={stage.label}
                              onChange={(e) => handleUpdateStage(stage.id, { label: e.target.value })}
                              placeholder="Nome do estágio"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-slate-600 mb-1 block">
                              Métrica
                            </label>
                            <Select
                              value={stage.metric}
                              onValueChange={(value) => handleUpdateStage(stage.id, { metric: value })}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AVAILABLE_METRICS.map((metric) => (
                                  <SelectItem key={metric.key} value={metric.key}>
                                    {metric.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {stages.length >= 8 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                  Máximo de 8 estágios atingido. Remova um estágio para adicionar outro.
                </div>
              )}

              {stages.length <= 2 && (
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md">
                  Mínimo de 2 estágios necessário para o funil.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer fixo */}
        <div className="sticky bottom-0 z-10 border-t bg-white px-5 py-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
          <Button variant="secondary" onClick={handleRestore}>Restaurar</Button>
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>
    </ModalFrameV2>
  );
}