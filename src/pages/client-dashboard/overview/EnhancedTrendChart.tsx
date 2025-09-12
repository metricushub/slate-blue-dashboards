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
import { useStableEChart } from "@/shared/hooks/useStableEChart";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Download, TrendingUp, X } from "lucide-react";

// Metric axis mapping for smart dual-axis handling
const METRIC_AXIS_MAP = {
  spend: 'money',
  revenue: 'money', 
  cpl: 'money',
  cpa: 'money',
  leads: 'count',
  clicks: 'count',
  impressions: 'count',
  roas: 'ratio',
  convRate: 'ratio'
} as const;

interface ChartState {
  selectedMetrics: MetricKey[];
  comparePrevious: boolean;
  dateFrom: string;
  dateTo: string;
  granularity: 'day' | 'week' | 'month';
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  [key: string]: any;
}

interface EnhancedTrendChartProps {
  clientId: string;
  period: number;
  platform: 'all' | 'google' | 'meta';
  granularity: 'day' | 'week' | 'month';
  selectedMetrics: MetricKey[];
}

export function EnhancedTrendChart({ 
  clientId, 
  period, 
  platform, 
  granularity, 
  selectedMetrics 
}: EnhancedTrendChartProps) {
  const { dataSource } = useDataSource();
  const { containerRef, updateChart } = useStableEChart({ height: 400 });
  
  // Single source of truth for chart state
  const [chartState, setChartState] = useState<ChartState>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    return {
      selectedMetrics: selectedMetrics.slice(0, 3),
      comparePrevious: false,
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
      granularity
    };
  });
  
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [previousPeriodData, setPreviousPeriodData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Update chart state when props change
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    setChartState(prev => ({
      ...prev,
      selectedMetrics: selectedMetrics.slice(0, 3),
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
      granularity
    }));
  }, [selectedMetrics, period, granularity]);

  // Load chart data
  useEffect(() => {
    const loadChartData = async () => {
      if (!clientId || chartState.selectedMetrics.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      try {
        let metrics = await dataSource.getMetrics(
          clientId,
          chartState.dateFrom,
          chartState.dateTo
        );

        // Filter by platform
        if (platform !== 'all') {
          metrics = metrics.filter(metric => metric.platform === platform);
        }

        // Group metrics by date based on granularity
        const groupedData = groupMetricsByDate(metrics, chartState.granularity);
        
        // Convert to chart format
        const chartPoints: ChartDataPoint[] = Object.entries(groupedData)
          .map(([date, rows]) => {
            const point: ChartDataPoint = {
              date,
              displayDate: formatDateForDisplay(date, chartState.granularity),
            };

            // Calculate values for each selected metric
            chartState.selectedMetrics.forEach(metricKey => {
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

        // Load previous period data if comparison is enabled
        if (chartState.comparePrevious) {
          const rangeDays = Math.ceil(
            (new Date(chartState.dateTo).getTime() - new Date(chartState.dateFrom).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          
          const prevEndDate = new Date(chartState.dateFrom);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - rangeDays);

          let prevMetrics = await dataSource.getMetrics(
            clientId,
            prevStartDate.toISOString().split('T')[0],
            prevEndDate.toISOString().split('T')[0]
          );

          if (platform !== 'all') {
            prevMetrics = prevMetrics.filter(metric => metric.platform === platform);
          }

          const prevGroupedData = groupMetricsByDate(prevMetrics, chartState.granularity);
          const prevChartPoints: ChartDataPoint[] = Object.entries(prevGroupedData)
            .map(([date, rows]) => {
              const point: ChartDataPoint = {
                date,
                displayDate: formatDateForDisplay(date, chartState.granularity),
              };

              chartState.selectedMetrics.forEach(metricKey => {
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

          setPreviousPeriodData(prevChartPoints);
        } else {
          setPreviousPeriodData([]);
        }
      } catch (error) {
        console.error('Failed to load chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce chart updates
    const timeoutId = setTimeout(loadChartData, 120);
    return () => clearTimeout(timeoutId);
  }, [clientId, platform, chartState, dataSource]);

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

  const handleMetricToggle = useCallback((metric: MetricKey) => {
    if (!METRICS[metric]) return; // Guard against invalid metrics
    
    setChartState(prev => {
      const { selectedMetrics } = prev;
      if (selectedMetrics.includes(metric)) {
        return { ...prev, selectedMetrics: selectedMetrics.filter(m => m !== metric) };
      } else if (selectedMetrics.length < 3) {
        return { ...prev, selectedMetrics: [...selectedMetrics, metric] };
      }
      return prev;
    });
  }, []);

  const handleComparePreviousToggle = useCallback((checked: boolean) => {
    setChartState(prev => ({ ...prev, comparePrevious: checked }));
  }, []);

  // Build chart option deterministically
  const chartOption = useMemo(() => {
    if (chartData.length === 0 || chartState.selectedMetrics.length === 0) {
      return null;
    }

    const colors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04'];
    
    // Determine if we need dual axis
    const axisTypes = new Set(chartState.selectedMetrics.map(m => METRIC_AXIS_MAP[m]));
    const needsDualAxis = axisTypes.size > 1;
    
    const series = chartState.selectedMetrics.map((metric, index) => {
      const metricDef = METRICS[metric];
      const axisType = METRIC_AXIS_MAP[metric];
      
      return {
        name: metricDef.label,
        type: chartType,
        data: chartData.map(point => point[metric] || 0),
        smooth: true,
        lineStyle: { width: 3 },
        itemStyle: { color: colors[index % colors.length] },
        yAxisIndex: needsDualAxis ? (axisType === 'money' ? 0 : 1) : 0,
        areaStyle: chartType === 'line' ? { 
          opacity: 0.1,
          color: colors[index % colors.length]
        } : undefined,
      };
    });

    // Add previous period series if comparison is enabled
    if (chartState.comparePrevious && previousPeriodData.length > 0) {
      const prevSeries = chartState.selectedMetrics.map((metric, index) => {
        const metricDef = METRICS[metric];
        const axisType = METRIC_AXIS_MAP[metric];
        
        return {
          name: `${metricDef.label} (anterior)`,
          type: chartType,
          data: previousPeriodData.map(point => point[metric] || 0),
          smooth: true,
          lineStyle: { 
            width: 2, 
            type: 'dashed',
            color: colors[index % colors.length]
          },
          itemStyle: { 
            color: colors[index % colors.length],
            opacity: 0.7
          },
          yAxisIndex: needsDualAxis ? (axisType === 'money' ? 0 : 1) : 0,
          areaStyle: undefined,
        };
      });
      series.push(...prevSeries);
    }

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155' },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          
          const dataIndex = params[0].dataIndex;
          const date = chartData[dataIndex]?.displayDate;
          let tooltip = `<div style="font-weight: 600; margin-bottom: 8px;">${date}</div>`;
          
          params.forEach((param: any, idx: number) => {
            const seriesName = param.seriesName;
            const value = param.value;
            
            // Find metric for formatting
            let metricDef;
            if (seriesName.includes('(anterior)')) {
              const baseMetric = chartState.selectedMetrics.find(m => 
                seriesName.includes(METRICS[m].label)
              );
              metricDef = baseMetric ? METRICS[baseMetric] : null;
            } else {
              metricDef = Object.values(METRICS).find(m => m.label === seriesName);
            }
            
            const formattedValue = metricDef 
              ? formatMetricValue(value, metricDef.unit)
              : value?.toString() || '0';
              
            tooltip += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: ${param.color}; margin-right: 8px;"></div>
                <span style="font-weight: 500;">${seriesName}:</span>
                <span style="margin-left: 8px; font-weight: 600;">${formattedValue}</span>
              </div>
            `;
          });
          
          return tooltip;
        }
      },
      legend: {
        data: [
          ...chartState.selectedMetrics.map(m => METRICS[m].label),
          ...(chartState.comparePrevious ? chartState.selectedMetrics.map(m => `${METRICS[m].label} (anterior)`) : [])
        ],
        top: 20,
        textStyle: { color: '#64748b' }
      },
      grid: {
        left: '3%',
        right: needsDualAxis ? '8%' : '4%',
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
      yAxis: needsDualAxis ? [
        {
          type: 'value',
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { lineStyle: { color: '#f1f5f9' } }
        },
        {
          type: 'value',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 },
          splitLine: { show: false }
        }
      ] : {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { 
          color: '#64748b', 
          fontSize: 11,
          formatter: (value: number) => {
            const firstMetric = chartState.selectedMetrics[0];
            return firstMetric ? formatMetricValue(value, METRICS[firstMetric].unit) : value.toString();
          }
        },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        }
      ],
      series
    };
  }, [chartData, previousPeriodData, chartState, chartType]);

  // Update chart when option changes
  useEffect(() => {
    if (chartOption && !loading) {
      updateChart(chartOption);
    }
  }, [chartOption, loading, updateChart, updateChart]);

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
              variant={chartState.selectedMetrics.includes(metric) ? "default" : "outline"}
              className={`cursor-pointer text-xs ${
                chartState.selectedMetrics.includes(metric) 
                  ? "bg-blue-100 text-blue-700 border-blue-200" 
                  : "hover:bg-slate-50"
              }`}
              onClick={() => handleMetricToggle(metric)}
            >
              {METRICS[metric].label}
              {chartState.selectedMetrics.includes(metric) && (
                <X className="h-3 w-3 ml-1" />
              )}
            </Badge>
          ))}
          {chartState.selectedMetrics.length < 3 && (
            <Badge variant="outline" className="text-xs text-slate-500">
              +{3 - chartState.selectedMetrics.length} métricas
            </Badge>
          )}
        </div>

        {/* Comparison Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id="compare-previous"
            checked={chartState.comparePrevious}
            onCheckedChange={handleComparePreviousToggle}
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
        ) : chartData.length === 0 && chartState.selectedMetrics.length > 0 ? (
          <div className="w-full h-80 md:h-96 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Sem dados no período/filtragem selecionada</p>
            </div>
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="w-full h-80 md:h-96"
            style={{ minHeight: '320px' }}
          />
        )}
      </CardContent>
    </Card>
  );
}