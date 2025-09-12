import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Search, Plus, ArrowUp, ArrowDown } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState<string>("");
  const MAX_METRICS = 6;

  // Metric presets
  const PRESETS = {
    performance: ['spend', 'leads', 'cpl', 'roas'] as MetricKey[],
    acquisition: ['impressions', 'clicks', 'convRate', 'cpl'] as MetricKey[],
    revenue: ['revenue', 'roas', 'spend', 'cpa'] as MetricKey[],
    traffic: ['impressions', 'clicks', 'convRate', 'spend'] as MetricKey[],
    engagement: ['clicks', 'convRate', 'leads', 'cpl'] as MetricKey[],
    complete: ['spend', 'leads', 'cpl', 'roas', 'clicks', 'revenue'] as MetricKey[]
  };

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedMetrics(selectedMetrics);
      setSearchQuery("");
    }
  }, [isOpen, selectedMetrics]);

  const handleMetricToggle = (metricKey: MetricKey, checked: boolean) => {
    if (checked && localSelectedMetrics.length >= MAX_METRICS) {
      return;
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

  const handlePresetSelect = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (preset) {
      setLocalSelectedMetrics(preset);
      setActivePreset(presetKey);
    }
  };

  const handleSave = () => {
    onMetricsChange(localSelectedMetrics);
    
    // Persist to localStorage
    localStorage.setItem(
      `${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`,
      JSON.stringify(localSelectedMetrics)
    );
    
    // Analytics track
    console.log('telemetry:customize_metrics_saved', { 
      clientId, 
      metricsCount: localSelectedMetrics.length,
      metrics: localSelectedMetrics
    });
    
    onClose();
  };

  const handleReset = () => {
    setLocalSelectedMetrics(DEFAULT_SELECTED_METRICS);
    setActivePreset("");
  };

  const availableMetrics = Object.values(METRICS);
  const unselectedMetrics = availableMetrics.filter(m => 
    !localSelectedMetrics.includes(m.key) && 
    m.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose}>
        Cancelar
      </Button>
      <Button variant="outline" onClick={handleReset}>
        Restaurar Padrão
      </Button>
      <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
        Salvar Alterações
      </Button>
    </>
  );

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Métricas"
      footer={footer}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar métricas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Presets */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">PRESETS RÁPIDOS</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PRESETS).map(([key, metrics]) => (
              <Button
                key={key}
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(key)}
                className={`rounded-full text-xs ${
                  activePreset === key 
                    ? 'bg-primary/10 border-primary/20 text-primary' 
                    : ''
                }`}
              >
                {key === 'performance' && '⚡ Performance'}
                {key === 'acquisition' && '🎯 Aquisição'}
                {key === 'revenue' && '💰 Receita'}
                {key === 'traffic' && '📈 Tráfego'}
                {key === 'engagement' && '❤️ Engajamento'}
                {key === 'complete' && '🔥 Completo'}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              MÉTRICAS SELECIONADAS ({localSelectedMetrics.length}/{MAX_METRICS})
            </h3>
          </div>
          
          {localSelectedMetrics.length > 0 ? (
            <div className="space-y-2">
              {localSelectedMetrics.map((metricKey, index) => {
                const metric = METRICS[metricKey];
                return (
                  <div
                    key={metricKey}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{metric.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {metric.unit === 'currency' && 'Valor monetário'}
                        {metric.unit === 'int' && 'Número inteiro'}
                        {metric.unit === 'percent' && 'Percentual'}
                        {metric.unit === 'decimal' && 'Número decimal'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === localSelectedMetrics.length - 1}
                        className="h-7 w-7 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMetric(metricKey)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
              Nenhuma métrica selecionada
            </div>
          )}
        </div>

        {/* Available Metrics */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">ADICIONAR MÉTRICAS</h3>
          {unselectedMetrics.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {unselectedMetrics.map((metric) => {
                const disabled = localSelectedMetrics.length >= MAX_METRICS;
                return (
                  <Button
                    key={metric.key}
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => !disabled && handleMetricToggle(metric.key, true)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="flex items-center gap-2 text-left">
                      <Plus className="h-3 w-3 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{metric.label}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {metric.unit === 'currency' && 'Monetário'}
                          {metric.unit === 'int' && 'Inteiro'}
                          {metric.unit === 'percent' && 'Percentual'}
                          {metric.unit === 'decimal' && 'Decimal'}
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground text-sm">
              {searchQuery ? 'Nenhuma métrica encontrada' : 'Todas as métricas já foram selecionadas'}
            </div>
          )}
          
          {localSelectedMetrics.length >= MAX_METRICS && unselectedMetrics.length > 0 && (
            <div className="text-xs text-muted-foreground text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠️ Limite de {MAX_METRICS} métricas atingido. Remova uma métrica para adicionar outras.
            </div>
          )}
        </div>
      </div>
    </ModalFrame>
  );
}