import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, X, Search, GripVertical } from "lucide-react";
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
      <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-600">
        Cancelar
      </Button>
      <Button variant="outline" onClick={handleReset} className="border-slate-200 text-slate-600">
        Restaurar Padrão
      </Button>
      <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
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
      maxWidth="4xl"
    >
      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 rounded-2xl p-1">
          <TabsTrigger value="metrics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Métricas
          </TabsTrigger>
          <TabsTrigger value="funnel" disabled className="rounded-xl opacity-50">
            Funil
          </TabsTrigger>
          <TabsTrigger value="layout" disabled className="rounded-xl opacity-50">
            Layout
          </TabsTrigger>
          <TabsTrigger value="advanced" disabled className="rounded-xl opacity-50">
            Avançado
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-6 mt-6">
          {/* Search & Presets */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar métricas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-2xl border-slate-200"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              {Object.entries(PRESETS).map(([key, metrics]) => (
                <Button
                  key={key}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSelect(key)}
                  className={`rounded-full border-slate-200 text-xs ${
                    activePreset === key 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'text-slate-600 hover:bg-slate-50'
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
              <h3 className="text-lg font-semibold text-slate-900">
                Métricas Selecionadas
              </h3>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {localSelectedMetrics.length}/{MAX_METRICS}
              </Badge>
            </div>
            
            {localSelectedMetrics.length > 0 ? (
              <div className="space-y-3">
                {localSelectedMetrics.map((metricKey, index) => {
                  const metric = METRICS[metricKey];
                  return (
                    <div
                      key={metricKey}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                            className="h-5 w-5 p-0 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === localSelectedMetrics.length - 1}
                            className="h-5 w-5 p-0 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{metric.label}</div>
                        <div className="text-xs text-slate-500">
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
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unselectedMetrics.map((metric) => (
                  <label
                    key={metric.key}
                    className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                      localSelectedMetrics.length >= MAX_METRICS
                        ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <Checkbox
                      checked={false}
                      onCheckedChange={(checked) => 
                        handleMetricToggle(metric.key, checked as boolean)
                      }
                      disabled={localSelectedMetrics.length >= MAX_METRICS}
                      className="border-slate-300"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{metric.label}</div>
                      <div className="text-xs text-slate-500">
                        {metric.unit === 'currency' && 'Valor monetário'} 
                        {metric.unit === 'int' && 'Número inteiro'}
                        {metric.unit === 'percent' && 'Percentual'}
                        {metric.unit === 'decimal' && 'Número decimal'}
                      </div>
                    </div>
                  </label>
                ))}
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
        </TabsContent>
        
        <TabsContent value="funnel" className="mt-6">
          <div className="text-center py-16 text-slate-400">
            <div className="text-lg font-medium mb-2">🚧 Em breve</div>
            <p className="text-sm">Configuração personalizada do funil de conversão</p>
          </div>
        </TabsContent>
        
        <TabsContent value="layout" className="mt-6">
          <div className="text-center py-16 text-slate-400">
            <div className="text-lg font-medium mb-2">🎨 Em breve</div>
            <p className="text-sm">Personalização de layout e aparência</p>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6">
          <div className="text-center py-16 text-slate-400">
            <div className="text-lg font-medium mb-2">⚙️ Em breve</div>
            <p className="text-sm">Configurações avançadas e automações</p>
          </div>
        </TabsContent>
      </Tabs>
    </ModalFrame>
  );
}