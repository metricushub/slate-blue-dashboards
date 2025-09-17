import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  Filter,
  Calendar,
  BarChart3,
  Users,
  DollarSign,
  Zap
} from 'lucide-react';
import { Goal, GoalStatus, GoalProgress } from '@/types/goals';
import { formatMetricValue, METRICS } from '@/shared/types/metrics';
import { format, addDays, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalsDashboardProps {
  clientId?: string;
  onCreateGoal?: () => void;
}

const STORAGE_KEY = 'metricus_goals_v1';

function loadClientGoals(clientId: string): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, Goal[]>;
    return parsed[clientId] || [];
  } catch {
    return [];
  }
}

// Mock some progress data for existing goals
function calculateMockProgress(goal: Goal): { progress: number; currentValue: number } {
  const baseProgress = Math.random() * 100;
  let currentValue = 0;
  
  switch (goal.metric) {
    case 'leads':
      currentValue = goal.targetValue * (baseProgress / 100) * (0.8 + Math.random() * 0.4);
      break;
    case 'cpl':
    case 'cpa':
      currentValue = goal.targetValue * (1 + (Math.random() - 0.5) * 0.3);
      break;
    case 'roas':
      currentValue = goal.targetValue * (0.8 + Math.random() * 0.6);
      break;
    case 'spend':
      currentValue = goal.targetValue * (baseProgress / 100);
      break;
    case 'revenue':
      currentValue = goal.targetValue * (baseProgress / 100) * (0.7 + Math.random() * 0.6);
      break;
    default:
      currentValue = goal.targetValue * (baseProgress / 100);
  }

  return {
    progress: Math.min(100, baseProgress + Math.random() * 20),
    currentValue: Math.round(currentValue * 100) / 100
  };
}

export function GoalsDashboard({ clientId, onCreateGoal }: GoalsDashboardProps) {
  const cid = clientId || 'client-1';
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load goals from localStorage
  useEffect(() => {
    const loadedGoals = loadClientGoals(cid);
    // Add mock progress to each goal
    const goalsWithProgress = loadedGoals.map(goal => {
      const { progress, currentValue } = calculateMockProgress(goal);
      return {
        ...goal,
        progress,
        currentValue,
        lastCalculatedAt: new Date().toISOString()
      };
    });
    setGoals(goalsWithProgress);
  }, [cid]);

  const filteredGoals = goals.filter(goal => {
    if (filterStatus !== 'all' && goal.status !== filterStatus) return false;
    if (filterPriority !== 'all' && goal.priority !== filterPriority) return false;
    if (filterCategory !== 'all' && goal.category !== filterCategory) return false;
    return true;
  });

  const getGoalStatusColor = (goal: Goal): string => {
    if (goal.status !== 'active') return 'muted';
    
    if (!goal.progress) return 'destructive';
    
    if (goal.progress >= 100) return 'success';
    if (goal.progress >= 80) return 'warning';
    return 'destructive';
  };

  const getGoalStatusIcon = (goal: Goal) => {
    if (goal.status !== 'active') return Clock;
    
    if (!goal.progress || goal.progress < 80) return AlertTriangle;
    if (goal.progress >= 100) return CheckCircle2;
    return TrendingUp;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'leads': return Users;
      case 'spend': return DollarSign;
      case 'revenue': return TrendingUp;
      case 'cpl':
      case 'cpa': return Target;
      case 'roas': return BarChart3;
      default: return Target;
    }
  };

  const calculateDaysRemaining = (endDate: string): number => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const summary = {
    total: filteredGoals.length,
    achieved: filteredGoals.filter(g => g.progress && g.progress >= 100).length,
    onTrack: filteredGoals.filter(g => g.progress && g.progress >= 80 && g.progress < 100).length,
    atRisk: filteredGoals.filter(g => !g.progress || g.progress < 80).length,
    avgProgress: filteredGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / (filteredGoals.length || 1)
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard de Objetivos</h2>
          <p className="text-muted-foreground">Acompanhe o progresso das suas metas em tempo real</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-chart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
            <p className="text-xs text-muted-foreground">Metas ativas e concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Atingidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{summary.achieved}</div>
            <p className="text-xs text-muted-foreground">100% do objetivo alcançado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Risco</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{summary.atRisk}</div>
            <p className="text-xs text-muted-foreground">Abaixo de 80% do objetivo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-chart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgProgress.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Média de todas as metas</p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {filteredGoals.map((goal) => {
          const StatusIcon = getGoalStatusIcon(goal);
          const MetricIcon = getMetricIcon(goal.metric);
          const daysRemaining = goal.endDate ? calculateDaysRemaining(goal.endDate) : null;
          const metricDef = METRICS[goal.metric];
          
          return (
            <Card key={goal.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MetricIcon className="h-5 w-5 text-chart-primary" />
                    <div>
                      <CardTitle className="text-lg">{goal.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getPriorityColor(goal.priority) === 'warning' ? 'outline' : getPriorityColor(goal.priority) as any}>
                      {goal.priority === 'critical' ? 'Crítica' : 
                       goal.priority === 'high' ? 'Alta' :
                       goal.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                    <StatusIcon className={`h-4 w-4 text-${getGoalStatusColor(goal)}`} />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{goal.progress?.toFixed(1) || 0}%</span>
                  </div>
                  <Progress 
                    value={goal.progress || 0} 
                    className="h-2"
                  />
                </div>

                {/* Current vs Target */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Atual</p>
                    <p className="text-lg font-semibold">
                      {goal.currentValue ? formatMetricValue(goal.currentValue, metricDef.unit) : '-'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {goal.operator === 'gte' ? 'Meta Mínima' : 'Meta Máxima'}
                    </p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(goal.targetValue, metricDef.unit)}
                    </p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {goal.period === 'monthly' ? 'Mensal' : 
                       goal.period === 'weekly' ? 'Semanal' :
                       goal.period === 'daily' ? 'Diário' : goal.period}
                    </span>
                  </div>
                  
                  {daysRemaining !== null && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 
                         daysRemaining === 0 ? 'Último dia' : 'Expirado'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category and Alerts */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {goal.category}
                  </Badge>
                  
                  {goal.enableAlerts && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      <span>Alertas ativos</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma meta encontrada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {filterStatus !== 'all' || filterPriority !== 'all' || filterCategory !== 'all'
                ? 'Tente ajustar os filtros para ver mais metas'
                : 'Configure suas primeiras metas para começar o acompanhamento'
              }
            </p>
            <Button onClick={onCreateGoal}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}