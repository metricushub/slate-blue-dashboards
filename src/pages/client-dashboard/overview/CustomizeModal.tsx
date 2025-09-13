import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronUp, ChevronDown, X, Search, GripVertical, Plus, Trash2 } from "lucide-react";
import { ModalFrameV2 } from "./ModalFrameV2";
import { METRICS, MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useToast } from "@/hooks/use-toast";

// New V2 structure for dynamic funnel
type FunnelStage = { 
  id: string; 
  label: string; 
  metric: string; 
  color?: string;
  userLabel?: boolean; // Track if user manually edited the label
};

type FunnelPrefsV2 = {
  mode: 'Detalhado' | 'Compacto';
  showRates: boolean;
  comparePrevious: boolean;
  colorByStage: boolean;
  stages: FunnelStage[]; // 2..8 stages
};

const defaultFunnelPrefsV2: FunnelPrefsV2 = {
  mode: 'Detalhado',
  showRates: true,
  comparePrevious: false,
  colorByStage: false,
  stages: [
    { id: 'stage1', label: 'Impressões', metric: 'impressions', color: '#3b82f6', userLabel: false },
    { id: 'stage2', label: 'Cliques', metric: 'clicks', color: '#10b981', userLabel: false },
    { id: 'stage3', label: 'Leads', metric: 'leads', color: '#f59e0b', userLabel: false },
    { id: 'stage4', label: 'Receita', metric: 'revenue', color: '#ef4444', userLabel: false },
  ]
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
  // Remove old funnel prefs since we're using V2 now
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

  const footer = (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleReset}>
          Restaurar Padrão
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>
          Salvar
        </Button>
      </div>
    </>
  );

  return (
    <ModalFrameV2
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
          <div className="min-h-[200px] space-y-6">
            <FunnelStageManager clientId={clientId} />
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

    </ModalFrameV2>
  );
}

