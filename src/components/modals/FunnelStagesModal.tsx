import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, X, Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
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

export function FunnelStagesModal({ isOpen, onClose, clientId }: FunnelStagesModalProps) {
  const { prefs, patch } = useClientPrefs(clientId);
  const { toast } = useToast();
  
  const [stages, setStages] = useState<FunnelStagePrefs[]>([]);

  // Initialize state from prefs
  useEffect(() => {
    if (prefs.funnelPrefs?.stages) {
      setStages([...prefs.funnelPrefs.stages]);
    }
  }, [prefs.funnelPrefs?.stages]);

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
  };

  const handleUpdateStage = (stageId: string, updates: Partial<FunnelStagePrefs>) => {
    setStages(stages.map(stage => 
      stage.id === stageId 
        ? { ...stage, ...updates, userLabel: updates.label ? true : stage.userLabel }
        : stage
    ));
  };

  const handleMoveStage = (stageId: string, direction: 'up' | 'down') => {
    const currentIndex = stages.findIndex(s => s.id === stageId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= stages.length) return;

    const newStages = [...stages];
    [newStages[currentIndex], newStages[newIndex]] = [newStages[newIndex], newStages[currentIndex]];
    setStages(newStages);
  };

  const handleSave = () => {
    const updatedFunnelPrefs = {
      ...prefs.funnelPrefs,
      stages
    };
    patch({ funnelPrefs: updatedFunnelPrefs });
    toast({ title: "Funil salvo", description: "A configuração do funil foi atualizada." });
    onClose();
  };

  const handleCancel = () => {
    setStages(prefs.funnelPrefs?.stages || []);
    onClose();
  };

  const handleRestore = () => {
    const defaultStages: FunnelStagePrefs[] = [
      { id: 'stage-1', label: 'Impressões', metric: 'impressions', userLabel: false },
      { id: 'stage-2', label: 'Cliques', metric: 'clicks', userLabel: false },
      { id: 'stage-3', label: 'Leads', metric: 'leads', userLabel: false }
    ];
    setStages(defaultStages);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="mx-auto w-[92vw] max-w-md md:max-w-lg h-auto max-h-[72svh] overflow-hidden rounded-2xl bg-white shadow-xl [contain:size_layout_paint] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="shrink-0 sticky top-0 z-10 border-b bg-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              <div className="text-base font-medium">Estágios do Funil</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [overflow-anchor:none] no-height-anim">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900">
                  Configurar estágios ({stages.length}/8)
                </h3>
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
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-600">
                              Estágio {index + 1}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveStage(stage.id, 'up')}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveStage(stage.id, 'down')}
                              disabled={index === stages.length - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
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
          </div>

          {/* Footer */}
          <div className="shrink-0 sticky bottom-0 z-10 border-t bg-white px-4 py-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
            <Button variant="secondary" onClick={handleRestore}>Restaurar padrão</Button>
            <Button onClick={handleSave}>Salvar alterações</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}