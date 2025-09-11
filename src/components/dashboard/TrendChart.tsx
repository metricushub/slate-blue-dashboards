import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useDataSource } from "@/hooks/useDataSource";
import { MetricRow } from "@/types";
import { TrendingUp } from "lucide-react";

interface TrendChartProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  selectedMetric: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  displayDate: string;
}

export function TrendChart({ clientId, period, platform, granularity, selectedMetric }: TrendChartProps) {
  const { dataSource } = useDataSource();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadChartData = async () => {
      setLoading(true);
      
      try {
        const today = new Date();
        const periodStart = new Date(today);
        periodStart.setDate(today.getDate() - period);

        const metrics = await dataSource.getMetrics(
          clientId,
          periodStart.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );

        // Filter by platform if needed
        const filteredMetrics = platform === 'all' 
          ? metrics 
          : metrics.filter(m => m.platform === platform);

        // Group by date and aggregate
        const groupedData = groupMetricsByDate(filteredMetrics, granularity);
        
        // Convert to chart format
        const chartPoints: ChartDataPoint[] = groupedData.map(point => ({
          date: point.date,
          value: getMetricValue(point.metrics, selectedMetric),
          displayDate: formatDateForDisplay(point.date, granularity),
        }));

        setChartData(chartPoints);
      } catch (error) {
        console.error("Error loading chart data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [clientId, period, platform, granularity, selectedMetric, dataSource]);

  const groupMetricsByDate = (metrics: MetricRow[], granularity: 'day' | 'week' | 'month') => {
    const grouped = new Map<string, MetricRow[]>();

    metrics.forEach(metric => {
      const date = new Date(metric.date);
      let key: string;

      if (granularity === 'day') {
        key = metric.date;
      } else if (granularity === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    });

    return Array.from(grouped.entries())
      .map(([date, metrics]) => ({ date, metrics }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const getMetricValue = (metrics: MetricRow[], metric: string): number => {
    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + m.impressions,
        clicks: acc.clicks + m.clicks,
        spend: acc.spend + m.spend,
        leads: acc.leads + m.leads,
        revenue: acc.revenue + m.revenue,
      }),
      { impressions: 0, clicks: 0, spend: 0, leads: 0, revenue: 0 }
    );

    switch (metric) {
      case 'LEADS':
        return totals.leads;
      case 'SPEND':
        return totals.spend;
      case 'CPA':
        return totals.leads > 0 ? totals.spend / totals.leads : 0;
      case 'ROAS':
        return totals.spend > 0 ? totals.revenue / totals.spend : 0;
      case 'CLICKS':
        return totals.clicks;
      case 'IMPRESSIONS':
        return totals.impressions;
      case 'REVENUE':
        return totals.revenue;
      default:
        return totals.leads;
    }
  };

  const formatDateForDisplay = (dateStr: string, granularity: 'day' | 'week' | 'month'): string => {
    const date = new Date(dateStr);
    
    if (granularity === 'day') {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else if (granularity === 'week') {
      return `S${Math.ceil(date.getDate() / 7)}`;
    } else {
      return date.toLocaleDateString('pt-BR', { month: 'short' });
    }
  };

  const formatValue = (value: number): string => {
    if (selectedMetric === 'SPEND' || selectedMetric === 'CPA' || selectedMetric === 'REVENUE') {
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`;
    }
    if (selectedMetric === 'ROAS') {
      return value.toFixed(2);
    }
    return Math.round(value).toLocaleString('pt-BR');
  };

  const getMetricLabel = (): string => {
    const labels = {
      LEADS: "Leads",
      SPEND: "Investimento",
      CPA: "CPA",
      ROAS: "ROAS",
      CLICKS: "Clicks",
      IMPRESSIONS: "Impressões",
      REVENUE: "Receita",
    };
    return labels[selectedMetric as keyof typeof labels] || "Métrica";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendência - {getMetricLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendência - {getMetricLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para o período selecionado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Tendência - {getMetricLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-gradient-from))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--chart-gradient-to))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="displayDate" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [formatValue(value), getMetricLabel()]}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--chart-primary))"
              strokeWidth={2}
              fill="url(#colorGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}