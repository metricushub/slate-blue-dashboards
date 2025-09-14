import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  CheckSquare, 
  Wand2, 
  Users, 
  Calendar, 
  Search,
  Plus,
  MessageCircle,
  ArrowRight,
  BarChart3,
  Target,
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data para demonstração
  const mockData = {
    user: { name: "João" },
    alerts: [
      { id: 1, client: "Cliente A", message: "CPA acima do target", severity: "error" },
      { id: 2, client: "Cliente B", message: "Budget 90% consumido", severity: "warning" }
    ],
    tasks: [
      { id: 1, title: "Revisar relatório semanal", client: "Cliente A", time: "09:00" },
      { id: 2, title: "Call de alinhamento", client: "Cliente B", time: "14:00" },
      { id: 3, title: "Otimizar palavras-chave", client: "Cliente C", time: "16:30" }
    ],
    optimizations: [
      { id: 1, title: "Teste A/B headlines", client: "Cliente A", status: "Em andamento" },
      { id: 2, title: "Ajuste de lances", client: "Cliente B", status: "Planejada" }
    ],
    crmStats: {
      novo: 12,
      qualificacao: 8,
      proposta: 5,
      fechado: 23
    },
    recentClients: [
      { id: 1, name: "Cliente A", lastAccess: "Ontem" },
      { id: 2, name: "Cliente B", lastAccess: "2 dias" },
      { id: 3, name: "Cliente C", lastAccess: "3 dias" }
    ],
    upcomingEvents: [
      { id: 1, title: "Reunião com Cliente A", time: "10:00", date: "Hoje" },
      { id: 2, title: "Apresentação de resultados", time: "15:00", date: "Hoje" },
      { id: 3, title: "Workshop interno", time: "09:30", date: "Amanhã" }
    ]
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'newLead':
        navigate('/leads');
        break;
      case 'newTask':
        // TODO: Implementar modal de nova tarefa
        console.log('Criar nova tarefa');
        break;
      case 'newOptimization':
        navigate('/otimizacoes');
        break;
      case 'chatIA':
        // TODO: Implementar chat IA
        console.log('Abrir Chat IA');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-variant text-primary-foreground">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">
                {getGreeting()}, {mockData.user.name}!
              </h1>
              <p className="text-xl text-primary-foreground/90">
                Gerencie suas campanhas com inteligência e maximize resultados
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => handleQuickAction('newLead')}
                className="mt-6"
              >
                Começar o dia <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="hidden lg:block">
              <div className="w-64 h-48 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-24 w-24 text-primary-foreground/60" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Busca Global */}
        <div className="max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes, campanhas, tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Resumo Rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Alertas Críticos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-destructive" />
                Alertas Críticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.alerts.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum alerta crítico</p>
              ) : (
                mockData.alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{alert.client}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tarefas do Dia */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                Tarefas do Dia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.tasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{task.time}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Otimizações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-accent" />
                Otimizações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.optimizations.map((opt) => (
                <div key={opt.id} className="space-y-2">
                  <p className="text-sm font-medium">{opt.title}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">{opt.client}</p>
                    <Badge variant={opt.status === 'Em andamento' ? 'default' : 'secondary'}>
                      {opt.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* CRM Snapshot */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-success" />
                Leads Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{mockData.crmStats.novo}</p>
                  <p className="text-xs text-muted-foreground">Novo</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{mockData.crmStats.qualificacao}</p>
                  <p className="text-xs text-muted-foreground">Qualificação</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-accent">{mockData.crmStats.proposta}</p>
                  <p className="text-xs text-muted-foreground">Proposta</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{mockData.crmStats.fechado}</p>
                  <p className="text-xs text-muted-foreground">Fechado</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => navigate('/leads')}
              >
                Ver Kanban Completo
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Últimos Clientes Acessados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clientes Recentes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.recentClients.map((client) => (
                <div 
                  key={client.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => navigate(`/cliente/${client.id}/overview`)}
                >
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.lastAccess}</p>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/clientes')}>
                Ver Todos os Clientes
              </Button>
            </CardContent>
          </Card>

          {/* Próximos Eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximos Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockData.upcomingEvents.map((event) => (
                <div key={event.id} className="space-y-1">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} às {event.time}
                  </p>
                </div>
              ))}
              <Separator />
              <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/calendario')}>
                Ver Calendário Completo
              </Button>
            </CardContent>
          </Card>

          {/* Atalhos Rápidos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleQuickAction('newLead')}
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleQuickAction('newTask')}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Criar Tarefa
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleQuickAction('newOptimization')}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Registrar Otimização
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => handleQuickAction('chatIA')}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat IA
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Placeholders "Em Construção" */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatórios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Acesse relatórios detalhados e insights de performance
              </p>
              <Badge variant="secondary">Em construção</Badge>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Objetivos & Metas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Defina e acompanhe objetivos estratégicos
              </p>
              <Badge variant="secondary">Em construção</Badge>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Análises avançadas e previsões inteligentes
              </p>
              <Badge variant="secondary">Em construção</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;