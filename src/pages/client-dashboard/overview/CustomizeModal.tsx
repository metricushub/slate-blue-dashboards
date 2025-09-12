import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, X, Search, GripVertical } from "lucide-react";
import { ModalFrame } from "./ModalFrame";
import { METRICS, MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useToast } from "@/hooks/use-toast";

type FunnelPrefs = {
  mode: 'Detalhado' | 'Compacto';
  showRates: boolean;
  comparePrevious: boolean;
  mapping: {
    stage1: string;
    stage2: string;
    stage3: string;
    stage4: string;
  };
};

const defaultFunnelPrefs: FunnelPrefs = {
  mode: 'Detalhado',
  showRates: true,
  comparePrevious: false,
  mapping: {
    stage1: 'impressions',
    stage2: 'clicks',
    stage3: 'leads',
    stage4: 'revenue'
  }
};

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
  const { toast } = useToast();
  const [localSelectedMetrics, setLocalSelectedMetrics] = useState<MetricKey[]>(selectedMetrics);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState<string>("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("metrics");
  const [funnelPrefs, setFunnelPrefs] = useState<FunnelPrefs>(() => {
    const stored = localStorage.getItem(`client:${clientId}:funnel_prefs`);
    return stored ? JSON.parse(stored) : defaultFunnelPrefs;
  });
  const MAX_METRICS = 9;

  // Metric presets
  const PRESETS = {
    default: ['spend', 'leads', 'cpl', 'roas', 'clicks', 'impressions'] as MetricKey[],
    performance: ['spend', 'leads', 'cpl', 'roas'] as MetricKey[],
    acquisition: ['impressions', 'clicks', 'convRate', 'cpl'] as MetricKey[],
    revenue: ['revenue', 'roas', 'spend', 'cpa'] as MetricKey[],
    traffic: ['impressions', 'clicks', 'convRate', 'spend'] as MetricKey[],
    engagement: ['clicks', 'convRate', 'leads', 'cpl'] as MetricKey[],
    complete: ['spend', 'leads', 'cpl', 'roas', 'clicks', 'revenue', 'impressions', 'convRate', 'cpa'] as MetricKey[]
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
    
    toast({
      title: "Métricas personalizadas salvas",
      description: "Suas preferências foram salvas com sucesso.",
    });
    
    onClose();
  };

  const handleReset = () => {
    const defaultPreset = PRESETS.default;
    setLocalSelectedMetrics(defaultPreset);
    setActivePreset("default");
    
    // Persist immediately
    localStorage.setItem(
      `${STORAGE_KEYS_EXTENDED.SELECTED_METRICS}:${clientId}`,
      JSON.stringify(defaultPreset)
    );
    onMetricsChange(defaultPreset);
  };

  const availableMetrics = Object.values(METRICS);
  const unselectedMetrics = availableMetrics.filter(m => 
    !localSelectedMetrics.includes(m.key) && 
    m.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const footer = null; // Footer will be rendered as sticky

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      title="Personalizar Dashboard"
      footer={footer}
      maxWidth="4xl"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 rounded-2xl p-1">
          <TabsTrigger value="metrics" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Métricas
          </TabsTrigger>
          <TabsTrigger value="funnel" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Funil
          </TabsTrigger>
          <TabsTrigger value="layout" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Layout
          </TabsTrigger>
          <TabsTrigger value="advanced" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
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
                   {key === 'default' && '📊 Padrão'}
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
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-move"
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (dragIndex === null || dragIndex === index) return;
                        const items = Array.from(localSelectedMetrics);
                        const [m] = items.splice(dragIndex, 1);
                        items.splice(index, 0, m);
                        setLocalSelectedMetrics(items);
                        setDragIndex(null);
                      }}
                      aria-label={`Reordenar ${metric.label}`}
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
        </TabsContent>
        
        <TabsContent value="funnel" className="mt-6 space-y-6">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-3 block">
                  Modo de Exibição
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={funnelPrefs.mode === 'Detalhado' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFunnelPrefs(prev => ({ ...prev, mode: 'Detalhado' }))}
                  >
                    Detalhado
                  </Button>
                  <Button
                    type="button"
                    variant={funnelPrefs.mode === 'Compacto' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFunnelPrefs(prev => ({ ...prev, mode: 'Compacto' }))}
                  >
                    Compacto
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Mostrar taxas (%)
                </label>
                <Switch
                  checked={funnelPrefs.showRates}
                  onCheckedChange={(checked) => 
                    setFunnelPrefs(prev => ({ ...prev, showRates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  Comparar com período anterior
                </label>
                <Switch
                  checked={funnelPrefs.comparePrevious}
                  onCheckedChange={(checked) => 
                    setFunnelPrefs(prev => ({ ...prev, comparePrevious: checked }))
                  }
                />
              </div>

              {/* Mapping Configuration */}
              <div className="border-t pt-6">
                <label className="text-sm font-medium text-slate-700 mb-4 block">
                  Mapeamento de Métricas
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-slate-600">Etapa 1</Label>
                    <Select 
                      value={funnelPrefs.mapping.stage1} 
                      onValueChange={(value) => 
                        setFunnelPrefs(prev => ({ 
                          ...prev, 
                          mapping: { ...prev.mapping, stage1: value } 
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="impressions">Impressões</SelectItem>
                        <SelectItem value="clicks">Cliques</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="revenue">Receita</SelectItem>
                        <SelectItem value="spend">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-600">Etapa 2</Label>
                    <Select 
                      value={funnelPrefs.mapping.stage2} 
                      onValueChange={(value) => 
                        setFunnelPrefs(prev => ({ 
                          ...prev, 
                          mapping: { ...prev.mapping, stage2: value } 
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="impressions">Impressões</SelectItem>
                        <SelectItem value="clicks">Cliques</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="revenue">Receita</SelectItem>
                        <SelectItem value="spend">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-600">Etapa 3</Label>
                    <Select 
                      value={funnelPrefs.mapping.stage3} 
                      onValueChange={(value) => 
                        setFunnelPrefs(prev => ({ 
                          ...prev, 
                          mapping: { ...prev.mapping, stage3: value } 
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="impressions">Impressões</SelectItem>
                        <SelectItem value="clicks">Cliques</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="revenue">Receita</SelectItem>
                        <SelectItem value="spend">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-600">Etapa 4</Label>
                    <Select 
                      value={funnelPrefs.mapping.stage4} 
                      onValueChange={(value) => 
                        setFunnelPrefs(prev => ({ 
                          ...prev, 
                          mapping: { ...prev.mapping, stage4: value } 
                        }))
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="impressions">Impressões</SelectItem>
                        <SelectItem value="clicks">Cliques</SelectItem>
                        <SelectItem value="leads">Leads</SelectItem>
                        <SelectItem value="revenue">Receita</SelectItem>
                        <SelectItem value="spend">Investimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Configure quais métricas alimentam cada etapa do funil
                </p>
              </div>
            </div>
        </TabsContent>
        
        <TabsContent value="layout" className="mt-6 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Layout dos KPIs</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Disposição do Grid</Label>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <Button variant="outline" className="h-16 flex-col text-xs">
                    <div className="text-lg mb-1">⚏</div>
                    3x3
                  </Button>
                  <Button variant="outline" className="h-16 flex-col text-xs">
                    <div className="text-lg mb-1">⚍</div>
                    2x4+1
                  </Button>
                  <Button variant="outline" className="h-16 flex-col text-xs">
                    <div className="text-lg mb-1">⚐</div>
                    1x5+2x2
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>Densidade dos Cards</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button variant="outline" className="h-12 text-xs">
                    Confortável
                  </Button>
                  <Button variant="outline" className="h-12 text-xs">
                    Compacto
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Presets Avançados</h3>
              <Badge variant="outline" className="text-xs">
                Máx. {MAX_METRICS} métricas
              </Badge>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label>Presets Salvos</Label>
                <div className="space-y-2 mt-2">
                  {Object.entries(PRESETS).map(([key, metrics]) => (
                    <div key={key} className="flex items-center justify-between p-3 border rounded-xl">
                      <div>
                        <div className="font-medium text-sm">
                          {key === 'default' && '📊 Padrão'}
                          {key === 'performance' && '⚡ Performance'}
                          {key === 'acquisition' && '🎯 Aquisição'}
                          {key === 'revenue' && '💰 Receita'}
                          {key === 'traffic' && '📈 Tráfego'}
                          {key === 'engagement' && '❤️ Engajamento'}
                          {key === 'complete' && '🔥 Completo'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {metrics.length} métricas
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePresetSelect(key)}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full" disabled>
                  + Salvar Configuração Atual
                </Button>
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Funcionalidade em desenvolvimento
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Sticky Footer */}
      <div className="sticky bottom-0 inset-x-0 border-t bg-white/80 backdrop-blur px-4 py-3 flex justify-end gap-2 z-10">
        <Button variant="outline" onClick={onClose} className="border-slate-200 text-slate-600">
          Cancelar
        </Button>
        <Button variant="outline" onClick={handleReset} className="border-slate-200 text-slate-600">
          Restaurar Padrão
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
          Salvar Alterações
        </Button>
      </div>
    </ModalFrame>
  );
}