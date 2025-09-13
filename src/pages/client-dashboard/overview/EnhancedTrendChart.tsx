import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MetricRow } from "@/types";
import { METRICS, MetricKey, formatMetricValue, DEFAULT_SELECTED_METRICS } from "@/shared/types/metrics";
import { useDataSource } from "@/hooks/useDataSource";
import { useStableEChart } from "@/shared/hooks/useStableEChart";
import { useClientPrefs } from "@/shared/prefs/useClientPrefs";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Download, TrendingUp, X, AlertCircle, BarChart3, Plus, Check, ChevronsUpDown, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { TrendChartMetricsModal } from "@/components/modals/TrendChartMetricsModal";

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
}

export function EnhancedTrendChart({ 
  clientId, 
  period, 
  platform, 
  granularity
}: EnhancedTrendChartProps) {
  const { dataSource } = useDataSource();
  const { containerRef, updateChart, reinitialize, initError } = useStableEChart({ height: 400 });
  const { toast } = useToast();
  const { prefs, patch } = useClientPrefs(clientId);
  
  // Get metrics from ClientPrefs
  const selectedMetrics = prefs.selectedMetrics;
  
  // Auto-selection and readiness tracking
  const [dataReady, setDataReady] = useState(false);
  const autoRecoverTimeoutRef = useRef<NodeJS.Timeout>();
  const [showMaxMetricsWarning, setShowMaxMetricsWarning] = useState(false);
  const [firstPaintMs, setFirstPaintMs] = useState<number>(0);
  const firstPaintStartTime = useRef<number>(0);
  const [addMetricOpen, setAddMetricOpen] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  // Remove the auto-selection logic since we use ClientPrefs now
  const [chartState, setChartState] = useState<ChartState>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    return {
      selectedMetrics: [],
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

  // Update chart state when selectedMetrics or props change
  useEffect(() => {
    if (!clientId) return;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    const limitedMetrics = selectedMetrics.slice(0, 3);
    
    // Show warning if more than 3 metrics were provided
    if (selectedMetrics.length > 3) {
      setShowMaxMetricsWarning(true);
      setTimeout(() => setShowMaxMetricsWarning(false), 5000);
    }
    
    setChartState(prev => ({
      ...prev,
      selectedMetrics: limitedMetrics,
      dateFrom: startDate.toISOString().split('T')[0],
      dateTo: endDate.toISOString().split('T')[0],
      granularity
    }));
  }, [selectedMetrics, period, granularity, clientId]);

  // Remove persistence logic as it's handled by ClientPrefs

  // Load chart data with readiness gate
  useEffect(() => {
    const loadChartData = async () => {
      if (!clientId || chartState.selectedMetrics.length === 0) {
        setDataReady(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setDataReady(false);
      
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
              
              // Handle missing base data for ratios
              if (metricDef.unit === 'percent' || metricDef.compute) {
                // For computed metrics like ROAS, CPL - show null for missing base
                if (metricKey === 'roas' && point.spend === 0) {
                  point[metricKey] = null;
                } else if (metricKey === 'cpl' && point.leads === 0) {
                  point[metricKey] = null;
                } else {
                  const computed = metricDef.compute ? metricDef.compute(rows) : 
                    (point[metricKey] as number || 0);
                  // Use null instead of 0 when no base data (never string)
                  point[metricKey] = computed || null;
                }
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
        setDataReady(true);  // Mark data as ready

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
        setDataReady(false);
      } finally {
        setLoading(false);
      }
    };

    // Debounce chart updates
    const timeoutId = setTimeout(loadChartData, 120);
    return () => clearTimeout(timeoutId);
  }, [clientId, platform, chartState, dataSource]);

  // Auto-recover mechanism
  useEffect(() => {
    if (dataReady && !loading && chartData.length > 0 && chartState.selectedMetrics.length > 0) {
      // Clear any existing auto-recover timeout
      if (autoRecoverTimeoutRef.current) {
        clearTimeout(autoRecoverTimeoutRef.current);
      }
      
      // Set up auto-recover after 500ms if chart is still empty
      autoRecoverTimeoutRef.current = setTimeout(() => {
        const container = containerRef.current;
        if (container && container.children.length === 0) {
          console.log('Auto-recovering empty chart...');
          reinitialize();
        }
      }, 500);
    }

    return () => {
      if (autoRecoverTimeoutRef.current) {
        clearTimeout(autoRecoverTimeoutRef.current);
      }
    };
  }, [dataReady, loading, chartData, chartState.selectedMetrics, containerRef, reinitialize]);

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
    
    const currentMetrics = selectedMetrics;
    let newMetrics: MetricKey[];
    
    if (currentMetrics.includes(metric)) {
      newMetrics = currentMetrics.filter(m => m !== metric);
    } else if (currentMetrics.length < 3) {
      newMetrics = [...currentMetrics, metric];
    } else {
      // Show warning when trying to add more than 3 metrics
      setShowMaxMetricsWarning(true);
      setTimeout(() => setShowMaxMetricsWarning(false), 5000);
      toast({
        title: "Máximo de métricas atingido",
        description: "Máx. 3 métricas no gráfico. Remova uma métrica antes de adicionar outra.",
        variant: "destructive"
      });
      return;
    }
    
    // Update ClientPrefs
    patch({ selectedMetrics: newMetrics });
  }, [selectedMetrics, patch, toast]);

  const handleAddMetric = useCallback((metric: MetricKey) => {
    if (selectedMetrics.length >= 3) {
      toast({
        title: "Máximo de métricas atingido", 
        description: "Máx. 3 métricas no gráfico.",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedMetrics.includes(metric)) {
      patch({ selectedMetrics: [...selectedMetrics, metric] });
    }
    setAddMetricOpen(false);
  }, [selectedMetrics, patch, toast]);

  const handleRemoveMetric = useCallback((metric: MetricKey) => {
    const newMetrics = selectedMetrics.filter(m => m !== metric);
    patch({ selectedMetrics: newMetrics });
  }, [selectedMetrics, patch]);

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

  // Ensure first paint - force chart render
  const ensureFirstPaint = useCallback(() => {
    if (!containerRef.current) return;
    
    firstPaintStartTime.current = Date.now();
    
    // 1. Draw base axes immediately (skeleton visual)
    const baseOption = {
      grid: { left: 60, right: 40, top: 40, bottom: 60 },
      xAxis: {
        type: 'category' as const,
        data: [],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: {
        type: 'value' as const,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } }
      },
      series: []
    };
    
    // Apply base skeleton
    updateChart(baseOption);
    
    // 2. Use requestAnimationFrame for full option with series
    requestAnimationFrame(() => {
      if (chartOption) {
        updateChart(chartOption);
        
        // Record first paint time
        const paintTime = Date.now() - firstPaintStartTime.current;
        setFirstPaintMs(paintTime);
        
        // Save to localStorage for diagnostics
        localStorage.setItem('chart_first_paint_ms', paintTime.toString());
      }
    });
    
    // 3. Watchdog for problematic renders (600ms)
    const watchdog = setTimeout(() => {
      const container = containerRef.current;
      if (!container || container.children.length === 0 || container.offsetWidth === 0) {
        console.log('Chart watchdog: attempting recovery...');
        
        // Try resize and reapply
        if (updateChart && chartOption) {
          // Force resize
          const chart = (window as any).echarts?.getInstanceByDom?.(container);
          if (chart) {
            chart.resize();
          }
          
          // Reapply option
          updateChart(chartOption);
        }
        
        // If still problematic, dispose and recreate
        setTimeout(() => {
          if (!container || container.children.length === 0) {
            console.log('Chart watchdog: disposing and recreating...');
            reinitialize();
            if (chartOption) {
              setTimeout(() => updateChart(chartOption), 50);
            }
          }
        }, 100);
      }
    }, 600);
    
    return () => clearTimeout(watchdog);
  }, [updateChart, chartOption, containerRef, reinitialize]);

  // Update chart when option changes - with readiness gate
  useEffect(() => {
    if (chartOption && !loading && dataReady) {
      ensureFirstPaint();
    }
  }, [chartOption, loading, dataReady, ensureFirstPaint]);

  const exportChart = () => {
    // Implementation for chart export would go here
    console.log('Exporting chart...');
  };

  if (loading || !dataReady) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="p-5">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <Skeleton className="h-[320px] md:h-[380px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Empty state when no metrics selected
  if (chartState.selectedMetrics.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Nenhuma métrica selecionada
          </h3>
          <p className="text-slate-500 mb-4">
            Selecione até 3 métricas para visualizar as tendências
          </p>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMetricsModal(true)}
              className="h-8 gap-1"
            >
              <Settings className="h-3 w-3" />
              Métricas
            </Button>
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

        {/* Max metrics warning */}
        {showMaxMetricsWarning && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Máximo de 3 métricas no gráfico. As primeiras 3 foram mantidas.
            </AlertDescription>
          </Alert>
        )}

        {/* Quick-edit Metric Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Current metric chips */}
          {selectedMetrics.map(metric => (
            <Badge
              key={metric}
              variant="default"
              className="bg-blue-100 text-blue-700 border-blue-200 cursor-pointer text-xs flex items-center gap-1"
              onClick={() => handleRemoveMetric(metric)}
            >
              {METRICS[metric].label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          
          {/* Add metric button */}
          {selectedMetrics.length < 3 && (
            <Popover open={addMetricOpen} onOpenChange={setAddMetricOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-xs border-dashed hover:bg-slate-50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Métrica
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0">
                <Command>
                  <CommandInput placeholder="Buscar métricas..." className="h-9" />
                  <CommandEmpty>Nenhuma métrica encontrada.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-y-auto">
                    {Object.entries(METRICS)
                      .filter(([key]) => !selectedMetrics.includes(key as MetricKey))
                      .map(([key, metric]) => (
                        <CommandItem
                          key={key}
                          value={key}
                          onSelect={() => handleAddMetric(key as MetricKey)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              "opacity-0"
                            )}
                          />
                          <div>
                            <div className="font-medium">{metric.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {metric.unit === 'currency' && 'Valor monetário'}
                              {metric.unit === 'int' && 'Número inteiro'}
                              {metric.unit === 'percent' && 'Percentual'}
                              {metric.unit === 'decimal' && 'Número decimal'}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          )}
          
          {selectedMetrics.length === 3 && (
            <Badge variant="secondary" className="text-xs">
              Máx. 3 métricas
            </Badge>
          )}
        </div>

        {/* Compare Period Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <Switch
              id="compare-previous"
              checked={chartState.comparePrevious}
              onCheckedChange={handleComparePreviousToggle}
            />
            <Label htmlFor="compare-previous" className="text-sm text-slate-600">
              Comparar período anterior
            </Label>
          </div>
          {chartState.comparePrevious && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Comparação ativa
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 relative">
        {initError ? (
          <div className="flex items-center justify-center h-[320px] md:h-[380px] rounded-xl bg-slate-50 text-slate-600">
            <div className="text-center space-y-2">
              <div className="text-sm">Sem renderizar — toque em ‘Tentar novamente’</div>
              <Button variant="outline" size="sm" onClick={() => reinitialize()}>
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Chart container with explicit height - never hide with display:none */}
            <div 
              ref={containerRef} 
              className={`w-full h-[320px] md:h-[380px] ${
                chartData.length === 0 || chartState.selectedMetrics.length === 0 
                  ? 'opacity-0 pointer-events-none' 
                  : 'opacity-100'
              }`}
            />
            
            {/* Empty state placeholder */}
            {(chartData.length === 0 || chartState.selectedMetrics.length === 0) && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">
                <div className="text-center">
                  <div className="text-lg mb-2">📊</div>
                  <div className="text-sm">Sem dados no período/filtragem</div>
                  <div className="text-xs mt-1 text-slate-300">
                    Selecione métricas para visualizar
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Debug info if ?debug=1 */}
        {new URLSearchParams(window.location.search).get('debug') === '1' && (
          <div className="mt-2 p-2 bg-slate-100 rounded text-xs text-slate-600">
            Chart: {chartData.length} points, {chartState.selectedMetrics.length} metrics, 
            compare={chartState.comparePrevious ? 'on' : 'off'}
          </div>
        )}
      </CardContent>

      <TrendChartMetricsModal
        isOpen={showMetricsModal}
        onClose={() => setShowMetricsModal(false)}
        clientId={clientId}
      />
    </Card>
  );
}