import { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors 
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage, Client } from '@/types';
import { LeadsStore } from '@/shared/db/leadsStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Filter, Download, RotateCcw, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataSource } from '@/hooks/useDataSource';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadColumn } from '@/components/leads/LeadColumn';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import { LeadDrawer } from '@/components/leads/LeadDrawer';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { ClientPreCadastroModal } from '@/components/modals/ClientPreCadastroModal';
import { FormSendModal } from '@/components/modals/FormSendModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const LEAD_STAGES: LeadStage[] = ["Novo", "Qualificação", "Proposta", "Fechado"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showPreCadastroModal, setShowPreCadastroModal] = useState(false);
  const [showFormSendModal, setShowFormSendModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [clientForFormSend, setClientForFormSend] = useState<Client | null>(null);
  const [filters, setFilters] = useState({
    stages: [] as string[],
    owner: '',
    dateFrom: '',
    dateTo: ''
  });

  const { toast } = useToast();
  const { dataSource } = useDataSource();
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor));

  // Carregar leads ao montar
  useEffect(() => {
    loadLeads();
    loadSavedFilters();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const allLeads = await LeadsStore.getAllLeads();
      setLeads(allLeads);
    } catch (error) {
      console.error('Erro ao carregar leads:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilters = () => {
    try {
      const saved = localStorage.getItem('leads:ui:filters');
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        setFilters(parsedFilters);
        setSearchQuery(parsedFilters.searchQuery || '');
      }
    } catch (error) {
      console.warn('Erro ao carregar filtros salvos:', error);
    }
  };

  const saveFilters = (newFilters: typeof filters, query: string = searchQuery) => {
    localStorage.setItem('leads:ui:filters', JSON.stringify({ ...newFilters, searchQuery: query }));
  };

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Busca global
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(lead => 
        lead.name.toLowerCase().includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.toLowerCase().includes(query) ||
        lead.utm_source?.toLowerCase().includes(query) ||
        lead.utm_medium?.toLowerCase().includes(query) ||
        lead.utm_campaign?.toLowerCase().includes(query) ||
        lead.owner?.toLowerCase().includes(query)
      );
    }

    // Filtros
    if (filters.stages.length > 0) {
      result = result.filter(lead => filters.stages.includes(lead.stage));
    }

    if (filters.owner.trim()) {
      result = result.filter(lead => lead.owner === filters.owner);
    }

    if (filters.dateFrom) {
      result = result.filter(lead => lead.created_at >= filters.dateFrom);
    }

    if (filters.dateTo) {
      result = result.filter(lead => lead.created_at <= filters.dateTo);
    }

    return result;
  }, [leads, searchQuery, filters]);

  // Agrupar por stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<LeadStage, Lead[]> = {
      "Novo": [],
      "Qualificação": [],
      "Proposta": [],
      "Fechado": []
    };

    filteredLeads.forEach(lead => {
      if (grouped[lead.stage]) {
        grouped[lead.stage].push(lead);
      }
    });

    return grouped;
  }, [filteredLeads]);

  // Estatísticas
  const stats = useMemo(() => {
    const result = {
      total: filteredLeads.length,
      totalValue: 0,
      byStage: {} as Record<LeadStage, { count: number; value: number }>
    };

    LEAD_STAGES.forEach(stage => {
      const stageLeads = leadsByStage[stage];
      const value = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      result.byStage[stage] = { count: stageLeads.length, value };
      result.totalValue += value;
    });

    return result;
  }, [leadsByStage, filteredLeads]);

  // Drag and Drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStage = over.id as LeadStage;

    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === newStage) return;

    // Se moveu para "Fechado", abrir modal de pré-cadastro
    if (newStage === 'Fechado' && lead.stage !== 'Fechado') {
      setLeadToConvert(lead);
      setShowPreCadastroModal(true);
      return; // Não atualizar o stage ainda
    }

    try {
      await LeadsStore.updateLead(leadId, { stage: newStage });
      
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, stage: newStage, updated_at: new Date().toISOString() } : l
      ));

      toast({
        title: "Lead movido",
        description: `Lead movido para ${newStage}`,
      });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível mover o lead.",
        variant: "destructive"
      });
    }
  };

  // Ações
  const handleCreateLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newLead = await LeadsStore.createLead(leadData);
      setLeads(prev => [newLead, ...prev]);
      setShowNewLeadModal(false);
      
      toast({
        title: "Lead criado",
        description: "Novo lead adicionado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao criar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o lead.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateLead = async (id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>) => {
    try {
      const updatedLead = await LeadsStore.updateLead(id, updates);
      if (updatedLead) {
        setLeads(prev => prev.map(l => l.id === id ? updatedLead : l));
        
        toast({
          title: "Lead atualizado",
          description: "Alterações salvas com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o lead.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await LeadsStore.deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      setShowDrawer(false);
      
      toast({
        title: "Lead excluído",
        description: "Lead removido com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao excluir lead:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lead.",
        variant: "destructive"
      });
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await LeadsStore.exportToCSV(filteredLeads);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const fileName = `leads_export_${format(new Date(), 'yyyyMMdd')}.csv`;
      
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      
      toast({
        title: "Exportação concluída",
        description: `Arquivo ${fileName} baixado com ${filteredLeads.length} leads.`,
      });
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  const handleClientCreated = async (client: Client) => {
    if (!leadToConvert) return;

    try {
      // Add client to data source
      if (dataSource && dataSource.addClient) {
        await dataSource.addClient(client);
      }

      // Atualizar lead para marcar como fechado e vincular cliente
      await LeadsStore.updateLead(leadToConvert.id, { 
        stage: 'Fechado',
        client_id: client.id 
      });

      setLeads(prev => prev.map(l => 
        l.id === leadToConvert.id 
          ? { ...l, stage: 'Fechado' as LeadStage, client_id: client.id, updated_at: new Date().toISOString() } 
          : l
      ));

      setShowPreCadastroModal(false);
      
      // Prepare FormSendModal
      setClientForFormSend(client);
      setTimeout(() => {
        setShowFormSendModal(true);
      }, 300);

      toast({
        title: "Pré-cadastro salvo",
        description: "Agora envie o formulário pelo WhatsApp/E-mail.",
      });
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Erro",
        description: "Falha ao criar cliente",
        variant: "destructive",
      });
    }
  };

  const handleLeadConverted = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowPreCadastroModal(true);
  };

  const handleFormSent = (client: Client) => {
    // Navigate to onboarding page for the client
    navigate(`/onboarding/${client.id}`);
  };

  const handleResetFilters = () => {
    setFilters({ stages: [], owner: '', dateFrom: '', dateTo: '' });
    setSearchQuery('');
    localStorage.removeItem('leads:ui:filters');
    
    toast({
      title: "Filtros limpos",
      description: "Todos os filtros foram removidos.",
    });
  };

  const openLeadDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDrawer(true);
  };

  const activeItem = activeId ? leads.find(l => l.id === activeId) : null;

  if (loading) {
    return (
      <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-3">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Leads (Kanban)</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {LEAD_STAGES.map(stage => (
            <Card key={stage} className="h-[600px]">
              <CardHeader className="pb-4">
                <div className="animate-pulse bg-muted h-4 w-24 rounded"></div>
              </CardHeader>
              <CardContent>
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse bg-muted h-20 w-full rounded mb-2"></div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] mx-auto px-6 lg:px-8 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Leads (Kanban)</h1>
          <Badge variant="outline" className="ml-2">
            {stats.total} leads
          </Badge>
          <Badge variant="outline">
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL' 
            }).format(stats.totalValue)}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpar
          </Button>
          <Button onClick={() => setShowNewLeadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar leads (nome, email, telefone, UTM, proprietário...)"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            saveFilters(filters, e.target.value);
          }}
          className="pl-10"
        />
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <LeadFilters
          filters={filters}
          onFiltersChange={(newFilters) => {
            setFilters(newFilters);
            saveFilters(newFilters);
          }}
          leads={leads}
        />
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LEAD_STAGES.map(stage => (
            <LeadColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage]}
              stats={stats.byStage[stage]}
              onLeadClick={openLeadDrawer}
              onNewLead={() => setShowNewLeadModal(true)}
              onLeadConverted={handleLeadConverted}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <LeadCard
              lead={activeItem}
              onClick={() => {}}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Modais */}
      <NewLeadModal
        open={showNewLeadModal}
        onOpenChange={setShowNewLeadModal}
        onSave={handleCreateLead}
      />

      <LeadDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        lead={selectedLead}
        onSave={handleUpdateLead}
        onDelete={handleDeleteLead}
      />

      {/* Modal de Pré-cadastro */}
      {leadToConvert && (
        <ClientPreCadastroModal
          open={showPreCadastroModal}
          onOpenChange={setShowPreCadastroModal}
          onSave={handleClientCreated}
          leadData={leadToConvert}
        />
      )}

      {/* Modal de Envio do Formulário */}
      {clientForFormSend && (
        <FormSendModal
          open={showFormSendModal}
          onOpenChange={setShowFormSendModal}
          client={clientForFormSend}
          formLink=""
          onFormSent={handleFormSent}
        />
      )}
    </div>
  );
}