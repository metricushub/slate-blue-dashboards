import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricRow } from "@/types";
import { METRICS, MetricKey, formatMetricValue } from "@/shared/types/metrics";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { addDays, format, startOfWeek, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TrendChartProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  selectedMetric: MetricKey;
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
      if (!clientId || !selectedMetric) {
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

        // Group metrics by date based on granularity
        const groupedData = groupMetricsByDate(filteredMetrics, granularity);
        
        // Convert to chart format
        const chartPoints: ChartDataPoint[] = Object.entries(groupedData).map(([date, rows]) => {
          const metricDef = METRICS[selectedMetric];
          
          let value: number;
          if (metricDef.compute) {
            value = metricDef.compute(rows);
          } else {
            value = rows.reduce((sum, row) => sum + (row[selectedMetric as keyof MetricRow] as number || 0), 0);
          }

          return {
            date,
            value,
            displayDate: formatDateForDisplay(date, granularity),
          };
        }).sort((a, b) => a.date.localeCompare(b.date));

        setChartData(chartPoints);
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [clientId, period, platform, granularity, selectedMetric, dataSource]);

  const groupMetricsByDate = (metrics: MetricRow[], granularity: 'day' | 'week' | 'month') => {
    return metrics.reduce((acc, metric) => {
      let key: string;
      const date = new Date(metric.date);
      
      switch (granularity) {
        case 'week':
          key = startOfWeek(date, { locale: ptBR }).toISOString().split('T')[0];
          break;
        case 'month':
          key = startOfMonth(date).toISOString().split('T')[0];
          break;
        default:
          key = metric.date;
      }
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(metric);
      
      return acc;
    }, {} as Record<string, MetricRow[]>);
  };

  const formatDateForDisplay = (date: string, granularity: 'day' | 'week' | 'month') => {
    const dateObj = new Date(date);
    
    switch (granularity) {
      case 'week':
        return format(dateObj, "dd/MM", { locale: ptBR });
      case 'month':
        return format(dateObj, "MMM/yy", { locale: ptBR });
      default:
        return format(dateObj, "dd/MM", { locale: ptBR });
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border border-border rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">
            Tendência - {METRICS[selectedMetric]?.label || 'Métrica'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-80">
            <p className="text-muted-foreground">Nenhum dados encontrado para o período selecionado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const metricDef = METRICS[selectedMetric];

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-foreground">
          Tendência - {metricDef.label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              horizontal={true}
              vertical={false}
            />
            
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 12 }}
              dy={10}
            />
            
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#475569', fontSize: 12 }}
              tickFormatter={(value) => formatMetricValue(value, metricDef.unit)}
              dx={-10}
            />
            
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#0f172a',
                fontSize: '14px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelStyle={{ color: '#475569' }}
              formatter={(value: number) => [
                formatMetricValue(value, metricDef.unit),
                metricDef.label
              ]}
            />
            
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#2563eb',
                strokeWidth: 0,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}