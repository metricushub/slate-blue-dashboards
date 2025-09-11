import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { MetricRow } from "@/types";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
  selectedMetric: string;
}

interface KPIData {
  value: number;
  change: number;
  isPositive: boolean;
  label: string;
}

export function KPIGrid({ clientId, period, platform, selectedMetric }: KPIGridProps) {
  const { dataSource } = useDataSource();
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadKPIs = async () => {
      setLoading(true);
      
      try {
        const today = new Date();
        const periodStart = new Date(today);
        periodStart.setDate(today.getDate() - period);
        
        const previousPeriodStart = new Date(periodStart);
        previousPeriodStart.setDate(periodStart.getDate() - period);
        
        // Get metrics for current and previous periods
        const currentMetrics = await dataSource.getMetrics(
          clientId,
          periodStart.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        const previousMetrics = await dataSource.getMetrics(
          clientId,
          previousPeriodStart.toISOString().split('T')[0],
          periodStart.toISOString().split('T')[0]
        );

        // Filter by platform if needed
        const filteredCurrent = platform === 'all' 
          ? currentMetrics 
          : currentMetrics.filter(m => m.platform === platform);
          
        const filteredPrevious = platform === 'all'
          ? previousMetrics 
          : previousMetrics.filter(m => m.platform === platform);

        // Calculate aggregated metrics
        const currentTotals = calculateTotals(filteredCurrent);
        const previousTotals = calculateTotals(filteredPrevious);

        // Calculate changes
        const kpis: KPIData[] = [
          {
            label: "Leads",
            value: currentTotals.leads,
            change: calculateChange(currentTotals.leads, previousTotals.leads),
            isPositive: currentTotals.leads >= previousTotals.leads,
          },
          {
            label: "Investimento",
            value: currentTotals.spend,
            change: calculateChange(currentTotals.spend, previousTotals.spend),
            isPositive: currentTotals.spend <= previousTotals.spend, // Lower spend is better
          },
          {
            label: "CPA",
            value: currentTotals.leads > 0 ? currentTotals.spend / currentTotals.leads : 0,
            change: calculateChange(
              currentTotals.leads > 0 ? currentTotals.spend / currentTotals.leads : 0,
              previousTotals.leads > 0 ? previousTotals.spend / previousTotals.leads : 0
            ),
            isPositive: (currentTotals.leads > 0 ? currentTotals.spend / currentTotals.leads : 0) <= 
                       (previousTotals.leads > 0 ? previousTotals.spend / previousTotals.leads : 0),
          },
          {
            label: "ROAS",
            value: currentTotals.spend > 0 ? currentTotals.revenue / currentTotals.spend : 0,
            change: calculateChange(
              currentTotals.spend > 0 ? currentTotals.revenue / currentTotals.spend : 0,
              previousTotals.spend > 0 ? previousTotals.revenue / previousTotals.spend : 0
            ),
            isPositive: (currentTotals.spend > 0 ? currentTotals.revenue / currentTotals.spend : 0) >= 
                       (previousTotals.spend > 0 ? previousTotals.revenue / previousTotals.spend : 0),
          },
        ];

        setKpiData(kpis);
      } catch (error) {
        console.error("Error loading KPIs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadKPIs();
  }, [clientId, period, platform, dataSource]);

  const calculateTotals = (metrics: MetricRow[]) => {
    return metrics.reduce(
      (acc, metric) => ({
        impressions: acc.impressions + metric.impressions,
        clicks: acc.clicks + metric.clicks,
        spend: acc.spend + metric.spend,
        leads: acc.leads + metric.leads,
        revenue: acc.revenue + metric.revenue,
      }),
      { impressions: 0, clicks: 0, spend: 0, leads: 0, revenue: 0 }
    );
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatValue = (value: number, label: string): string => {
    if (label === "Investimento" || label === "CPA") {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
    if (label === "ROAS") {
      return value.toFixed(2);
    }
    return Math.round(value).toLocaleString('pt-BR');
  };

  const getTrendIcon = (isPositive: boolean, change: number) => {
    if (Math.abs(change) < 0.1) {
      return <Minus className="h-4 w-4" />;
    }
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-success" />
    ) : (
      <TrendingDown className="h-4 w-4 text-destructive" />
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold">
                  {formatValue(kpi.value, kpi.label)}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {getTrendIcon(kpi.isPositive, kpi.change)}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      Math.abs(kpi.change) < 0.1
                        ? "text-muted-foreground"
                        : kpi.isPositive
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {Math.abs(kpi.change).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    vs período anterior
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}