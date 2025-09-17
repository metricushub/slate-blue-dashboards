import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Removed DatePickerWithRange import - not needed for this demo
import { TrendingUp, TrendingDown, Download, Share2, Calendar, BarChart3, Users, Target, DollarSign } from 'lucide-react';
import { useDataSource } from '@/hooks/useDataSource';
import { formatCurrency, formatPercent, calculatePeriodChange } from '@/shared/types/metrics';
import { addDays, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MetricRow } from '@/types';

interface ReportsDashboardProps {
  clientId?: string;
}

export function ReportsDashboard({ clientId }: ReportsDashboardProps) {
  const { dataSource } = useDataSource();
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [metrics, setMetrics] = useState<MetricRow[]>([]);
  const [previousMetrics, setPreviousMetrics] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        const fromDate = format(dateRange.from, 'yyyy-MM-dd');
        const toDate = format(dateRange.to, 'yyyy-MM-dd');
        
        const currentData = await dataSource.getMetrics(clientId, fromDate, toDate);
        
        // Previous period for comparison
        const daysDiff = Math.abs(dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24);
        const prevFromDate = format(subDays(dateRange.from, daysDiff), 'yyyy-MM-dd');
        const prevToDate = format(subDays(dateRange.to, daysDiff), 'yyyy-MM-dd');
        
        const previousData = await dataSource.getMetrics(clientId, prevFromDate, prevToDate);
        
        // Filter by platform if selected
        const filteredCurrent = selectedPlatform === 'all' 
          ? currentData 
          : currentData.filter(m => m.platform === selectedPlatform);
        
        const filteredPrevious = selectedPlatform === 'all' 
          ? previousData 
          : previousData.filter(m => m.platform === selectedPlatform);
        
        setMetrics(filteredCurrent);
        setPreviousMetrics(filteredPrevious);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientId, dateRange, selectedPlatform, dataSource]);

  const calculateTotals = (data: MetricRow[]) => {
    return data.reduce((acc, row) => ({
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      spend: acc.spend + row.spend,
      leads: acc.leads + row.leads,
      revenue: acc.revenue + row.revenue
    }), { impressions: 0, clicks: 0, spend: 0, leads: 0, revenue: 0 });
  };

  const currentTotals = calculateTotals(metrics);
  const previousTotals = calculateTotals(previousMetrics);

  const kpis = [
    {
      title: 'Investimento',
      value: formatCurrency(currentTotals.spend),
      change: calculatePeriodChange(currentTotals.spend, previousTotals.spend),
      icon: DollarSign,
      color: 'chart-primary'
    },
    {
      title: 'Leads Gerados',
      value: currentTotals.leads.toLocaleString('pt-BR'),
      change: calculatePeriodChange(currentTotals.leads, previousTotals.leads),
      icon: Users,
      color: 'success'
    },
    {
      title: 'CPL Médio',
      value: formatCurrency(currentTotals.leads > 0 ? currentTotals.spend / currentTotals.leads : 0),
      change: calculatePeriodChange(
        currentTotals.leads > 0 ? currentTotals.spend / currentTotals.leads : 0,
        previousTotals.leads > 0 ? previousTotals.spend / previousTotals.leads : 0
      ),
      icon: Target,
      color: 'warning',
      inverse: true
    },
    {
      title: 'ROAS',
      value: currentTotals.spend > 0 ? `${(currentTotals.revenue / currentTotals.spend).toFixed(2)}x` : '0x',
      change: calculatePeriodChange(
        currentTotals.spend > 0 ? currentTotals.revenue / currentTotals.spend : 0,
        previousTotals.spend > 0 ? previousTotals.revenue / previousTotals.spend : 0
      ),
      icon: TrendingUp,
      color: 'success'
    }
  ];

  const quickInsights = [
    'Performance 15% acima da média do setor',
    'CPL reduziu 8% nos últimos 30 dias',
    'Taxa de conversão melhorou 12% no período',
    'ROI está 23% acima da meta estabelecida'
  ];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="custom">Período customizado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="google_ads">Google Ads</SelectItem>
              <SelectItem value="meta_ads">Meta Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Button size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositive = kpi.inverse ? !kpi.change.isPositive : kpi.change.isPositive;
          const changeColor = isPositive ? 'success' : 'destructive';
          const TrendIcon = isPositive ? TrendingUp : TrendingDown;

          return (
            <Card key={kpi.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendIcon className={`h-3 w-3 text-${changeColor}`} />
                  <span className={`text-${changeColor}`}>
                    {formatPercent(Math.abs(kpi.change.change))}
                  </span>
                  <span className="text-muted-foreground">vs período anterior</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Performance Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-chart-primary" />
              Resumo de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de Conversão</span>
                  <span className="font-medium">
                    {formatPercent(currentTotals.clicks > 0 ? (currentTotals.leads / currentTotals.clicks) * 100 : 0)}
                  </span>
                </div>
                <Progress 
                  value={currentTotals.clicks > 0 ? (currentTotals.leads / currentTotals.clicks) * 100 : 0} 
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CTR</span>
                  <span className="font-medium">
                    {formatPercent(currentTotals.impressions > 0 ? (currentTotals.clicks / currentTotals.impressions) * 100 : 0)}
                  </span>
                </div>
                <Progress 
                  value={currentTotals.impressions > 0 ? (currentTotals.clicks / currentTotals.impressions) * 100 : 0} 
                  className="mt-1"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta de ROI</span>
                  <span className="font-medium">87% atingido</span>
                </div>
                <Progress value={87} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Insights Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-success flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Relatório Executivo - Dezembro 2024', date: '15/12/2024', status: 'Enviado' },
              { name: 'Performance Mensal - Novembro 2024', date: '01/12/2024', status: 'Visualizado' },
              { name: 'Análise de ROI - Q4 2024', date: '28/11/2024', status: 'Pendente' }
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="space-y-1">
                  <p className="font-medium text-foreground">{report.name}</p>
                  <p className="text-sm text-muted-foreground">Criado em {report.date}</p>
                </div>
                <Badge 
                  variant={report.status === 'Enviado' ? 'default' : report.status === 'Visualizado' ? 'secondary' : 'outline'}
                >
                  {report.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}