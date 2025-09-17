import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalAnalyticsProps {
  clientId?: string;
}

// Mock analytics data
const analyticsData = {
  summary: {
    totalGoals: 12,
    activeGoals: 8,
    achievedGoals: 3,
    atRiskGoals: 5,
    avgProgress: 73.2,
    trendsImproving: 6,
    trendsDecreasing: 2
  },
  progressOverTime: [
    { date: '2024-12-01', progress: 45 },
    { date: '2024-12-05', progress: 52 },
    { date: '2024-12-10', progress: 68 },
    { date: '2024-12-15', progress: 73 },
    { date: '2024-12-20', progress: 78 }
  ],
  goalsByCategory: [
    { category: 'Aquisição', count: 4, achieved: 1, progress: 68 },
    { category: 'Conversão', count: 3, achieved: 1, progress: 82 },
    { category: 'Receita', count: 2, achieved: 1, progress: 95 },
    { category: 'Eficiência', count: 2, achieved: 0, progress: 45 },
    { category: 'Qualidade', count: 1, achieved: 0, progress: 60 }
  ],
  goalsByPriority: [
    { priority: 'Crítica', count: 2, achieved: 0, progress: 55 },
    { priority: 'Alta', count: 4, achieved: 2, progress: 85 },
    { priority: 'Média', count: 4, achieved: 1, progress: 72 },
    { priority: 'Baixa', count: 2, achieved: 0, progress: 40 }
  ],
  topPerformingGoals: [
    { name: 'Meta de ROAS', progress: 120, status: 'achieved' },
    { name: 'Taxa de Conversão', progress: 95, status: 'on_track' },
    { name: 'Leads B2B', progress: 87, status: 'on_track' },
    { name: 'Receita Mensal', progress: 78, status: 'warning' }
  ],
  underPerformingGoals: [
    { name: 'CPL Máximo', progress: 25, status: 'at_risk' },
    { name: 'Orçamento Mensal', progress: 35, status: 'at_risk' },
    { name: 'Qualidade de Leads', progress: 42, status: 'warning' }
  ]
};

export function GoalAnalytics({ clientId }: GoalAnalyticsProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'success';
    if (progress >= 80) return 'default';
    if (progress >= 60) return 'warning';
    return 'destructive';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved': return CheckCircle2;
      case 'on_track': return TrendingUp;
      case 'warning': return AlertTriangle;
      case 'at_risk': return TrendingDown;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics de Metas</h2>
          <p className="text-muted-foreground">
            Análise detalhada da performance e tendências das metas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-chart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.activeGoals} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {((analyticsData.summary.achievedGoals / analyticsData.summary.totalGoals) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.summary.achievedGoals} metas atingidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-chart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.summary.avgProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Média de todas as metas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{analyticsData.summary.atRiskGoals}</div>
            <p className="text-xs text-muted-foreground">
              Necessitam atenção imediata
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Goals by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Metas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.goalsByCategory.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{category.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {category.achieved}/{category.count}
                    </span>
                    <Badge variant={getProgressColor(category.progress) as any}>
                      {category.progress}%
                    </Badge>
                  </div>
                </div>
                <Progress value={category.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Goals by Priority */}
        <Card>
          <CardHeader>
            <CardTitle>Metas por Prioridade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsData.goalsByPriority.map((priority) => (
              <div key={priority.priority} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{priority.priority}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {priority.achieved}/{priority.count}
                    </span>
                    <Badge variant={getProgressColor(priority.progress) as any}>
                      {priority.progress}%
                    </Badge>
                  </div>
                </div>
                <Progress value={priority.progress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Performing Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Melhores Performances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.topPerformingGoals.map((goal, index) => {
              const StatusIcon = getStatusIcon(goal.status);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${
                      goal.status === 'achieved' ? 'text-success' :
                      goal.status === 'on_track' ? 'text-chart-primary' :
                      goal.status === 'warning' ? 'text-warning' : 'text-destructive'
                    }`} />
                    <span className="font-medium">{goal.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-success">{goal.progress}%</div>
                    {goal.progress >= 100 && (
                      <Badge variant="default" className="text-xs">
                        Atingida
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Underperforming Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-warning" />
              Necessitam Atenção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData.underPerformingGoals.map((goal, index) => {
              const StatusIcon = getStatusIcon(goal.status);
              return (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`h-4 w-4 ${
                      goal.status === 'at_risk' ? 'text-destructive' : 'text-warning'
                    }`} />
                    <span className="font-medium">{goal.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      goal.status === 'at_risk' ? 'text-destructive' : 'text-warning'
                    }`}>
                      {goal.progress}%
                    </div>
                    <Badge variant={goal.status === 'at_risk' ? 'destructive' : 'outline'} className="text-xs">
                      {goal.status === 'at_risk' ? 'Em Risco' : 'Atenção'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Progress Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Tendências de Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Gráfico de tendências será implementado aqui
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Mostrará evolução do progresso das metas ao longo do tempo
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Insights e Recomendações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-4 border border-success rounded-lg bg-success-light">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="font-medium text-success">Ponto Forte</span>
              </div>
              <p className="text-sm">
                Metas de receita estão consistentemente sendo superadas. 
                Considere aumentar as metas ou investimento.
              </p>
            </div>

            <div className="p-4 border border-warning rounded-lg bg-warning-light">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span className="font-medium text-warning">Oportunidade</span>
              </div>
              <p className="text-sm">
                Metas de eficiência (CPL, CPM) estão abaixo da média. 
                Revisar estratégias de otimização.
              </p>
            </div>

            <div className="p-4 border border-chart-primary rounded-lg bg-primary-light">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-chart-primary" />
                <span className="font-medium text-chart-primary">Tendência</span>
              </div>
              <p className="text-sm">
                Performance geral melhorou 15% nos últimos 30 dias. 
                Momentum positivo sendo mantido.
              </p>
            </div>

            <div className="p-4 border border-muted-foreground rounded-lg bg-muted">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Ação Recomendada</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Configurar alertas automáticos para metas críticas 
                que estão em risco de não serem atingidas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}