// Funnel Stage Manager Component
function FunnelStageManager({ clientId }: { clientId: string }) {
  const { toast } = useToast();
  const [funnelPrefs, setFunnelPrefs] = useState<FunnelPrefsV2>(() => {
    if (!clientId) return defaultFunnelPrefsV2;
    
    try {
      // Try V2 format first
      const storedV2 = localStorage.getItem(`client:${clientId}:funnel_prefs@v2`);
      if (storedV2) {
        const parsed = JSON.parse(storedV2);
        return {
          ...defaultFunnelPrefsV2,
          ...parsed,
          stages: parsed.stages || defaultFunnelPrefsV2.stages
        };
      }

      // Migrate from V1 format
      const storedV1 = localStorage.getItem(`client:${clientId}:funnel_prefs`);
      if (storedV1) {
        const parsedV1 = JSON.parse(storedV1);
        
        // Convert V1 mapping to V2 stages
        const migratedStages: FunnelStage[] = [];
        if (parsedV1.mapping) {
          const { stage1, stage2, stage3, stage4 } = parsedV1.mapping;
          const getLabel = (metric: string) => {
            const labels = {
              impressions: 'Impressões',
              clicks: 'Cliques', 
              leads: 'Leads',
              revenue: 'Receita',
              spend: 'Investimento'
            };
            return labels[metric as keyof typeof labels] || metric;
          };

          if (stage1) migratedStages.push({ id: 'stage1', label: getLabel(stage1), metric: stage1 });
          if (stage2) migratedStages.push({ id: 'stage2', label: getLabel(stage2), metric: stage2 });
          if (stage3) migratedStages.push({ id: 'stage3', label: getLabel(stage3), metric: stage3 });
          if (stage4) migratedStages.push({ id: 'stage4', label: getLabel(stage4), metric: stage4 });
        }

        const migrated: FunnelPrefsV2 = {
          mode: parsedV1.mode || 'Detalhado',
          showRates: parsedV1.showRates !== false,
          comparePrevious: parsedV1.comparePrevious === true,
          colorByStage: false,
          stages: migratedStages.length > 0 ? migratedStages : defaultFunnelPrefsV2.stages
        };

        // Save as V2
        localStorage.setItem(`client:${clientId}:funnel_prefs@v2`, JSON.stringify(migrated));
        return migrated;
      }
    } catch (error) {
      console.warn('Failed to parse funnel preferences:', error);
    }
    
    return defaultFunnelPrefsV2;
  });

  // Available metrics for funnel stages
  const AVAILABLE_METRICS = [
    { value: 'impressions', label: 'Impressões' },
    { value: 'clicks', label: 'Cliques' },
    { value: 'leads', label: 'Leads' },
    { value: 'revenue', label: 'Receita' },
    { value: 'spend', label: 'Investimento' },
  ];

  const handleUpdateFunnelPrefs = (updates: Partial<FunnelPrefsV2>) => {
    const newPrefs = { ...funnelPrefs, ...updates };
    setFunnelPrefs(newPrefs);
    
    // Persist to localStorage
    try {
      localStorage.setItem(`client:${clientId}:funnel_prefs@v2`, JSON.stringify(newPrefs));
    } catch (error) {
      console.warn('Failed to save funnel preferences:', error);
    }

    // Update the live funnel component if available
    if ((window as any).updateFunnelV2Prefs) {
      (window as any).updateFunnelV2Prefs(updates);
    }
  };

  const handleStageUpdate = (stageIndex: number, updates: Partial<FunnelStage>) => {
    const newStages = [...funnelPrefs.stages];
    const stage = { ...newStages[stageIndex], ...updates };
    
    // Auto-label when metric changes (if user hasn't manually edited)
    if (updates.metric && !stage.userLabel) {
      const metricLabels: Record<string, string> = {
        impressions: 'Impressões',
        clicks: 'Cliques',
        leads: 'Leads',
        revenue: 'Receita',
        spend: 'Investimento'
      };
      stage.label = metricLabels[updates.metric] || updates.metric;
    }
    
    // Mark as user-edited when label is manually changed
    if (updates.label !== undefined) {
      stage.userLabel = true;
    }
    
    newStages[stageIndex] = stage;
    handleUpdateFunnelPrefs({ stages: newStages });
  };

  const handleAddStage = () => {
    if (funnelPrefs.stages.length >= 8) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 8 estágios permitidos.",
        variant: "destructive"
      });
      return;
    }

    const newStage: FunnelStage = {
      id: `stage${Date.now()}`,
      label: `Etapa ${funnelPrefs.stages.length + 1}`,
      metric: 'leads',
      color: '#8b5cf6',
      userLabel: false
    };

    handleUpdateFunnelPrefs({ 
      stages: [...funnelPrefs.stages, newStage] 
    });
  };

  const handleRemoveStage = (stageIndex: number) => {
    if (funnelPrefs.stages.length <= 2) {
      toast({
        title: "Mínimo necessário",
        description: "Mínimo de 2 estágios necessários.",
        variant: "destructive"
      });
      return;
    }

    const newStages = funnelPrefs.stages.filter((_, index) => index !== stageIndex);
    handleUpdateFunnelPrefs({ stages: newStages });
  };

  const handleMoveStage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= funnelPrefs.stages.length) return;
    
    const newStages = [...funnelPrefs.stages];
    const [movedStage] = newStages.splice(fromIndex, 1);
    newStages.splice(toIndex, 0, movedStage);
    
    handleUpdateFunnelPrefs({ stages: newStages });
  };

  return (
    <div className="space-y-6">
      {/* Mode and Options */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-3 block">
            Modo de Exibição
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={funnelPrefs.mode === 'Detalhado' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleUpdateFunnelPrefs({ mode: 'Detalhado' })}
            >
              Detalhado
            </Button>
            <Button
              type="button"
              variant={funnelPrefs.mode === 'Compacto' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleUpdateFunnelPrefs({ mode: 'Compacto' })}
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
            onCheckedChange={(checked) => handleUpdateFunnelPrefs({ showRates: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Comparar com período anterior
          </label>
          <Switch
            checked={funnelPrefs.comparePrevious}
            onCheckedChange={(checked) => handleUpdateFunnelPrefs({ comparePrevious: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Cores por estágio
          </label>
          <Switch
            checked={funnelPrefs.colorByStage}
            onCheckedChange={(checked) => handleUpdateFunnelPrefs({ colorByStage: checked })}
          />
        </div>
      </div>

      {/* Funnel Preview */}
      <div className="border-t pt-6">
        <label className="text-sm font-medium text-slate-700 mb-4 block">
          Prévia do Funil
        </label>
        <div className="min-h-[200px] p-4 bg-slate-50 rounded-xl border">
          <div className="text-xs text-slate-500 text-center">
            Prévia será exibida aqui com {funnelPrefs.stages.length} estágios
          </div>
        </div>
      </div>

      {/* Dynamic Stages Management */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-slate-700">
            Estágios do Funil ({funnelPrefs.stages.length}/8)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStage}
            disabled={funnelPrefs.stages.length >= 8}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-3" style={{ transition: 'none' }}>
          {funnelPrefs.stages.map((stage, index) => (
            <div
              key={stage.id}
              className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border"
              style={{ transition: 'none' }}
            >
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveStage(index, index - 1)}
                  disabled={index === 0}
                  className="h-6 w-6 p-0"
                >
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveStage(index, index + 1)}
                  disabled={index === funnelPrefs.stages.length - 1}
                  className="h-6 w-6 p-0"
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-600">Nome</Label>
                  <Input
                    value={stage.label}
                    onChange={(e) => handleStageUpdate(index, { label: e.target.value })}
                    className="h-8"
                    placeholder="Nome do estágio"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Métrica</Label>
                  <Select 
                    value={stage.metric} 
                    onValueChange={(value) => handleStageUpdate(index, { metric: value })}
                  >
                    <SelectTrigger className="h-8">
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

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveStage(index)}
                disabled={funnelPrefs.stages.length <= 2}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {funnelPrefs.stages.length <= 2 && (
          <p className="text-xs text-slate-500 text-center bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
            ⚠️ Mínimo de 2 estágios necessários.
          </p>
        )}
        
        {funnelPrefs.stages.length >= 8 && (
          <p className="text-xs text-slate-500 text-center bg-blue-50 border border-blue-200 rounded-xl p-3 mt-3">
            ℹ️ Máximo de 8 estágios atingido.
          </p>
        )}
      </div>
    </div>
  );
}