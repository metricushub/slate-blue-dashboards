import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MetricRow } from "@/types";
import { METRICS, MetricKey, formatMetricValue } from "@/shared/types/metrics";
import { useDataSource } from "@/hooks/useDataSource";
import { useEffect, useState } from "react";
import { Download, TrendingUp, Plus, X } from "lucide-react";
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

interface EnhancedTrendChartProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  selectedMetrics: MetricKey[];
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  [key: string]: any;
}

export function EnhancedTrendChart({ 
  clientId, 
  period, 
  platform, 
  granularity, 
  selectedMetrics 
}: EnhancedTrendChartProps) {
  const { dataSource } = useDataSource();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMetrics, setActiveMetrics] = useState<MetricKey[]>(selectedMetrics.slice(0, 3));
  const [comparePrevious, setComparePrevious] = useState(false);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    const loadChartData = async () => {
      if (!clientId || activeMetrics.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - period);

        let metrics = await dataSource.getMetrics(
          clientId,
          startDate.toISOString(),
          endDate.toISOString()
        );

        // Filter by platform
        if (platform !== 'all') {
          metrics = metrics.filter(metric => metric.platform === platform);
        }

        // Group metrics by date based on granularity
        const groupedData = groupMetricsByDate(metrics, granularity);
        
        // Convert to chart format
        const chartPoints: ChartDataPoint[] = Object.entries(groupedData)
          .map(([date, rows]) => {
            const point: ChartDataPoint = {
              date,
              displayDate: formatDateForDisplay(date, granularity),
            };

            // Calculate values for each active metric
            activeMetrics.forEach(metricKey => {
              const metricDef = METRICS[metricKey];
              
              if (metricDef.compute) {
                point[metricKey] = metricDef.compute(rows);
              } else {
                point[metricKey] = rows.reduce((sum, row) => 
                  sum + (row[metricKey as keyof MetricRow] as number || 0), 0
                );
              }
            });

            return point;
          })
          .sort((a, b) => a.date.localeCompare(b.date));

        setChartData(chartPoints);
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [clientId, period, platform, granularity, activeMetrics, dataSource]);

  const groupMetricsByDate = (metrics: MetricRow[], granularity: 'day' | 'week' | 'month') => {
    return metrics.reduce((acc, metric) => {
      let key: string;
      const date = new Date(metric.date);
      
      switch (granularity) {
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
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
        return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      case 'month':
        return dateObj.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      default:
        return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  const handleMetricToggle = (metric: MetricKey) => {
    if (activeMetrics.includes(metric)) {
      setActiveMetrics(prev => prev.filter(m => m !== metric));
    } else if (activeMetrics.length < 3) {
      setActiveMetrics(prev => [...prev, metric]);
    }
  };

  const getChartOption = () => {
    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04'];
    
    const series = activeMetrics.map((metric, index) => {
      const metricDef = METRICS[metric];
      return {
        name: metricDef.label,
        type: chartType,
        data: chartData.map(point => point[metric]),
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: colors[index % colors.length] },
        areaStyle: chartType === 'line' ? { 
          opacity: 0.1,
          color: colors[index % colors.length]
        } : undefined,
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          
          const date = chartData[params[0].dataIndex]?.displayDate;
          let tooltip = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`;
          
          params.forEach((param: any) => {
            const metricKey = activeMetrics[param.seriesIndex];
            const metricDef = METRICS[metricKey];
            const value = formatMetricValue(param.value, metricDef.unit);
            tooltip += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></div>
                <span style="font-weight: 500;">${param.seriesName}:</span>
                <span style="margin-left: 8px; font-weight: 600;">${value}</span>
              </div>
            `;
          });
          
          return tooltip;
        }
      },
      legend: {
        data: activeMetrics.map(m => METRICS[m].label),
        top: 20,
        textStyle: { color: '#64748b' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartData.map(point => point.displayDate),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: activeMetrics.length === 1 ? {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: '#64748b', 
          fontSize: 11,
          formatter: (value: number) => formatMetricValue(value, METRICS[activeMetrics[0]].unit)
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      } : [
        {
          type: 'value',
          name: activeMetrics[0] ? METRICS[activeMetrics[0]].label : '',
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        {
          type: 'value',
          name: activeMetrics[1] ? METRICS[activeMetrics[1]].label : '',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ],
      series
    };
  };

  const exportChart = () => {
    // Implementation for chart export would go here
    console.log('Exporting chart...');
  };

  if (loading) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Tendência das Métricas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(value: 'line' | 'bar') => setChartType(value)}>
              <SelectTrigger className="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="bar">Barra</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportChart} className="h-8 gap-1">
              <Download className="h-3 w-3" />
              PNG
            </Button>
          </div>
        </div>

        {/* Metric Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedMetrics.slice(0, 6).map(metric => (
            <Badge
              key={metric}
              variant={activeMetrics.includes(metric) ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                activeMetrics.includes(metric) 
                  ? "bg-blue-100 text-blue-700 border-blue-200" 
                  : "hover:bg-slate-50"
              }`}
              onClick={() => handleMetricToggle(metric)}
            >
              {METRICS[metric].label}
              {activeMetrics.includes(metric) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
          {activeMetrics.length < 3 && (
            <Badge variant="outline" className="text-xs text-slate-500">
              +{3 - activeMetrics.length} métricas
            </Badge>
          )}
        </div>

        {/* Comparison Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="compare-previous"
            checked={comparePrevious}
            onCheckedChange={setComparePrevious}
            disabled // Will be enabled when comparison is implemented
          />
          <Label htmlFor="compare-previous" className="text-sm text-slate-600">
            Comparar com período anterior
          </Label>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-0">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-80 text-slate-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum dado encontrado para o período selecionado</p>
            </div>
          </div>
        ) : (
          <div style={{ width: '100%', height: '400px' }}>
            <ReactEChartsCore
              echarts={echarts}
              option={getChartOption()}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}