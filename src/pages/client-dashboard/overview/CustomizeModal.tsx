import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, X, Search, GripVertical, Plus, Trash2 } from "lucide-react";
import { ModalFrameV2 } from "./ModalFrameV2";
import { METRICS, MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useToast } from "@/hooks/use-toast";
import { useStableModalHeight } from "@/hooks/useStableModalHeight";
import { useFunnelConfig, type FunnelStage, type FunnelPrefsV2, defaultFunnelPrefsV2 } from "@/hooks/useFunnelConfig";
import "@/styles/modal-guards.css";

const MAX_METRICS = 10;

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
  const { containerRef } = useStableModalHeight({
    enabled: true,
    debounceMs: 150,
    measurementDelays: [200, 1200]
  });

  const [activeTab, setActiveTab] = useState<string>("metrics");
  const [localSelectedMetrics, setLocalSelectedMetrics] = useState<MetricKey[]>(selectedMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const { toast } = useToast();

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSelectedMetrics(selectedMetrics);
      setSearchQuery("");
      setActiveTab("metrics");
      setDragIndex(null);
    }
  }, [isOpen, selectedMetrics]);

  // Metric management functions
  const handleMetricToggle = (metricKey: MetricKey, isAdding: boolean) => {
    setLocalSelectedMetrics(prev => {
      if (isAdding) {
        if (prev.length >= MAX_METRICS || prev.includes(metricKey)) return prev;
        return [...prev, metricKey];
      } else {
        return prev.filter(key => key !== metricKey);
      }
    });
  };

  const handleRemoveMetric = (metricKey: MetricKey) => {
    setLocalSelectedMetrics(prev => prev.filter(key => key !== metricKey));
  };

  const handleSave = () => {
    onMetricsChange(localSelectedMetrics);
    
    try {
      localStorage.setItem(STORAGE_KEYS_EXTENDED.SELECTED_METRICS, JSON.stringify(localSelectedMetrics));
    } catch (error) {
      console.warn('Failed to save metrics to localStorage:', error);
    }

    toast({
      title: "Configurações salvas",
      description: "As métricas selecionadas foram atualizadas com sucesso.",
    });

    onClose();
  };

  const handleReset = () => {
    setLocalSelectedMetrics(DEFAULT_SELECTED_METRICS);
    toast({
      title: "Configurações restauradas",
      description: "As métricas foram restauradas para o padrão.",
    });
  };

  // Filtered metrics
  const allMetrics = Object.entries(METRICS).map(([key, metric]) => ({
    key: key as MetricKey,
    ...metric
  }));

  const filteredMetrics = allMetrics.filter(metric =>
    metric.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    metric.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMetricsData = localSelectedMetrics
    .map(key => ({ key, ...METRICS[key] }))
    .filter(Boolean);

  const unselectedMetrics = filteredMetrics.filter(
    metric => !localSelectedMetrics.includes(metric.key)
  );

  return (
    <ModalFrameV2
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Dashboard"
    >
        <div ref={containerRef} className="h-full no-height-anim">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="funnel">Funil</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-6 space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar métricas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Métricas Selecionadas ({localSelectedMetrics.length}/{MAX_METRICS})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs"
              >
                Restaurar Padrão
              </Button>
            </div>

            {selectedMetricsData.length > 0 ? (
              <div className="space-y-2">
                {selectedMetricsData.map((metric, index) => {
                  const metricKey = metric.key;
                  return (
                    <div
                      key={metricKey}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-2xl bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-slate-400">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">{metric.label}</div>
                        <div className="text-xs text-slate-500 truncate">
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
                          onClick={() => handleRemoveMetric(metricKey)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                          aria-label={`Remover ${metric.label}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl">
                Nenhuma métrica selecionada
              </div>
            )}
          </div>

          {/* Available Metrics */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900">Métricas Disponíveis</h3>
            {unselectedMetrics.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unselectedMetrics.map((metric) => {
                  const disabled = localSelectedMetrics.length >= MAX_METRICS;
                  return (
                    <Button
                      key={metric.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      aria-pressed={false}
                      disabled={disabled}
                      onClick={() => !disabled && handleMetricToggle(metric.key, true)}
                      className={`rounded-full border-slate-200 text-xs px-3 py-1 ${
                        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-50'
                      }`}
                    >
                      {metric.label}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400">
                {searchQuery ? 'Nenhuma métrica encontrada para a busca' : 'Todas as métricas já foram selecionadas'}
              </div>
            )}
            
            {localSelectedMetrics.length >= MAX_METRICS && unselectedMetrics.length > 0 && (
              <p className="text-xs text-slate-500 text-center bg-amber-50 border border-amber-200 rounded-xl p-3">
                ⚠️ Limite de {MAX_METRICS} métricas atingido. Remova uma métrica selecionada para adicionar outras.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-w-[100px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="min-w-[100px]"
            >
              Salvar
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="funnel" className="mt-6 h-full">
          <div className="grid grid-rows-[1fr_auto] h-full">
            <div className="min-h-0 overflow-y-auto px-6 py-4 [overflow-anchor:none]">
              <FunnelStageManager clientId={clientId} />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="layout" className="mt-6 space-y-6">
          <div className="text-center py-12 text-slate-400">
            <div className="text-lg mb-2">🎨</div>
            <div className="text-sm">Configurações de layout</div>
            <div className="text-xs mt-1">Em breve...</div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6 space-y-6">
          <div className="text-center py-12 text-slate-400">
            <div className="text-lg mb-2">⚙️</div>
            <div className="text-sm">Configurações avançadas</div>
            <div className="text-xs mt-1">Em breve...</div>
          </div>
        </TabsContent>
        </Tabs>
        </div>
    </ModalFrameV2>
  );
}

// Funnel Stage Manager Component - Height stable implementation
function FunnelStageManager({ clientId }: { clientId: string }) {
  const {
    funnelPrefs,
    isDirty,
    isSaving,
    errorMsg,
    fieldErrors,
    updatePrefs,
    updateStage,
    addStage,
    removeStage,
    moveStage,
    save,
    reset,
  } = useFunnelConfig(clientId);

  // Available metrics for funnel stages
  const AVAILABLE_METRICS = [
    { value: 'impressions', label: 'Impressões' },
    { value: 'clicks', label: 'Cliques' },
    { value: 'leads', label: 'Leads' },
    { value: 'revenue', label: 'Receita' },
    { value: 'spend', label: 'Investimento' },
  ];

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await save();
  };

  // View diagnostics effect
  useEffect(() => {
    const contentElement = document.querySelector('[data-funnel-content]') as HTMLElement;
    if (!contentElement) return;

    const measureView = () => {
      const { clientHeight, scrollHeight } = contentElement;
      const contentScrollRatio = clientHeight > 0 ? scrollHeight / clientHeight : 0;
      
      localStorage.setItem('diag:funilModal:lastView', JSON.stringify({
        contentScrollRatio,
        clientHeight,
        scrollHeight,
        timestamp: Date.now(),
      }));
    };

    // Measure after 800ms
    const timeout = setTimeout(measureView, 800);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <form id="funnelForm" onSubmit={handleSubmit} className="space-y-6">
      <div data-funnel-content className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Configuração do Funil</h3>
            <p className="text-sm text-slate-600 mt-1">
              Configure os estágios do funil e suas métricas correspondentes
            </p>
          </div>
          {isDirty && (
            <Badge variant="secondary" className="text-xs">
              Alterações não salvas
            </Badge>
          )}
        </div>

        {/* Error display */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-800">{errorMsg}</p>
          </div>
        )}

        {/* Mode Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Modo de Exibição</Label>
          <Select
            value={funnelPrefs.mode}
            onValueChange={(value: 'Detalhado' | 'Compacto') => updatePrefs({ mode: value })}
          >
            <SelectTrigger className="max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Detalhado">Detalhado</SelectItem>
              <SelectItem value="Compacto">Compacto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <Label className="text-sm font-medium">Opções</Label>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="showRates"
              checked={funnelPrefs.showRates}
              onCheckedChange={(checked) => updatePrefs({ showRates: checked })}
            />
            <Label htmlFor="showRates" className="text-sm">Mostrar taxas de conversão</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="comparePrevious"
              checked={funnelPrefs.comparePrevious}
              onCheckedChange={(checked) => updatePrefs({ comparePrevious: checked })}
            />
            <Label htmlFor="comparePrevious" className="text-sm">Comparar com período anterior</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="colorByStage"
              checked={funnelPrefs.colorByStage}
              onCheckedChange={(checked) => updatePrefs({ colorByStage: checked })}
            />
            <Label htmlFor="colorByStage" className="text-sm">Cores por estágio</Label>
          </div>
        </div>

        {/* Stages Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Estágios ({funnelPrefs.stages.length}/8)
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStage}
              disabled={funnelPrefs.stages.length >= 8}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
          </div>

          <div className="flex flex-col gap-3">
            {funnelPrefs.stages.map((stage, index) => (
              <div
                key={stage.id}
                data-stage-index={index}
                className="rounded-xl border p-4 bg-white space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">
                    Estágio {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStage(index)}
                    disabled={funnelPrefs.stages.length <= 2}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Rótulo</Label>
                    <Input
                      value={stage.label}
                      onChange={(e) => updateStage(index, { label: e.target.value, userLabel: true })}
                      placeholder="Nome do estágio"
                      className={`text-sm min-w-0 ${fieldErrors[`stage-${index}`] ? 'border-red-300' : ''}`}
                    />
                    {fieldErrors[`stage-${index}`] && (
                      <p className="text-xs text-red-600">{fieldErrors[`stage-${index}`]}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-slate-600">Métrica</Label>
                    <Select
                      value={stage.metric}
                      onValueChange={(value) => updateStage(index, { metric: value })}
                    >
                      <SelectTrigger className="text-sm min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_METRICS.map((metric) => (
                          <SelectItem key={metric.value} value={metric.value}>
                            {metric.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview info */}
        <div className="bg-slate-50 rounded-xl p-4 border">
          <h4 className="text-sm font-medium text-slate-900 mb-2">Prévia da Configuração</h4>
          <div className="text-xs text-slate-600 space-y-1">
            <div>Modo: <span className="font-medium">{funnelPrefs.mode}</span></div>
            <div>Estágios: <span className="font-medium">{funnelPrefs.stages.length}</span></div>
            <div>Taxas de conversão: <span className="font-medium">{funnelPrefs.showRates ? 'Sim' : 'Não'}</span></div>
          </div>
        </div>
      </div>

      {/* Internal sticky footer for funnel actions */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t px-6 py-3 flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={reset}
          disabled={!isDirty || isSaving}
          className="min-w-[100px]"
        >
          Resetar
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !isDirty}
          className="min-w-[100px]"
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
}