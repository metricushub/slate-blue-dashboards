import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, TrendingUp, Users, Clock, Target } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { Client } from "@/types";
import { ClientCard } from "@/components/home/ClientCard";
import { KPICard } from "@/components/home/KPICard";
import { EnhancedClientRegistrationModal } from "@/components/modals/EnhancedClientRegistrationModal";
import { toast } from "@/hooks/use-toast";

const HomePage = () => {
  const { dataSource } = useDataSource();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
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
        client.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    if (ownerFilter !== "all") {
      filtered = filtered.filter(client => client.owner === ownerFilter);
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, statusFilter, ownerFilter]);

  const kpiData = {
    active: clients.filter(c => c.status === 'active').length,
    onboarding: clients.filter(c => c.status === 'onboarding').length,
    atRisk: clients.filter(c => c.status === 'at_risk').length,
    total: clients.length,
  };

  const totalInvestment = clients
    .filter(c => c.status === 'active')
    .reduce((sum, client) => sum + client.monthlyBudget, 0);

  const uniqueOwners = [...new Set(clients.map(c => c.owner))];

  const handleClientRegistered = async (client: Client) => {
    try {
      if (dataSource.addClient) {
        await dataSource.addClient(client);
        await loadClients(); // Refresh the list
        toast({
          title: "Sucesso",
          description: "Cliente cadastrado com sucesso",
        });
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
    <div className="p-6 space-y-6">
      {/* Header with Logo, Title and Actions */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/46d9fe31-9358-4b32-bee9-f114801074c0.png" 
            alt="Metricus Hub Logo" 
            className="h-16 w-16"
          />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Metricus Hub</h1>
            <p className="text-muted-foreground">
              Dashboard de Marketing Digital
            </p>
          </div>
        </div>
        <Button onClick={() => setShowRegistrationModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Clientes Ativos"
          value={kpiData.active}
          icon={<Users className="h-5 w-5" />}
          color="success"
        />
        <KPICard
          title="Em Onboarding"
          value={kpiData.onboarding}
          icon={<Clock className="h-5 w-5" />}
          color="warning"
        />
        <KPICard
          title="Em Risco"
          value={kpiData.atRisk}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="destructive"
        />
        <KPICard
          title="Total"
          value={kpiData.total}
          icon={<Target className="h-5 w-5" />}
          color="primary"
        />
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
        
        <div className="flex gap-2">
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
      <EnhancedClientRegistrationModal
        open={showRegistrationModal}
        onOpenChange={setShowRegistrationModal}
        onClientRegistered={handleClientRegistered}
      />
    </div>
  );
};

export default HomePage;