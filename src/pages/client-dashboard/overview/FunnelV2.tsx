import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MetricRow } from "@/types";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";
import { BarChart3, List, TrendingDown, TrendingUp, AlertCircle, Settings } from "lucide-react";
import { FunnelStagesModal } from "@/components/modals/FunnelStagesModal";
import { useClientPrefs } from "@/shared/prefs/useClientPrefs";

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
  stages: FunnelStage[]; // 2..8 stages
  colorByStage: boolean; // ON/OFF for stage colors
};

  const defaultFunnelPrefsV2: FunnelPrefsV2 = {
  mode: 'Detalhado',
  showRates: true,
  comparePrevious: false,
  colorByStage: false, // Default to neutral colors
  stages: [
    { id: 'stage1', label: 'Impressões', metric: 'impressions', color: '#64748b', userLabel: false },
    { id: 'stage2', label: 'Cliques', metric: 'clicks', color: '#10b981', userLabel: false },
    { id: 'stage3', label: 'Leads', metric: 'leads', color: '#f59e0b', userLabel: false },
    { id: 'stage4', label: 'Receita', metric: 'revenue', color: '#ef4444', userLabel: false },
  ]
};

interface FunnelV2Props {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
}

interface FunnelStageData {
  id: string;
  name: string;
  value: number;
  rate?: number;
  percentage: number; // Percentage of first stage for visual sizing
  hasData: boolean;
}

