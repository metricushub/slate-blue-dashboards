import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronUp, ChevronDown, X, Search, GripVertical, Plus, Trash2 } from "lucide-react";
import { METRICS, MetricKey, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { STORAGE_KEYS_EXTENDED } from "@/shared/data-source";
import { useToast } from "@/hooks/use-toast";
import { useClientPrefs, type FunnelStagePrefs } from "@/shared/prefs/useClientPrefs";
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
  const [activeTab, setActiveTab] = useState<string>("funnel");
  const [searchQuery, setSearchQuery] = useState("");
  const { prefs, patch } = useClientPrefs(clientId);

  // Get metrics from ClientPrefs
  const localSelectedMetrics = prefs.selectedMetrics;

  const { toast } = useToast();

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveTab("funnel");
    }
  }, [isOpen]);

  // Measure modal height stability and viewport fit for diagnostics
  useEffect(() => {
    if (!isOpen) return;
    
    const modalContainer = document.querySelector('[data-modal-container]') as HTMLElement;
    if (!modalContainer) return;

    const measureStability = () => {
      const initialHeight = modalContainer.offsetHeight;
      const modalRect = modalContainer.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      const fitsViewport = viewportHeight - modalRect.height >= 0;
      
      // Measure after potential content changes
      const timeout = setTimeout(() => {
        const finalHeight = modalContainer.offsetHeight;
        const deltaPx = Math.abs(finalHeight - initialHeight);
        
        localStorage.setItem('diag:modalFunil:heightStability', JSON.stringify({
          initialHeight,
          finalHeight,
          deltaPx,
          viewportHeight,
          modalHeight: modalRect.height,
          fitsViewport,
          timestamp: Date.now(),
          pass: deltaPx <= 2,
          viewportFit: fitsViewport
        }));
      }, 800);
      
      return () => clearTimeout(timeout);
    };

    return measureStability();
  }, [isOpen, activeTab]);

  // Metric management functions using ClientPrefs
  const handleMetricToggle = (metricKey: MetricKey, isAdding: boolean) => {
    const currentMetrics = localSelectedMetrics;
    let newMetrics: MetricKey[];
    
    if (isAdding) {
      if (currentMetrics.length >= MAX_METRICS || currentMetrics.includes(metricKey)) return;
      newMetrics = [...currentMetrics, metricKey];
    } else {
      newMetrics = currentMetrics.filter(key => key !== metricKey);
    }
    
    patch({ selectedMetrics: newMetrics });
    onMetricsChange?.(newMetrics);
  };

  const handleRemoveMetric = (metricKey: MetricKey) => {
    const newMetrics = localSelectedMetrics.filter(key => key !== metricKey);
    patch({ selectedMetrics: newMetrics });
    onMetricsChange?.(newMetrics);
  };

  const handleSave = () => {
    // ClientPrefs auto-saves, so we just need to close
    toast({
      title: "Configurações salvas",
      description: "As configurações foram salvas automaticamente.",
    });
    onClose();
  };

  const handleReset = () => {
    patch({ 
      selectedMetrics: DEFAULT_SELECTED_METRICS.slice(0, 3),
      funnelPrefs: {
        stages: [
          { id: 'stage-1', label: 'Impressões', metric: 'impressions' },
          { id: 'stage-2', label: 'Cliques', metric: 'clicks' },
          { id: 'stage-3', label: 'Leads', metric: 'leads' }
        ],
        mode: 'Detalhado' as const,
        showRates: true,
        comparePrevious: false,
        colorByStage: true
      }
    });
    toast({
      title: "Configurações restauradas",
      description: "As configurações foram restauradas para o padrão.",
    });
  };

  // Handle save and close
  const handleSaveAndClose = () => {
    handleSave();
  };

  const handleCancel = () => {
    onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-none">
        <div className="mx-auto w-[92vw] max-w-3xl">
          <div 
            data-modal-container
            className="
              flex flex-col
              h-[72svh] min-h-[560px] max-h-[85svh]
              md:h-[72vh] md:max-h-[85vh]
              overflow-hidden bg-white rounded-2xl shadow-xl
              [contain:size_layout_paint]
              no-height-anim no-zoom
            "
          >
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              
              {/* HEADER (fixo) */}
              <div className="shrink-0 sticky top-0 z-10 border-b bg-white px-5 py-4 flex items-center justify-between">
                <div className="text-base font-medium">Personalizar</div>
                <TabsList>
                  <TabsTrigger value="funnel">Funil</TabsTrigger>
                  <TabsTrigger value="layout">Layout</TabsTrigger>
                  <TabsTrigger value="advanced">Avançado</TabsTrigger>
                </TabsList>
              </div>

              {/* BODY: ÚNICO SCROLLER */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 py-4 [overflow-anchor:none] no-height-anim">
                
                <TabsContent value="funnel" forceMount className={activeTab === 'funnel' ? '' : 'hidden'}>
                  <div className="flex flex-col gap-4">
            {/* Controles + lista de estágios (pode crescer, mas rola no BODY) */}
            <section className="flex flex-col gap-3">
              <FunnelStageManager clientId={clientId} />
            </section>

                    {/* PRÉVIA DO FUNIL (não pode esticar o modal) */}
                    <section className="shrink-0 min-h-[200px] bg-slate-50 rounded-xl p-4 border">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Prévia do Funil</h4>
                      <div className="text-xs text-slate-600">
                        Visualização do funil será exibida aqui...
                      </div>
                    </section>
                  </div>
                </TabsContent>
                
                <TabsContent value="layout" forceMount className={activeTab === 'layout' ? '' : 'hidden'}>
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-lg mb-2">🎨</div>
                    <div className="text-sm">Configurações de layout</div>
                    <div className="text-xs mt-1">Em breve...</div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" forceMount className={activeTab === 'advanced' ? '' : 'hidden'}>
                  <div className="text-center py-12 text-slate-400">
                    <div className="text-lg mb-2">⚙️</div>
                    <div className="text-sm">Configurações avançadas</div>
                    <div className="text-xs mt-1">Em breve...</div>
                  </div>
                </TabsContent>
                
              </div>

              {/* FOOTER (fixo, ÚNICO) */}
              <div className="shrink-0 sticky bottom-0 z-10 border-t bg-white px-5 py-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={handleCancel}>Cancelar</Button>
                <Button variant="outline" onClick={handleReset}>Restaurar padrão</Button>
                <Button onClick={handleSaveAndClose}>Salvar alterações</Button>
              </div>

            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Funnel Stage Manager Component - Updated to use ClientPrefs
function FunnelStageManager({ clientId }: { clientId: string }) {
  const { prefs, patch } = useClientPrefs(clientId);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  const funnelPrefs = prefs.funnelPrefs;

  // Available metrics for funnel stages
  const AVAILABLE_METRICS = [
    { value: 'impressions', label: 'Impressões' },
    { value: 'clicks', label: 'Cliques' },
    { value: 'leads', label: 'Leads' },
    { value: 'revenue', label: 'Receita' },
    { value: 'spend', label: 'Investimento' },
  ];

  const updatePrefs = (updates: Partial<typeof funnelPrefs>) => {
    patch({ funnelPrefs: { ...funnelPrefs, ...updates } });
  };

  const updateStage = (index: number, updates: Partial<FunnelStagePrefs>) => {
    const newStages = [...funnelPrefs.stages];
    newStages[index] = { ...newStages[index], ...updates };
    updatePrefs({ stages: newStages });
  };

  const addStage = () => {
    if (funnelPrefs.stages.length >= 8) return;
    
    const newStage: FunnelStagePrefs = {
      id: `stage-${Date.now()}`,
      label: `Estágio ${funnelPrefs.stages.length + 1}`,
      metric: 'impressions'
    };
    
    updatePrefs({ stages: [...funnelPrefs.stages, newStage] });
  };

  const removeStage = (index: number) => {
    if (funnelPrefs.stages.length <= 2) return;
    
    const newStages = funnelPrefs.stages.filter((_, i) => i !== index);
    updatePrefs({ stages: newStages });
  };

  return (
    <div className="space-y-6 no-height-anim">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Configuração do Funil</h3>
          <p className="text-sm text-slate-600 mt-1">
            Configure os estágios do funil e suas métricas correspondentes
          </p>
        </div>
      </div>

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
            className="text-xs no-zoom no-height-anim"
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar
          </Button>
        </div>

        <div className="flex flex-col gap-3 no-height-anim">
          {funnelPrefs.stages.map((stage, index) => (
            <div
              key={stage.id}
              data-stage-index={index}
              className="rounded-xl border p-4 bg-white space-y-3 no-height-anim no-zoom"
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
                  className="h-6 w-6 p-0 text-slate-400 hover:text-red-500 no-zoom"
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
  );
}