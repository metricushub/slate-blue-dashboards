import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings, X, Plus, Check, ChevronsUpDown } from "lucide-react";
import { METRICS, MetricKey } from "@/shared/types/metrics";
import { useClientPrefs } from "@/shared/prefs/useClientPrefs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface TrendChartMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function TrendChartMetricsModal({ isOpen, onClose, clientId }: TrendChartMetricsModalProps) {
  const { prefs, patch } = useClientPrefs(clientId);
  const { toast } = useToast();
  
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([]);
  const [addMetricOpen, setAddMetricOpen] = useState(false);

  // Initialize state from prefs
  useEffect(() => {
    if (prefs.selectedMetrics) {
      setSelectedMetrics(prefs.selectedMetrics);
    }
  }, [prefs.selectedMetrics]);

  const availableMetrics = Object.entries(METRICS).filter(
    ([key]) => !selectedMetrics.includes(key as MetricKey)
  );

  const handleAddMetric = (metricKey: MetricKey) => {
    if (selectedMetrics.length >= 3) {
      toast({
        title: "Máximo de métricas atingido",
        description: "Máx. 3 métricas no gráfico.",
        variant: "destructive"
      });
      return;
    }

    const newMetrics = [...selectedMetrics, metricKey];
    setSelectedMetrics(newMetrics);
    setAddMetricOpen(false);
  };

  const handleRemoveMetric = (metricKey: MetricKey) => {
    const newMetrics = selectedMetrics.filter(m => m !== metricKey);
    setSelectedMetrics(newMetrics);
  };

  const handleSave = () => {
    patch({ selectedMetrics: selectedMetrics.slice(0, 3) });
    toast({ title: "Métricas salvas", description: "As configurações do gráfico foram atualizadas." });
    onClose();
  };

  const handleCancel = () => {
    setSelectedMetrics(prefs.selectedMetrics);
    onClose();
  };

  const handleRestore = () => {
    const defaultMetrics: MetricKey[] = ['spend', 'leads', 'roas'];
    setSelectedMetrics(defaultMetrics);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="mx-auto w-[92vw] max-w-md md:max-w-lg h-auto max-h-[72svh] overflow-hidden rounded-2xl bg-white shadow-xl [contain:size_layout_paint] p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="shrink-0 sticky top-0 z-10 border-b bg-white px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600" />
              <div className="text-base font-medium">Métricas do Gráfico</div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCancel} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [overflow-anchor:none] no-height-anim">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Métricas selecionadas ({selectedMetrics.length}/3)
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMetrics.map((metricKey) => {
                    const metric = METRICS[metricKey];
                    return (
                      <Badge key={metricKey} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {metric.label}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 hover:bg-red-100"
                          onClick={() => handleRemoveMetric(metricKey)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>

                {selectedMetrics.length < 3 && (
                  <Popover open={addMetricOpen} onOpenChange={setAddMetricOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={selectedMetrics.length >= 3}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar métrica
                        <ChevronsUpDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar métrica..." />
                        <CommandEmpty>Nenhuma métrica encontrada</CommandEmpty>
                        <CommandGroup>
                          {availableMetrics.map(([key, metric]) => (
                            <CommandItem
                              key={key}
                              value={key}
                              onSelect={() => handleAddMetric(key as MetricKey)}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMetrics.includes(key as MetricKey) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{metric.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {metric.unit === 'currency' ? 'Moeda' : 
                                   metric.unit === 'percent' ? 'Percentual' : 'Número'}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>

              {selectedMetrics.length >= 3 && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
                  Máximo de 3 métricas atingido. Remova uma métrica para adicionar outra.
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