export function FunnelV2({ clientId, period, platform }: FunnelV2Props) {
  const { dataSource } = useDataSource();
  const { prefs } = useClientPrefs(clientId);
  const [stages, setStages] = useState<FunnelStageData[]>([]);
  const [previousStages, setPreviousStages] = useState<FunnelStageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [showStagesModal, setShowStagesModal] = useState(false);

  // Get funnel stages from ClientPrefs
  const funnelStages = prefs?.funnelPrefs?.stages || defaultFunnelPrefsV2.stages;
  const funnelPrefs = prefs?.funnelPrefs || defaultFunnelPrefsV2;

  // Remove localStorage sync - now handled by ClientPrefs
  useEffect(() => {
    const loadFunnelData = async () => {
      if (!clientId || funnelStages.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        const metrics = await dataSource.getMetrics(
          clientId,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        );

        // Filter by platform
        const filteredMetrics = platform === 'all' 
          ? metrics 
          : metrics.filter(metric => metric.platform === platform);

        // Calculate totals based on stage metrics
        const getMetricTotal = (metricName: string) => {
          if (!metricName || !filteredMetrics.length) return 0;
          
          switch (metricName) {
            case 'impressions':
              return filteredMetrics.reduce((sum, row) => sum + (row.impressions || 0), 0);
            case 'clicks':
              return filteredMetrics.reduce((sum, row) => sum + (row.clicks || 0), 0);
            case 'leads':
              return filteredMetrics.reduce((sum, row) => sum + (row.leads || 0), 0);
            case 'revenue':
              return filteredMetrics.reduce((sum, row) => sum + (row.revenue || 0), 0);
            case 'spend':
              return filteredMetrics.reduce((sum, row) => sum + (row.spend || 0), 0);
            case 'conversions':
              return filteredMetrics.reduce((sum, row) => sum + (row.conversions || 0), 0);
            default:
              return 0;
          }
        };

        // Build stage data with auto-labels from ClientPrefs
        let previousValue = 0;
        const stageData: FunnelStageData[] = funnelStages.map((stage, index) => {
          const value = getMetricTotal(stage.metric);
          const hasData = value > 0;
          const rate = index > 0 && previousValue > 0 ? (value / previousValue) * 100 : undefined;
          
          // Use label from ClientPrefs (preserves user edits)
          const displayLabel = stage.label;
          
          const stageResult: FunnelStageData = {
            id: stage.id,
            name: displayLabel,
            value,
            rate,
            percentage: funnelStages.length > 0 && funnelStages[0] 
              ? (value / getMetricTotal(funnelStages[0].metric)) * 100 || 0
              : 100,
            hasData
          };
          
          previousValue = value;
          return stageResult;
        });

        setStages(stageData);

        // Load previous period data if comparison is enabled
        if (funnelPrefs.comparePrevious) {
          const rangeDays = Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          const prevEndDate = new Date(startDate);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - rangeDays);

          const prevMetrics = await dataSource.getMetrics(
            clientId,
            prevStartDate.toISOString().split('T')[0],
            prevEndDate.toISOString().split('T')[0]
          );

          const prevFilteredMetrics = platform === 'all' 
            ? prevMetrics 
            : prevMetrics.filter(metric => metric.platform === platform);

          const getPrevMetricTotal = (metricName: string) => {
            switch (metricName) {
              case 'impressions':
                return prevFilteredMetrics.reduce((sum, row) => sum + (row.impressions || 0), 0);
              case 'clicks':
                return prevFilteredMetrics.reduce((sum, row) => sum + (row.clicks || 0), 0);
              case 'leads':
                return prevFilteredMetrics.reduce((sum, row) => sum + (row.leads || 0), 0);
              case 'revenue':
                return prevFilteredMetrics.reduce((sum, row) => sum + (row.revenue || 0), 0);
              case 'spend':
                return prevFilteredMetrics.reduce((sum, row) => sum + (row.spend || 0), 0);
              case 'conversions':
                return prevFilteredMetrics.reduce((sum, row) => sum + (row.conversions || 0), 0);
              default:
                return 0;
            }
          };

          let prevPreviousValue = 0;
          const prevStageData: FunnelStageData[] = funnelStages.map((stage, index) => {
            const value = getPrevMetricTotal(stage.metric);
            const hasData = value > 0;
            const rate = index > 0 && prevPreviousValue > 0 ? (value / prevPreviousValue) * 100 : undefined;
            
            const prevStageResult: FunnelStageData = {
              id: stage.id,
              name: stage.label,
              value,
              rate,
              percentage: funnelStages.length > 0 && funnelStages[0] 
                ? (value / getPrevMetricTotal(funnelStages[0].metric)) * 100 || 0
                : 100,
              hasData
            };
            
            prevPreviousValue = value;
            return prevStageResult;
          });

          setPreviousStages(prevStageData);
        } else {
          setPreviousStages([]);
        }

        // Analytics track
        console.log('telemetry:funnel_v2_data_loaded', { 
          clientId, 
          platform, 
          period,
          stagesCount: funnelStages.length,
          stages: funnelStages.map(s => ({ label: s.label, metric: s.metric }))
        });
      } catch (error) {
        console.error('Failed to load funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, [clientId, period, platform, dataSource, funnelStages, funnelPrefs, prefs?.lastUpdated]);

  const handleToggleView = (mode: 'chart' | 'table') => {
    setViewMode(mode);
    console.log('telemetry:funnel_view_toggle', { clientId, mode });
  };

  if (loading) {
    return (
      <Card className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        funnelPrefs.mode === 'Compacto' ? 'h-[240px]' : 'h-[280px]'
      }`}>
        <CardContent className="p-5">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-4 w-32"></div>
            <div className="space-y-3">
              {Array.from({ length: funnelStages.length }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[72vh] min-h-[560px] max-h-[85vh] overflow-hidden">
      <CardHeader className="shrink-0 sticky top-0 z-10 bg-white/95 backdrop-blur px-5 py-4 border-b">
        <div className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          Funil de Conversão {funnelStages.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              {funnelStages.length} etapas
            </Badge>
          )}
        </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStagesModal(true)}
              className="h-8 gap-1"
            >
              <Settings className="h-3 w-3" />
              Estágios
            </Button>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleView('chart')}
                className={`h-8 w-8 p-0 rounded ${
                  viewMode === 'chart' 
                    ? 'bg-white text-slate-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleToggleView('table')}
                className={`h-8 w-8 p-0 rounded ${
                  viewMode === 'table' 
                    ? 'bg-white text-slate-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {viewMode === 'chart' ? (
          <div className="space-y-4">
            {stages.map((stage, index) => {
              const prevStage = funnelPrefs.comparePrevious ? previousStages[index] : null;
              
              // Blue gradient for all bars
              const stageColor = `linear-gradient(135deg, #3b82f6, #1d4ed8)`;
              
              return (
                <div key={stage.id} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-wide min-w-fit">
                        {stage.name}
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {new Intl.NumberFormat('pt-BR').format(stage.value)}
                      </span>
                      {!stage.hasData && (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-600">Sem dados</span>
                        </div>
                      )}
                    </div>
                    {funnelPrefs.showRates && stage.rate !== undefined && (
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${
                          stage.rate >= 2 ? 'text-green-600' : 'text-red-500'
                        }`}>
                          {stage.rate.toFixed(1)}%
                        </span>
                        {stage.rate >= 2 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative flex justify-center">
                    {/* Previous period shadow (dashed) */}
                    {funnelPrefs.comparePrevious && prevStage && (
                      <div 
                        className="absolute h-12 border-2 border-dashed border-slate-300 transition-all duration-700 rounded-md z-0"
                        style={{ 
                          width: `${Math.max(5, prevStage.percentage ?? 0)}%`,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      />
                    )}
                    
                    {/* Current period bar with blue gradient */}
                    <div 
                      className="h-12 transition-all duration-700 relative rounded-md z-10"
                      style={{ 
                        width: `${Math.max(5, stage.percentage)}%`,
                        background: stageColor,
                        opacity: stage.hasData ? 1 : 0.3
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-md" />
                    </div>
                  </div>
                  
                  {/* Connection arrow */}
                  {index < stages.length - 1 && (
                    <div className={`flex justify-center mt-2 mb-1 ${
                      funnelPrefs.mode === 'Compacto' ? 'mt-1 mb-0' : ''
                    }`}>
                      <div className={`text-slate-400 text-xs ${
                        funnelPrefs.mode === 'Compacto' ? 'text-[10px]' : ''
                      }`}>↓</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 bg-slate-50">
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Etapa</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Volume</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Taxa</TableHead>
                  <TableHead className="text-xs font-medium text-slate-600 uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((stage) => (
                  <TableRow key={stage.id} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-900 font-medium">
                      {stage.name}
                      {!stage.hasData && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Sem dados
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-900 font-mono">
                      {new Intl.NumberFormat('pt-BR').format(stage.value)}
                    </TableCell>
                    <TableCell className="text-slate-900 font-mono">
                      {funnelPrefs.showRates && stage.rate !== undefined ? `${stage.rate.toFixed(1)}%` : '-'}
                    </TableCell>
                    <TableCell>
                      {funnelPrefs.showRates && stage.rate !== undefined ? (
                        <div className="flex items-center gap-2">
                          {stage.rate >= 2 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="text-green-600 text-xs font-medium">Bom</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-red-500" />
                              <span className="text-red-500 text-xs font-medium">Baixo</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
         )}
         
         {/* Debug info if ?debug=1 */}
         {new URLSearchParams(window.location.search).get('debug') === '1' && (
           <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
             Funnel: {funnelPrefs.stages.length} stages, mode={funnelPrefs.mode}, 
             showRates={funnelPrefs.showRates ? 'on' : 'off'}, 
             compare={funnelPrefs.comparePrevious ? 'on' : 'off'}
           </div>
         )}
      </CardContent>

      <FunnelStagesModal
        isOpen={showStagesModal}
        onClose={() => setShowStagesModal(false)}
        clientId={clientId}
      />
    </Card>
   );
 }