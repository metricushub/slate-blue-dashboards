import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MetricRow } from "@/types";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";
import { BarChart3, List, TrendingDown, TrendingUp, AlertCircle } from "lucide-react";

// New V2 structure for dynamic funnel
type FunnelStage = { 
  id: string; 
  label: string; 
  metric: string; 
  color?: string;
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
    { id: 'stage1', label: 'Impressões', metric: 'impressions', color: '#64748b' },
    { id: 'stage2', label: 'Cliques', metric: 'clicks', color: '#10b981' },
    { id: 'stage3', label: 'Leads', metric: 'leads', color: '#f59e0b' },
    { id: 'stage4', label: 'Receita', metric: 'revenue', color: '#ef4444' },
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
  const [stages, setStages] = useState<FunnelStageData[]>([]);
  const [previousStages, setPreviousStages] = useState<FunnelStageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
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
          colorByStage: false, // Default to neutral
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

  // Update localStorage when prefs change  
  useEffect(() => {
    if (clientId && funnelPrefs) {
      try {
        localStorage.setItem(`client:${clientId}:funnel_prefs@v2`, JSON.stringify(funnelPrefs));
      } catch (error) {
        console.warn('Failed to save funnel preferences:', error);
      }
    }
  }, [clientId, funnelPrefs]);

  useEffect(() => {
    const loadFunnelData = async () => {
      if (!clientId || funnelPrefs.stages.length === 0) {
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
            default:
              return 0;
          }
        };

        // Build stage data
        let previousValue = 0;
        const stageData: FunnelStageData[] = funnelPrefs.stages.map((stage, index) => {
          const value = getMetricTotal(stage.metric);
          const hasData = value > 0;
          const rate = index > 0 && previousValue > 0 ? (value / previousValue) * 100 : undefined;
          
          const stageResult: FunnelStageData = {
            id: stage.id,
            name: stage.label,
            value,
            rate,
            percentage: funnelPrefs.stages.length > 0 && funnelPrefs.stages[0] 
              ? (value / getMetricTotal(funnelPrefs.stages[0].metric)) * 100 || 0
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
              default:
                return 0;
            }
          };

          let prevPreviousValue = 0;
          const prevStageData: FunnelStageData[] = funnelPrefs.stages.map((stage, index) => {
            const value = getPrevMetricTotal(stage.metric);
            const hasData = value > 0;
            const rate = index > 0 && prevPreviousValue > 0 ? (value / prevPreviousValue) * 100 : undefined;
            
            const prevStageResult: FunnelStageData = {
              id: stage.id,
              name: stage.label,
              value,
              rate,
              percentage: funnelPrefs.stages.length > 0 && funnelPrefs.stages[0] 
                ? (value / getPrevMetricTotal(funnelPrefs.stages[0].metric)) * 100 || 0
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
          stagesCount: funnelPrefs.stages.length,
          stages: funnelPrefs.stages.map(s => ({ label: s.label, metric: s.metric }))
        });
      } catch (error) {
        console.error('Failed to load funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, [clientId, period, platform, dataSource, funnelPrefs]);

  const handleToggleView = (mode: 'chart' | 'table') => {
    setViewMode(mode);
    console.log('telemetry:funnel_view_toggle', { clientId, mode });
  };

  // Sync with external funnel prefs updates
  const updateFunnelPrefs = (newPrefs: Partial<FunnelPrefsV2>) => {
    setFunnelPrefs(prev => ({ ...prev, ...newPrefs }));
  };

  // Expose function for external updates (from customize modal)
  (window as any).updateFunnelV2Prefs = updateFunnelPrefs;

  if (loading) {
    return (
      <Card className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${
        funnelPrefs.mode === 'Compacto' ? 'h-[240px]' : 'h-[280px]'
      }`}>
        <CardContent className="p-5">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-4 w-32"></div>
            <div className="space-y-3">
              {Array.from({ length: funnelPrefs.stages.length }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-2xl border border-slate-200 bg-white shadow-sm flex-1 flex flex-col ${
      funnelPrefs.mode === 'Compacto' ? 'h-[240px]' : ''
    }`}>
      <CardHeader className={`p-5 pb-3 ${funnelPrefs.mode === 'Compacto' ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg font-semibold text-slate-900 ${
            funnelPrefs.mode === 'Compacto' ? 'text-base' : ''
          }`}>
            Funil de Conversão {funnelPrefs.stages.length > 4 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {funnelPrefs.stages.length} etapas
              </Badge>
            )}
          </CardTitle>
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
      </CardHeader>
      
      <CardContent className={`p-5 pt-0 flex-1 ${
        funnelPrefs.mode === 'Compacto' ? 'p-3 pt-0' : ''
      }`}>
        {viewMode === 'chart' ? (
          <div className={`space-y-4 ${funnelPrefs.mode === 'Compacto' ? 'space-y-2' : ''}`}>
            {stages.map((stage, index) => {
              const prevStage = funnelPrefs.comparePrevious ? previousStages[index] : null;
              
              // Color logic: neutral vs. stage-specific
              const stageColor = funnelPrefs.colorByStage 
                ? funnelPrefs.stages[index]?.color || '#3b82f6'
                : `hsl(215, ${15 + (index * 3)}%, ${50 + (index * 5)}%)`; // Neutral tones with slight opacity variation
              
              return (
                <div key={stage.id} className="relative">
                  <div className={`flex items-center justify-between mb-2 ${
                    funnelPrefs.mode === 'Compacto' ? 'mb-1' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium text-slate-600 uppercase tracking-wide min-w-fit ${
                        funnelPrefs.mode === 'Compacto' ? 'text-[10px]' : ''
                      }`}>
                        {stage.name}
                      </span>
                      <span className={`text-lg font-semibold text-slate-900 ${
                        funnelPrefs.mode === 'Compacto' ? 'text-sm' : ''
                      }`}>
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
                        } ${funnelPrefs.mode === 'Compacto' ? 'text-[10px]' : ''}`}>
                          {stage.rate.toFixed(1)}%
                        </span>
                        {stage.rate >= 2 ? (
                          <TrendingUp className={`h-3 w-3 text-green-600 ${
                            funnelPrefs.mode === 'Compacto' ? 'h-2 w-2' : ''
                          }`} />
                        ) : (
                          <TrendingDown className={`h-3 w-3 text-red-500 ${
                            funnelPrefs.mode === 'Compacto' ? 'h-2 w-2' : ''
                          }`} />
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative flex justify-center">
                    {/* Previous period shadow (dashed) */}
                    {funnelPrefs.comparePrevious && prevStage && (
                      <div 
                        className={`absolute ${funnelPrefs.mode === 'Compacto' ? 'h-4' : 'h-12'} border-2 border-dashed border-slate-300 transition-all duration-700 rounded-md z-0`}
                        style={{ 
                          width: `${Math.max(20, 100 - (index * 15))}%`,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      />
                    )}
                    
                    {/* Current period bar */}
                    <div 
                      className={`${funnelPrefs.mode === 'Compacto' ? 'h-6' : 'h-12'} transition-all duration-700 relative rounded-md z-10`}
                      style={{ 
                        width: `${Math.max(20, 100 - (index * 15))}%`,
                        backgroundColor: stageColor,
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
    </Card>
  );
}