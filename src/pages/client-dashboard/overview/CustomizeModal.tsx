import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { METRICS, MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  selectedMetrics: MetricKey[];
  onMetricsChange: (metrics: MetricKey[]) => void;
}

export function CustomizeModal({
  isOpen,
  onClose,
  clientId,
  selectedMetrics,
  onMetricsChange
}: CustomizeModalProps) {
  const [localSelectedMetrics, setLocalSelectedMetrics] = useState<MetricKey[]>(selectedMetrics);
  const MAX_METRICS = 6;

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedMetrics(selectedMetrics);
    }
  }, [isOpen, selectedMetrics]);

  const handleMetricToggle = (metricKey: MetricKey, checked: boolean) => {
    if (checked && localSelectedMetrics.length >= MAX_METRICS) {
      return; // Don't allow adding more than max
    }

    let newMetrics: MetricKey[];
    if (checked) {
      newMetrics = [...localSelectedMetrics, metricKey];
    } else {
      newMetrics = localSelectedMetrics.filter(m => m !== metricKey);
    }
    
    setLocalSelectedMetrics(newMetrics);
  };

  const handleRemoveMetric = (metricKey: MetricKey) => {
    const newMetrics = localSelectedMetrics.filter(m => m !== metricKey);
    setLocalSelectedMetrics(newMetrics);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const items = Array.from(localSelectedMetrics);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    setLocalSelectedMetrics(items);
  };

  const handleMoveDown = (index: number) => {
    if (index >= localSelectedMetrics.length - 1) return;
    const items = Array.from(localSelectedMetrics);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    setLocalSelectedMetrics(items);
  };

  const handleSave = () => {
    onMetricsChange(localSelectedMetrics);
    
    // Persist to localStorage
    localStorage.setItem(
      `${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`,
      JSON.stringify(localSelectedMetrics)
    );
    
    onClose();
  };

  const handleReset = () => {
    setLocalSelectedMetrics(DEFAULT_SELECTED_METRICS);
  };

  const availableMetrics = Object.values(METRICS);
  const unselectedMetrics = availableMetrics.filter(m => !localSelectedMetrics.includes(m.key));

  const footer = (
    <>
      <Button variant="outline" onClick={onClose}>
        Cancelar
      </Button>
      <Button variant="outline" onClick={handleReset}>
        Restaurar Padrão
      </Button>
      <Button onClick={handleSave} className="bg-primary hover:bg-primary-hover">
        Salvar Alterações
      </Button>
    </>
  );

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Dashboard"
      footer={footer}
    >
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="funnel" disabled>Funil</TabsTrigger>
          <TabsTrigger value="layout" disabled>Layout</TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-6">
          {/* Selected Metrics - Reorderable */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">
                Métricas Selecionadas ({localSelectedMetrics.length}/{MAX_METRICS})
              </h3>
              {localSelectedMetrics.length >= MAX_METRICS && (
                <Badge variant="secondary" className="text-xs">
                  Limite atingido
                </Badge>
              )}
            </div>
            
            {localSelectedMetrics.length > 0 ? (
              <div className="space-y-2">
                {localSelectedMetrics.map((metricKey, index) => {
                  const metric = METRICS[metricKey];
                  return (
                    <div
                      key={metricKey}
                      className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border"
                    >
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localSelectedMetrics.length - 1}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{metric.label}</span>
                        <div className="text-xs text-muted-foreground">
                          {metric.unit === 'currency' && 'Valor monetário'} 
                          {metric.unit === 'int' && 'Número inteiro'}
                          {metric.unit === 'percent' && 'Percentual'}
                          {metric.unit === 'decimal' && 'Número decimal'}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMetric(metricKey)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma métrica selecionada
              </p>
            )}
          </div>

          {/* Available Metrics */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Métricas Disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {unselectedMetrics.map((metric) => (
                <label
                  key={metric.key}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={(checked) => 
                      handleMetricToggle(metric.key, checked as boolean)
                    }
                    disabled={localSelectedMetrics.length >= MAX_METRICS}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{metric.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {metric.unit === 'currency' && 'Valor monetário'} 
                      {metric.unit === 'int' && 'Número inteiro'}
                      {metric.unit === 'percent' && 'Percentual'}
                      {metric.unit === 'decimal' && 'Número decimal'}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            
            {localSelectedMetrics.length >= MAX_METRICS && (
              <p className="text-xs text-muted-foreground text-center">
                Remova uma métrica selecionada para adicionar outras
              </p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="funnel">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Em breve - Configuração do funil</p>
          </div>
        </TabsContent>
        
        <TabsContent value="layout">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Em breve - Configuração de layout</p>
          </div>
        </TabsContent>
      </Tabs>
    </ModalFrame>
  );
}