import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  UserPlus, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  ExternalLink,
  Calendar,
  BarChart3
} from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { Client, MetricRow } from "@/types";
import { formatMetricValue } from "@/shared/types/metrics";
import { useNavigate } from "react-router-dom";

interface ClientCardProps {
  client: Client;
  metrics: MetricRow[];
  onViewDashboard: (clientId: string) => void;
}

function ClientCard({ client, metrics, onViewDashboard }: ClientCardProps) {
  // Calculate metrics for this client
  const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
  const totalLeads = metrics.reduce((sum, m) => sum + m.leads, 0);
  const budgetUsed = client.budgetMonth > 0 ? (totalSpend / client.budgetMonth) * 100 : 0;
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'Ativo': return 'bg-success text-success-foreground';
      case 'Risco': return 'bg-destructive text-destructive-foreground';
      case 'Pausado': return 'bg-warning text-warning-foreground';
      case 'Prospect': return 'bg-secondary text-secondary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStageColor = (stage: Client['stage']) => {
    switch (stage) {
      case 'Rodando': return 'text-success';
      case 'Onboarding: Setup': return 'text-warning';
      case 'Prospecção': return 'text-secondary';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthScore = () => {
    let score = 100;
    
    // Budget usage impact
    if (budgetUsed > 90) score -= 30;
    else if (budgetUsed > 75) score -= 15;
    
    // CPL impact (assuming good CPL is under R$50)
    if (cpl > 100) score -= 25;
    else if (cpl > 50) score -= 10;
    
    // Status impact
    if (client.status === 'Risco') score -= 40;
    else if (client.status === 'Pausado') score -= 20;
    
    return Math.max(0, score);
  };

  const healthScore = getHealthScore();

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {client.logoUrl ? (
              <img 
                src={client.logoUrl} 
                alt={client.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-card-foreground">{client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.owner}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <Badge className={getStatusColor(client.status)} variant="secondary">
              {client.status}
            </Badge>
            <span className={`text-xs font-medium ${getStageColor(client.stage)}`}>
              {client.stage}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 space-y-4">
        {/* Budget Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Orçamento mensal</span>
            <span className="font-medium">
              {formatMetricValue(totalSpend, 'currency')} / {formatMetricValue(client.budgetMonth, 'currency')}
            </span>
          </div>
          <Progress 
            value={Math.min(budgetUsed, 100)} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{budgetUsed.toFixed(1)}% usado</span>
            <span>Restante: {formatMetricValue(client.budgetMonth - totalSpend, 'currency')}</span>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground block">Leads (mês)</span>
            <span className="font-semibold text-card-foreground">{totalLeads}</span>
          </div>
          <div>
            <span className="text-muted-foreground block">CPL médio</span>
            <span className="font-semibold text-card-foreground">
              {formatMetricValue(cpl, 'currency')}
            </span>
          </div>
        </div>

        {/* Health Score */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Health Score</span>
            <span className={`font-medium ${
              healthScore >= 80 ? 'text-success' : 
              healthScore >= 60 ? 'text-warning' : 'text-destructive'
            }`}>
              {healthScore}%
            </span>
          </div>
          <Progress 
            value={healthScore} 
            className="h-2"
          />
        </div>

        {/* Alerts */}
        {(budgetUsed > 85 || cpl > 80) && (
          <div className="flex items-center gap-2 p-2 bg-warning-light rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-xs text-warning-foreground">
              {budgetUsed > 85 ? 'Orçamento baixo' : 'CPL elevado'}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onViewDashboard(client.id)}
            className="flex-1 h-9"
            size="sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-9 px-3"
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const { dataSource } = useDataSource();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState<Record<string, MetricRow[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Load clients
        const clientsData = await dataSource.getClients();
        setClients(clientsData);

        // Load monthly metrics for each client
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const metricsPromises = clientsData.map(async (client) => {
          const metrics = await dataSource.getDailyMetrics({
            clientId: client.id,
            from: startDate,
            to: endDate
          });
          return { clientId: client.id, metrics };
        });

        const metricsResults = await Promise.all(metricsPromises);
        const metricsMap = metricsResults.reduce((acc, { clientId, metrics }) => {
          acc[clientId] = metrics;
          return acc;
        }, {} as Record<string, MetricRow[]>);

        setMonthlyMetrics(metricsMap);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dataSource]);

  const activeClients = clients.filter(c => c.status === 'Ativo');
  const onboardingClients = clients.filter(c => c.stage.includes('Onboarding'));
  const riskClients = clients.filter(c => c.status === 'Risco');
  
  const totalMonthlyBudget = clients.reduce((sum, c) => sum + c.budgetMonth, 0);
  const totalSpend = Object.values(monthlyMetrics).flat().reduce((sum, m) => sum + m.spend, 0);

  const handleViewDashboard = (clientId: string) => {
    navigate(`/cliente/${clientId}/overview`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="rounded-2xl">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-success-light rounded-xl">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold text-card-foreground">{activeClients.length}</p>
                <p className="text-xs text-success">+2 este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning-light rounded-xl">
                <UserPlus className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Onboarding</p>
                <p className="text-2xl font-bold text-card-foreground">{onboardingClients.length}</p>
                <p className="text-xs text-warning">Acompanhar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive-light rounded-xl">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Risco</p>
                <p className="text-2xl font-bold text-card-foreground">{riskClients.length}</p>
                <p className="text-xs text-destructive">Ação necessária</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-light rounded-xl">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold text-card-foreground">{clients.length}</p>
                <p className="text-xs text-primary">Portfolio ativo</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Investment Card */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-card-foreground">
            <div className="p-2 bg-primary-light rounded-lg">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            Investimento do Mês
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Orçamento Total</p>
              <p className="text-3xl font-bold text-card-foreground">
                {formatMetricValue(totalMonthlyBudget, 'currency')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Gasto até agora</p>
              <p className="text-3xl font-bold text-primary">
                {formatMetricValue(totalSpend, 'currency')}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Disponível</p>
              <p className="text-3xl font-bold text-success">
                {formatMetricValue(totalMonthlyBudget - totalSpend, 'currency')}
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <Progress 
              value={totalMonthlyBudget > 0 ? (totalSpend / totalMonthlyBudget) * 100 : 0} 
              className="h-3"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {totalMonthlyBudget > 0 ? ((totalSpend / totalMonthlyBudget) * 100).toFixed(1) : 0}% do orçamento total utilizado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Client Cards */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Clientes</h2>
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              metrics={monthlyMetrics[client.id] || []}
              onViewDashboard={handleViewDashboard}
            />
          ))}
        </div>
      </div>
    </div>
  );
}