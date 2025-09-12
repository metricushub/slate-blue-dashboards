import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricRow } from "@/types";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";
import { BarChart3, List, TrendingDown, TrendingUp } from "lucide-react";

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

interface FunnelProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
}

interface FunnelStage {
  name: string;
  value: number;
  rate?: number;
  percentage: number; // Percentage of first stage for visual sizing
}

export function Funnel({ clientId, period, platform }: FunnelProps) {
  const { dataSource } = useDataSource();
  const [stages, setStages] = useState<FunnelStage[]>([]);
  const [previousStages, setPreviousStages] = useState<FunnelStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [funnelPrefs, setFunnelPrefs] = useState<FunnelPrefs>(() => {
    const stored = localStorage.getItem(`client:${clientId}:funnel_prefs`);
    return stored ? JSON.parse(stored) : defaultFunnelPrefs;
  });

  // Update localStorage when prefs change  
  useEffect(() => {
    localStorage.setItem(`client:${clientId}:funnel_prefs`, JSON.stringify(funnelPrefs));
  }, [clientId, funnelPrefs]);

  useEffect(() => {
    const loadFunnelData = async () => {
      if (!clientId) {
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

        // Calculate totals based on mapping
        const getMetricTotal = (metricName: string) => {
          switch (metricName) {
            case 'impressions':
              return filteredMetrics.reduce((sum, row) => sum + row.impressions, 0);
            case 'clicks':
              return filteredMetrics.reduce((sum, row) => sum + row.clicks, 0);
            case 'leads':
              return filteredMetrics.reduce((sum, row) => sum + row.leads, 0);
            case 'revenue':
              return filteredMetrics.reduce((sum, row) => sum + row.revenue, 0);
            case 'spend':
              return filteredMetrics.reduce((sum, row) => sum + row.spend, 0);
            default:
              return 0;
          }
        };

        const stage1Value = getMetricTotal(funnelPrefs.mapping.stage1);
        const stage2Value = getMetricTotal(funnelPrefs.mapping.stage2);
        const stage3Value = getMetricTotal(funnelPrefs.mapping.stage3);
        const stage4Value = getMetricTotal(funnelPrefs.mapping.stage4);

        // Calculate rates between stages  
        const getStageLabel = (metricName: string) => {
          const labels = {
            impressions: 'Impressões',
            clicks: 'Cliques', 
            leads: 'Leads',
            revenue: 'Receita',
            spend: 'Investimento'
          };
          return labels[metricName as keyof typeof labels] || metricName;
        };

        const stage1Label = getStageLabel(funnelPrefs.mapping.stage1);
        const stage2Label = getStageLabel(funnelPrefs.mapping.stage2);
        const stage3Label = getStageLabel(funnelPrefs.mapping.stage3);
        const stage4Label = getStageLabel(funnelPrefs.mapping.stage4);

        const rate2 = stage1Value > 0 ? (stage2Value / stage1Value) * 100 : 0;
        const rate3 = stage2Value > 0 ? (stage3Value / stage2Value) * 100 : 0;
        const rate4 = stage3Value > 0 ? (stage4Value / stage3Value) * 100 : 0;

        const funnelStages: FunnelStage[] = [
          { 
            name: stage1Label, 
            value: stage1Value, 
            percentage: 100 
          },
          { 
            name: stage2Label,
            value: stage2Value, 
            rate: rate2,
            percentage: stage1Value > 0 ? (stage2Value / stage1Value) * 100 : 0
          },
          { 
            name: stage3Label, 
            value: stage3Value, 
            rate: rate3,
            percentage: stage1Value > 0 ? (stage3Value / stage1Value) * 100 : 0
          },
          { 
            name: stage4Label, 
            value: stage4Value, 
            rate: rate4,
            percentage: stage1Value > 0 ? (stage4Value / stage1Value) * 100 : 0
          },
        ];

        setStages(funnelStages);

        // Load previous period data if comparison is enabled
        if (funnelPrefs.comparePrevious) {
          const prevEndDate = new Date(startDate);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - period);

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
                return prevFilteredMetrics.reduce((sum, row) => sum + row.impressions, 0);
              case 'clicks':
                return prevFilteredMetrics.reduce((sum, row) => sum + row.clicks, 0);
              case 'leads':
                return prevFilteredMetrics.reduce((sum, row) => sum + row.leads, 0);
              case 'revenue':
                return prevFilteredMetrics.reduce((sum, row) => sum + row.revenue, 0);
              case 'spend':
                return prevFilteredMetrics.reduce((sum, row) => sum + row.spend, 0);
              default:
                return 0;
            }
          };

          const prevStage1Value = getPrevMetricTotal(funnelPrefs.mapping.stage1);
          const prevStage2Value = getPrevMetricTotal(funnelPrefs.mapping.stage2);
          const prevStage3Value = getPrevMetricTotal(funnelPrefs.mapping.stage3);
          const prevStage4Value = getPrevMetricTotal(funnelPrefs.mapping.stage4);

          const prevRate2 = prevStage1Value > 0 ? (prevStage2Value / prevStage1Value) * 100 : 0;
          const prevRate3 = prevStage2Value > 0 ? (prevStage3Value / prevStage2Value) * 100 : 0;
          const prevRate4 = prevStage3Value > 0 ? (prevStage4Value / prevStage3Value) * 100 : 0;

          const prevFunnelStages: FunnelStage[] = [
            { name: stage1Label, value: prevStage1Value, percentage: 100 },
            { name: stage2Label, value: prevStage2Value, rate: prevRate2, percentage: prevStage1Value > 0 ? (prevStage2Value / prevStage1Value) * 100 : 0 },
            { name: stage3Label, value: prevStage3Value, rate: prevRate3, percentage: prevStage1Value > 0 ? (prevStage3Value / prevStage1Value) * 100 : 0 },
            { name: stage4Label, value: prevStage4Value, rate: prevRate4, percentage: prevStage1Value > 0 ? (prevStage4Value / prevStage1Value) * 100 : 0 },
          ];

          setPreviousStages(prevFunnelStages);
        } else {
          setPreviousStages([]);
        }

        // Analytics track
        console.log('telemetry:funnel_data_loaded', { 
          clientId, 
          platform, 
          period,
          stage1Value,
          stage2Value,
          stage3Value,
          stage4Value,
          mapping: funnelPrefs.mapping
        });
      } catch (error) {
        console.error('Failed to load funnel data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFunnelData();
  }, [clientId, period, platform, dataSource, funnelPrefs.comparePrevious]);

  const handleToggleView = (mode: 'chart' | 'table') => {
    setViewMode(mode);
    console.log('telemetry:funnel_view_toggle', { clientId, mode });
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm h-[280px]">
        <CardContent className="p-5">
          <div className="animate-pulse">
            <div className="h-4 bg-slate-200 rounded mb-4 w-32"></div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
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
      funnelPrefs.mode === 'Compacto' ? 'h-60' : ''
    }`}>
      <CardHeader className={`p-5 pb-3 ${funnelPrefs.mode === 'Compacto' ? 'pb-2' : ''}`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg font-semibold text-slate-900 ${
            funnelPrefs.mode === 'Compacto' ? 'text-base' : ''
          }`}>
            Funil de Conversão
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
              
              return (
                <div key={stage.name} className="relative">
                  <div className={`flex items-center justify-between mb-2 ${
                    funnelPrefs.mode === 'Compacto' ? 'mb-1' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium text-slate-600 uppercase tracking-wide w-16 ${
                        funnelPrefs.mode === 'Compacto' ? 'text-[10px] w-12' : ''
                      }`}>
                        {stage.name}
                      </span>
                      <span className={`text-lg font-semibold text-slate-900 ${
                        funnelPrefs.mode === 'Compacto' ? 'text-sm' : ''
                      }`}>
                        {new Intl.NumberFormat('pt-BR').format(stage.value)}
                      </span>
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
                          width: `${100 - (index * 20)}%`,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      />
                    )}
                    
                    {/* Current period bar */}
                    <div 
                      className={`${funnelPrefs.mode === 'Compacto' ? 'h-6' : 'h-12'} bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 relative rounded-md z-10`}
                      style={{ 
                        width: `${100 - (index * 20)}%`
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
                  <TableRow key={stage.name} className="border-slate-200 hover:bg-slate-50">
                    <TableCell className="text-slate-900 font-medium">
                      {stage.name}
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
      </CardContent>
    </Card>
  );
}