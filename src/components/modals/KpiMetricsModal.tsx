import React, { useState, useEffect } from 'react';
import { ModalFrameV2 } from "../../pages/client-dashboard/overview/ModalFrameV2";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Check, ChevronsUpDown, X } from "lucide-react";
import { METRICS, MetricKey } from "@/shared/types/metrics";
import { useClientPrefs } from "@/shared/prefs/useClientPrefs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface KpiMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

const DEFAULT_KPI_METRICS: MetricKey[] = ['spend', 'leads', 'cpl'];

export function KpiMetricsModal({ isOpen, onClose, clientId }: KpiMetricsModalProps) {
  const { prefs, patch } = useClientPrefs(clientId);
  const { toast } = useToast();
  
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([]);
  const [addMetricOpen, setAddMetricOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get KPI metrics from prefs or use defaults
  const initialMetrics = prefs?.selectedMetrics || DEFAULT_KPI_METRICS;

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMetrics([...initialMetrics]);
      setIsDirty(false);
    }
  }, [isOpen, initialMetrics]);

  const availableMetrics = Object.entries(METRICS).filter(
    ([key]) => !selectedMetrics.includes(key as MetricKey)
  );

  const handleAddMetric = (metricKey: MetricKey) => {
    if (selectedMetrics.length >= 9) {
      toast({
        title: "Máximo de métricas atingido",
        description: "Máx. 9 métricas nos KPIs.",
        variant: "destructive"
      });
      return;
    }

    const newMetrics = [...selectedMetrics, metricKey];
    setSelectedMetrics(newMetrics);
    setIsDirty(true);
    setAddMetricOpen(false);
  };

  const handleRemoveMetric = (metricKey: MetricKey) => {
    const newMetrics = selectedMetrics.filter(m => m !== metricKey);
    setSelectedMetrics(newMetrics);
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const limitedMetrics = selectedMetrics.slice(0, 9);
      await patch({ selectedMetrics: limitedMetrics });
      toast({ 
        title: "KPIs salvos", 
        description: "As métricas dos KPIs foram atualizadas." 
      });
      setIsDirty(false);
      onClose();
    } catch (error) {
      toast({ 
        title: "Erro ao salvar", 
        description: "Não foi possível salvar as alterações.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedMetrics([...initialMetrics]);
    setIsDirty(false);
    onClose();
  };

  const handleRestore = () => {
    setSelectedMetrics([...DEFAULT_KPI_METRICS]);
    setIsDirty(true);
  };

  // RENDER GUARD: Show skeleton if loading
  const isLoading = !clientId || !prefs;

  // Footer buttons
  const footerButtons = (
    <>
      <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
      <Button variant="secondary" onClick={handleRestore}>Restaurar</Button>
      <Button onClick={handleSave} disabled={!isDirty || isSaving}>
        {isSaving ? "Salvando…" : "Salvar"}
      </Button>
    </>
  );

  // Modal content
  const modalContent = isLoading ? (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="border border-slate-200">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ) : (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-slate-900">
            Métricas dos KPIs ({selectedMetrics.length}/9)
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Configure até 9 métricas para exibir nos KPIs principais
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddMetricOpen(true)}
          disabled={selectedMetrics.length >= 9}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-2 block">
            Métricas selecionadas
          </label>
          <div className="flex flex-wrap gap-2">
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
            {selectedMetrics.length === 0 && (
              <div className="text-xs text-slate-500 py-2">
                Nenhuma métrica selecionada
              </div>
            )}
          </div>
        </div>

        {selectedMetrics.length < 9 && (
          <Popover open={addMetricOpen} onOpenChange={setAddMetricOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 w-full justify-center"
                disabled={selectedMetrics.length >= 9}
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

      {selectedMetrics.length >= 9 && (
        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
          <strong>Máximo atingido:</strong> Máximo de 9 métricas nos KPIs. Remova uma métrica para adicionar outra.
        </div>
      )}
    </div>
  );

  return (
    <ModalFrameV2 
      isOpen={isOpen} 
      onClose={handleCancel} 
      title="Configurar Métricas dos KPIs"
      maxWidth="lg"
      footer={footerButtons}
    >
      {modalContent}
    </ModalFrameV2>
  );
}