import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Minus, HelpCircle } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { METRICS, MetricKey, formatMetricValue } from "@/shared/types/metrics";
import { MetricRow } from "@/types";
import { startOfDay, subDays } from "date-fns";

interface KPIBoardProps {
  selectedMetrics: MetricKey[];
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
}

interface KPIData {
  key: MetricKey;
  label: string;
  value: number;
  change: number;
  isPositive: boolean | null;
  unit: string;
  description: string;
}

export function KpiBoard({ selectedMetrics, clientId, period, platform }: KPIBoardProps) {
  const { dataSource } = useDataSource();
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKpiData = async () => {
      if (!selectedMetrics.length) {
        setKpiData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const endDate = new Date();
        const startDate = subDays(endDate, period);
        const prevStartDate = subDays(startDate, period);
        
        // Get current and previous period data
        const [currentMetrics, previousMetrics] = await Promise.all([
          dataSource.getMetrics(clientId, startDate.toISOString(), endDate.toISOString()),
          dataSource.getMetrics(clientId, prevStartDate.toISOString(), startDate.toISOString())
        ]);

        // Filter by platform
        const filterByPlatform = (metrics: MetricRow[]) => {
          return platform === 'all' ? metrics : metrics.filter(m => m.platform === platform);
        };

        const currentFiltered = filterByPlatform(currentMetrics);
        const previousFiltered = filterByPlatform(previousMetrics);

        // Calculate KPIs
        const kpis: KPIData[] = selectedMetrics.map(metricKey => {
          const metric = METRICS[metricKey];
          
          let currentValue: number;
          let previousValue: number;

          if (metric.compute) {
            // For computed metrics (like CPL, conversion rate)
            currentValue = metric.compute(currentFiltered);
            previousValue = metric.compute(previousFiltered);
          } else {
            // For direct metrics
            currentValue = currentFiltered.reduce((sum, row) => {
              const value = (row as any)[metricKey] || 0;
              return sum + value;
            }, 0);
            
            previousValue = previousFiltered.reduce((sum, row) => {
              const value = (row as any)[metricKey] || 0;
              return sum + value;
            }, 0);
          }

          // Calculate change percentage
          let change = 0;
          let isPositive: boolean | null = null;
          
          if (previousValue > 0) {
            change = ((currentValue - previousValue) / previousValue) * 100;
            isPositive = metric.higherIsBetter ? change >= 0 : change <= 0;
          } else if (currentValue > 0) {
            change = 100;
            isPositive = metric.higherIsBetter;
          }

          return {
            key: metricKey,
            label: metric.label,
            value: currentValue,
            change: Math.abs(change),
            isPositive,
            unit: metric.unit,
            description: getMetricDescription(metricKey)
          };
        });

        setKpiData(kpis);
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKpiData();
  }, [selectedMetrics, clientId, period, platform, dataSource]);

  const getMetricDescription = (key: MetricKey): string => {
    const descriptions: Record<MetricKey, string> = {
      spend: 'Total investido em anúncios',
      leads: 'Número total de leads capturados',
      cpl: 'Custo por lead (Investimento ÷ Leads)',
      cpa: 'Custo por aquisição',
      roas: 'Retorno sobre o investimento em anúncios',
      clicks: 'Total de cliques nos anúncios',
      impressions: 'Total de visualizações dos anúncios',
      revenue: 'Receita total gerada',
      convRate: 'Taxa de conversão (Leads ÷ Cliques)'
    };
    return descriptions[key] || '';
  };

  const getTrendIcon = (isPositive: boolean | null, change: number) => {
    if (isPositive === null || change === 0) {
      return <Minus className="h-3 w-3" />;
    }
    return isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded mb-4 w-32"></div>
            <div className="h-80 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedMetrics.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <p className="text-slate-500">
            Selecione métricas para visualizar os KPIs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {kpiData.map((kpi) => (
          <Card key={kpi.key} className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    {kpi.label}
                  </h3>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-3 w-3 text-slate-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-48">{kpi.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-2xl font-semibold text-slate-900">
                  {formatMetricValue(kpi.value, kpi.unit as any)}
                </div>
                
                {kpi.change > 0 && (
                  <Badge 
                    variant={kpi.isPositive ? "default" : "destructive"}
                    className={`text-xs flex items-center gap-1 w-fit ${
                      kpi.isPositive 
                        ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" 
                        : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                    }`}
                  >
                    {getTrendIcon(kpi.isPositive, kpi.change)}
                    {kpi.change.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}