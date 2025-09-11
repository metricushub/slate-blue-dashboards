import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { METRICS, MetricKey, formatMetricValue } from "@/shared/types/metrics";
import { MetricRow } from "@/types";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";

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
  isPositive: boolean;
  unit: string;
}

export function KpiBoard({ selectedMetrics, clientId, period, platform }: KPIBoardProps) {
  const { dataSource } = useDataSource();
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKPIData = async () => {
      if (!clientId || selectedMetrics.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);
        
        const prevEndDate = new Date(startDate);
        const prevStartDate = new Date(prevEndDate);
        prevStartDate.setDate(prevStartDate.getDate() - period);

        const [currentMetrics, previousMetrics] = await Promise.all([
          dataSource.getMetrics(
            clientId,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ),
          dataSource.getMetrics(
            clientId,
            prevStartDate.toISOString().split('T')[0],
            prevEndDate.toISOString().split('T')[0]
          ),
        ]);

        // Filter by platform
        const filterByPlatform = (metrics: MetricRow[]) => {
          if (platform === 'all') return metrics;
          return metrics.filter(metric => metric.platform === platform);
        };

        const currentFiltered = filterByPlatform(currentMetrics);
        const previousFiltered = filterByPlatform(previousMetrics);

        // Calculate KPI values
        const kpis: KPIData[] = selectedMetrics.map(metricKey => {
          const metricDef = METRICS[metricKey];
          
          let currentValue: number;
          let previousValue: number;

          if (metricDef.compute) {
            currentValue = metricDef.compute(currentFiltered);
            previousValue = metricDef.compute(previousFiltered);
          } else {
            currentValue = currentFiltered.reduce((sum, row) => sum + (row[metricKey as keyof MetricRow] as number || 0), 0);
            previousValue = previousFiltered.reduce((sum, row) => sum + (row[metricKey as keyof MetricRow] as number || 0), 0);
          }

          const change = previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
          const isPositive = metricDef.higherIsBetter ? change >= 0 : change <= 0;

          return {
            key: metricKey,
            label: metricDef.label,
            value: currentValue,
            change,
            isPositive,
            unit: metricDef.unit,
          };
        });

        setKpiData(kpis);
      } catch (error) {
        console.error('Failed to load KPI data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadKPIData();
  }, [clientId, selectedMetrics, period, platform, dataSource]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: selectedMetrics.length || 4 }).map((_, index) => (
          <Card key={index} className="bg-[#11161e] border-[#1f2733]">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-16 mb-2 bg-[#1f2733]" />
              <Skeleton className="h-8 w-24 mb-2 bg-[#1f2733]" />
              <Skeleton className="h-4 w-20 bg-[#1f2733]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (kpiData.length === 0) {
    return (
      <Card className="bg-[#11161e] border-[#1f2733]">
        <CardContent className="p-6 text-center">
          <p className="text-[#9fb0c3]">Nenhuma métrica selecionada</p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (change: number, isPositive: boolean) => {
    if (Math.abs(change) < 0.1) {
      return <Minus className="h-4 w-4 text-[#9fb0c3]" />;
    }
    
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-[#22c55e]" />
    ) : (
      <TrendingDown className="h-4 w-4 text-[#ef4444]" />
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiData.map((kpi) => (
        <Card 
          key={kpi.key} 
          className="bg-[#11161e] border-[#1f2733] relative overflow-hidden group hover:border-[#374151] transition-colors"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1f2733]/20 to-transparent" />
          
          <CardContent className="p-6 relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-[#9fb0c3]">{kpi.label}</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-[#6b7280] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-[#1f2733] border-[#374151] text-[#e6edf3]">
                        <p>{METRICS[kpi.key].higherIsBetter ? 'Maior é melhor' : 'Menor é melhor'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-2xl font-bold text-[#e6edf3] mt-1">
                  {formatMetricValue(kpi.value, METRICS[kpi.key].unit)}
                </p>
              </div>
              {getTrendIcon(kpi.change, kpi.isPositive)}
            </div>
            
            <div className="flex items-center gap-2">
              <span 
                className={`text-sm font-medium ${
                  kpi.isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'
                }`}
              >
                {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
              </span>
              <span className="text-xs text-[#9fb0c3]">vs período anterior</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}