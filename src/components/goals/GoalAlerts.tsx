import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Mail,
  MessageSquare,
  Bell,
  BellOff,
  Eye,
  Trash2,
  Settings,
  Target,
  Calendar,
  Users
} from 'lucide-react';
import { GoalAlert } from '@/types/goals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalAlertsProps {
  clientId?: string;
}

// Mock data - Em produção seria carregado do banco
const mockAlerts: GoalAlert[] = [
  {
    id: '1',
    goalId: 'goal-1',
    clientId: 'client-1',
    type: 'under_performance',
    severity: 'warning',
    title: 'Meta de CPL em Risco',
    message: 'O CPL atual (R$ 52) está 15% acima da meta estabelecida (R$ 45). Considere otimizar as campanhas.',
    createdAt: '2024-12-15T14:30:00Z',
    isRead: false,
    actionUrl: '/cliente/client-1/campanhas'
  },
  {
    id: '2',
    goalId: 'goal-2',
    clientId: 'client-1',
    type: 'goal_achieved',
    severity: 'success',
    title: 'Meta de ROAS Atingida!',
    message: 'Parabéns! O ROAS atual (4.2x) superou a meta estabelecida (3.5x). Performance excelente!',
    createdAt: '2024-12-15T09:15:00Z',
    isRead: true,
    actionUrl: '/cliente/client-1/relatorios'
  },
  {
    id: '3',
    goalId: 'goal-3',
    clientId: 'client-1',
    type: 'deadline_approaching',
    severity: 'info',
    title: 'Prazo da Meta Aproximando',
    message: 'Restam apenas 5 dias para atingir a meta de 150 leads mensais. Progresso atual: 84.7%',
    createdAt: '2024-12-14T16:45:00Z',
    isRead: true,
    actionUrl: '/cliente/client-1/objetivos'
  },
  {
    id: '4',
    goalId: 'goal-4',
    clientId: 'client-1',
    type: 'over_performance',
    severity: 'success',
    title: 'Performance Excepcional',
    message: 'As campanhas estão performando 25% acima da expectativa. Considere aumentar o investimento.',
    createdAt: '2024-12-14T11:20:00Z',
    isRead: false,
    actionUrl: '/cliente/client-1/campanhas'
  },
  {
    id: '5',
    goalId: 'goal-5',
    clientId: 'client-1',
    type: 'under_performance',
    severity: 'error',
    title: 'Meta Crítica não Atingida',
    message: 'O investimento mensal já ultrapassou 90% do orçamento aprovado. Ação imediata necessária.',
    createdAt: '2024-12-13T08:30:00Z',
    isRead: false,
    actionUrl: '/cliente/client-1/financeiro'
  }
];

export function GoalAlerts({ clientId }: GoalAlertsProps) {
  const [alerts, setAlerts] = useState<GoalAlert[]>(mockAlerts);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  const filteredAlerts = alerts.filter(alert => {
    if (filterSeverity !== 'all' && alert.severity !== filterSeverity) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (showOnlyUnread && alert.isRead) return false;
    return true;
  });

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return AlertTriangle;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle2;
      case 'info': return Clock;
      default: return Bell;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'under_performance': return TrendingDown;
      case 'over_performance': return TrendingUp;
      case 'goal_achieved': return CheckCircle2;
      case 'deadline_approaching': return Clock;
      default: return Bell;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'under_performance': return 'Performance Abaixo';
      case 'over_performance': return 'Performance Acima';
      case 'goal_achieved': return 'Meta Atingida';
      case 'deadline_approaching': return 'Prazo Próximo';
      default: return type;
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'error': return 'Crítico';
      case 'warning': return 'Atenção';
      case 'success': return 'Sucesso';
      case 'info': return 'Informativo';
      default: return severity;
    }
  };

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header with Settings */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Alertas de Metas</h2>
          <p className="text-muted-foreground">
            Monitore e gerencie alertas automáticos de performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {alertsEnabled ? <Bell className="h-4 w-4 text-success" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            <span className="text-sm text-muted-foreground">Alertas</span>
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
          </div>
          
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alertas</CardTitle>
            <Bell className="h-4 w-4 text-chart-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Lidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{unreadCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alerts.filter(a => a.severity === 'error').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sucessos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {alerts.filter(a => a.severity === 'success').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="error">Crítico</SelectItem>
              <SelectItem value="warning">Atenção</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
              <SelectItem value="info">Informativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="under_performance">Performance Abaixo</SelectItem>
              <SelectItem value="over_performance">Performance Acima</SelectItem>
              <SelectItem value="goal_achieved">Meta Atingida</SelectItem>
              <SelectItem value="deadline_approaching">Prazo Próximo</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Switch
              checked={showOnlyUnread}
              onCheckedChange={setShowOnlyUnread}
            />
            <span className="text-sm text-muted-foreground">Apenas não lidos</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Eye className="mr-2 h-4 w-4" />
            Marcar Todos Lidos
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => {
          const SeverityIcon = getSeverityIcon(alert.severity);
          const TypeIcon = getTypeIcon(alert.type);
          
          return (
            <Card 
              key={alert.id} 
              className={`transition-all hover:shadow-md ${
                !alert.isRead ? 'border-l-4 border-l-chart-primary bg-primary-light/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center gap-2">
                      <SeverityIcon className={`h-5 w-5 text-${getSeverityColor(alert.severity)}`} />
                      <TypeIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-semibold ${!alert.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {alert.title}
                        </h3>
                        <Badge variant={getSeverityColor(alert.severity) as any}>
                          {getSeverityLabel(alert.severity)}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(alert.type)}
                        </Badge>
                        {!alert.isRead && (
                          <Badge variant="default" className="bg-chart-primary">
                            Novo
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(alert.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>Meta ID: {alert.goalId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!alert.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {alert.actionUrl && (
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    )}

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAlerts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {showOnlyUnread || filterSeverity !== 'all' || filterType !== 'all'
                ? 'Nenhum alerta encontrado'
                : 'Nenhum alerta ainda'
              }
            </h3>
            <p className="text-muted-foreground text-center">
              {showOnlyUnread || filterSeverity !== 'all' || filterType !== 'all'
                ? 'Tente ajustar os filtros para ver mais alertas'
                : 'Os alertas aparecerão aqui quando suas metas precisarem de atenção'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Alert Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Alertas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Email</span>
                <p className="text-sm text-muted-foreground">Receber alertas por email</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">WhatsApp</span>
                <p className="text-sm text-muted-foreground">Alertas via WhatsApp</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Push</span>
                <p className="text-sm text-muted-foreground">Notificações push no navegador</p>
              </div>
              <Switch defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Resumo Diário</span>
                <p className="text-sm text-muted-foreground">Relatório diário de alertas</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}