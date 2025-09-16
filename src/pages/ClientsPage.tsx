import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, AlertTriangle, Users, Clock, Target } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { Client } from "@/types";
import { ClientCard } from "@/components/home/ClientCard";
import { ClientCreationWizard } from "@/components/modals/ClientCreationWizard";
import { toast } from "@/hooks/use-toast";

const ClientsPage = () => {
  const { dataSource } = useDataSource();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [orderBy, setOrderBy] = useState<string>("name_asc");
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const loadClients = async () => {
    try {
      setLoading(true);
      const clientsData = await dataSource.getClients();
      setClients(clientsData);
      setFilteredClients(clientsData);
    } catch (error) {
      console.error("Error loading clients:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [dataSource]);

  useEffect(() => {
    let filtered = clients;

    if (searchQuery) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    if (ownerFilter !== "all") {
      filtered = filtered.filter(client => client.owner === ownerFilter);
    }

    if (stageFilter !== "all") {
      filtered = filtered.filter(client => client.stage === stageFilter);
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (orderBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'budget_desc':
          return (b.monthlyBudget || 0) - (a.monthlyBudget || 0);
        case 'budget_asc':
          return (a.monthlyBudget || 0) - (b.monthlyBudget || 0);
        case 'lastUpdate_desc':
          return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
        case 'lastUpdate_asc':
          return new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime();
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredClients(sorted);
  }, [clients, searchQuery, statusFilter, ownerFilter, stageFilter, orderBy]);

  const kpiData = {
    active: clients.filter(c => c.status === 'active').length,
    onboarding: clients.filter(c => c.status === 'onboarding').length,
    atRisk: clients.filter(c => c.status === 'at_risk').length,
    total: clients.length,
  };

  const totalInvestment = clients
    .filter(c => c.status === 'active')
    .reduce((sum, client) => sum + (client.monthlyBudget || 0), 0);

  const uniqueOwners = [...new Set(clients.map(c => c.owner))];
  const uniqueStages = [...new Set(clients.map(c => c.stage))];

  const handleClientRegistered = async (client: Client) => {
    try {
      if (dataSource.addClient) {
        await dataSource.addClient(client);
        await loadClients(); // Refresh the list
        
        // Create onboarding automatically
        const { onboardingCardOperations } = await import('@/shared/db/onboardingStore');
        const { createCardFromTemplate, getTemplateByStage } = await import('@/shared/data/onboardingTemplates');
        
        // Create cards for all stages
        const stages = ['dados-gerais', 'financeiro', 'implementacao', 'briefing', 'configuracao'];
        for (const stage of stages) {
          const template = getTemplateByStage(stage);
          if (template) {
            const card = createCardFromTemplate(template, client.id, client.name, client.owner);
            await onboardingCardOperations.create(card);
          }
        }
        
        setShowRegistrationModal(false);
        
        toast({
          title: "Sucesso",
          description: "Cliente cadastrado com sucesso! Onboarding criado automaticamente.",
        });
        
        // Redirect to client onboarding
        window.location.href = `/cliente/${client.id}/onboarding`;
      }
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        title: "Erro",
        description: "Falha ao cadastrar cliente",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus clientes e acompanhe performance
          </p>
          <p className="text-sm text-muted-foreground mt-1">{kpiData.total} clientes</p>
        </div>
        <Button onClick={() => setShowRegistrationModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* KPIs - Enhanced with better styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Clientes Ativos
                </p>
                <p className="text-3xl font-bold text-success">
                  {kpiData.active}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-success/20">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Em Onboarding
                </p>
                <p className="text-3xl font-bold text-warning">
                  {kpiData.onboarding}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-warning/20">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Em Risco
                </p>
                <p className="text-3xl font-bold text-destructive">
                  {kpiData.atRisk}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-destructive/20">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Total de Clientes
                </p>
                <p className="text-3xl font-bold text-primary">
                  {kpiData.total}
                </p>
                <p className="text-xs text-muted-foreground">
                  R$ {totalInvestment.toLocaleString('pt-BR')} investimento
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/20">
                <Target className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativo</option>
            <option value="onboarding">Em Onboarding</option>
            <option value="at_risk">Em Risco</option>
            <option value="paused">Pausado</option>
          </select>
          
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todos os responsáveis</option>
            {uniqueOwners.map(owner => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todos os estágios</option>
            {uniqueStages.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>

          <select
            value={orderBy}
            onChange={(e) => setOrderBy(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="name_asc">A-Z</option>
            <option value="name_desc">Z-A</option>
            <option value="budget_desc">Maior orçamento</option>
            <option value="budget_asc">Menor orçamento</option>
            <option value="lastUpdate_desc">Mais recente</option>
            <option value="lastUpdate_asc">Mais antigo</option>
          </select>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-muted-foreground">
              {clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
            </div>
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        )}
      </div>

      {/* Registration Modal */}
      <ClientCreationWizard
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        onComplete={handleClientRegistered}
      />
    </div>
  );
};

export default ClientsPage;