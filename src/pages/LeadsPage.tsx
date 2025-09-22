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
import { Lead, Client } from '@/types';
import { useLeads } from '@/hooks/useLeads';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Filter, Download, RotateCcw, Users, BarChart3, List, Grid3X3, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDataSource } from '@/hooks/useDataSource';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadColumn } from '@/components/leads/LeadColumn';
import { LeadDrawer } from '@/components/leads/LeadDrawer';
import { NewLeadModal } from '@/components/leads/NewLeadModal';
import { LeadFilters } from '@/components/leads/LeadFilters';
import { ClientPreCadastroModal } from '@/components/modals/ClientPreCadastroModal';
import { FormSendModal } from '@/components/modals/FormSendModal';
import { LossReasonModal } from '@/components/leads/LossReasonModal';
import { LeadAnalytics } from '@/components/leads/LeadAnalytics';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { FunnelConfigModal } from '@/components/leads/FunnelConfigModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

const DEFAULT_STAGES: FunnelStage[] = [
  { id: 'novo', name: 'Novo', color: '#3b82f6', order_index: 0 },
  { id: 'qualificacao', name: 'Qualificação', color: '#8b5cf6', order_index: 1 },
  { id: 'proposta', name: 'Proposta', color: '#f59e0b', order_index: 2 },
  { id: 'negociacao', name: 'Negociação', color: '#f97316', order_index: 3 },
  { id: 'fechado', name: 'Fechado', color: '#10b981', order_index: 4 },
  { id: 'perdido', name: 'Perdido', color: '#ef4444', order_index: 5 }
];

export default function LeadsPage() {
  const { 
    leads, 
    loading, 
    error, 
    createLead, 
    updateLead, 
    deleteLead 
  } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [selectedLeadForLoss, setSelectedLeadForLoss] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showFunnelConfig, setShowFunnelConfig] = useState(false);
  const [funnelStages, setFunnelStages] = useState<FunnelStage[]>(DEFAULT_STAGES);
  const [filters, setFilters] = useState({
    stages: [] as string[],
    owner: '',
    dateFrom: '',
    dateTo: ''
  });

  const { dataSource } = useDataSource();
  const { toast } = useToast();
  const navigate = useNavigate();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Carregar clientes
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await dataSource.getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
      }
    };
    
    loadClients();
  }, [dataSource]);

  // Handlers
  const handleSaveLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    await createLead(leadData);
    setShowNewLeadModal(false);
  };

  const handleUpdateLead = async (id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>) => {
    await updateLead(id, updates);
  };

  const handleDeleteLead = async (id: string) => {
    await deleteLead(id);
  };

  // Filtrar leads
  const filteredLeads = useMemo(() => {
    let result = leads;

    // Filtro de busca
    if (searchQuery) {
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

    // Filtros avançados
    if (filters.stages.length > 0) {
      result = result.filter(lead => filters.stages.includes(lead.stage));
    }

    if (filters.owner) {
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
    const grouped: Record<string, Lead[]> = {};
    
    // Inicializar com todas as etapas do funil
    funnelStages.forEach(stage => {
      grouped[stage.id] = [];
    });

    filteredLeads.forEach(lead => {
      if (grouped[lead.stage]) {
        grouped[lead.stage].push(lead);
      }
    });

    return grouped;
  }, [filteredLeads, funnelStages]);

  // Estatísticas
  const stats = useMemo(() => {
    const result = {
      total: filteredLeads.length,
      totalValue: 0,
      byStage: {} as Record<string, { count: number; value: number }>
    };

    funnelStages.forEach(stage => {
      const stageLeads = leadsByStage[stage.id] || [];
      const value = stageLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
      result.byStage[stage.id] = { count: stageLeads.length, value };
      result.totalValue += value;
    });

    return result;
  }, [leadsByStage, filteredLeads]);

  // Drag and Drop
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveLead(leads.find(lead => lead.id === active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !active.id) {
      setActiveLead(null);
      return;
    }

    const leadId = active.id as string;
    const newStage = over.id as string;

    // Encontrar o lead sendo movido
    const draggedLead = leads.find(lead => lead.id === leadId);
    if (!draggedLead || draggedLead.stage === newStage) {
      setActiveLead(null);
      return;
    }

    try {
      await handleUpdateLead(leadId, { stage: newStage });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }

    setActiveLead(null);
  };

  // Funções auxiliares
  const openLeadDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDrawer(true);
  };

  const handleExportCSV = async () => {
    try {
      // Export functionality would go here
      toast({
        title: 'Exportação',
        description: 'Funcionalidade em desenvolvimento'
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao exportar dados',
        variant: 'destructive'
      });
    }
  };

  const handleLeadConverted = async (lead: Lead) => {
    try {
      const clientData = {
        id: crypto.randomUUID(),
        name: lead.name,
        status: 'active' as const,
        stage: 'Setup inicial' as const,
        owner: lead.owner || '',
        lastUpdate: format(new Date(), 'yyyy-MM-dd'),
        budgetMonth: lead.value || 0,
      };

      await dataSource.addClient?.(clientData);
      await handleUpdateLead(lead.id, { 
        stage: 'fechado',
        client_id: clientData.id,
        converted_at: new Date().toISOString()
      });

      toast({
        title: 'Sucesso',
        description: 'Lead convertido em cliente!'
      });

      navigate(`/cliente/${clientData.id}/cadastro`);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao converter lead',
        variant: 'destructive'
      });
    }
  };

  const handleMarkAsLost = (lead: Lead) => {
    setSelectedLeadForLoss(lead);
    setShowLossModal(true);
  };

  const handleLossReasonSubmit = async (reason: string) => {
    if (!selectedLeadForLoss) return;

    try {
      await handleUpdateLead(selectedLeadForLoss.id, {
        stage: 'perdido',
        lost_reason: reason,
        lost_at: new Date().toISOString()
      });

      setShowLossModal(false);
      setSelectedLeadForLoss(null);
      
      toast({
        title: 'Lead marcado como perdido',
        description: `Motivo: ${reason}`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao marcar lead como perdido',
        variant: 'destructive'
      });
    }
  };

  const handleClientCreated = async (clientData: any) => {
    setClients(prev => [...prev, clientData]);
    setShowClientModal(false);
    
    toast({
      title: 'Cliente criado',
      description: 'Cliente adicionado com sucesso!'
    });
  };

  const handleSaveFunnelConfig = (stages: FunnelStage[]) => {
    setFunnelStages(stages);
    localStorage.setItem('leadFunnelStages', JSON.stringify(stages));
  };

  // Carregar configuração do funil do localStorage
  useEffect(() => {
    const savedStages = localStorage.getItem('leadFunnelStages');
    if (savedStages) {
      try {
        const parsed = JSON.parse(savedStages);
        setFunnelStages(parsed);
      } catch (error) {
        console.error('Erro ao carregar configuração do funil:', error);
      }
    }
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Leads (Kanban)</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {funnelStages.map(stage => (
            <Card key={stage.id} className="h-[600px]">
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold mb-2">Erro ao carregar leads</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Leads</h1>
          <Badge variant="secondary">{stats.total}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-1" />
              Lista
            </Button>
          </div>
          
          <Button variant="outline" onClick={() => setShowFunnelConfig(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Funil
          </Button>
          <Button variant="outline" onClick={() => setShowAnalytics(true)}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={() => setShowNewLeadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-muted-foreground">Total de Leads</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              R$ {stats.totalValue.toLocaleString('pt-BR')}
            </div>
            <div className="text-muted-foreground">Valor Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.byStage['fechado']?.count || 0}
            </div>
            <div className="text-muted-foreground">Fechados</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {stats.total > 0 ? ((stats.byStage['fechado']?.count || 0) / stats.total * 100).toFixed(1) : 0}%
            </div>
            <div className="text-muted-foreground">Taxa de Conversão</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {showFilters && (
        <LeadFilters
          filters={filters}
          onFiltersChange={setFilters}
          leads={leads}
        />
      )}

      {/* Content - Kanban or List View */}
      {viewMode === 'kanban' ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {funnelStages.map(stage => (
              <LeadColumn
                key={stage.id}
                stage={stage.id}
                leads={leadsByStage[stage.id] || []}
                stats={stats.byStage[stage.id] || { count: 0, value: 0 }}
                onLeadClick={openLeadDrawer}
                onNewLead={() => setShowNewLeadModal(true)}
                onLeadConverted={handleLeadConverted}
                onMarkAsLost={handleMarkAsLost}
              />
            ))}
          </div>

          <DragOverlay>
            {activeLead ? (
              <LeadCard 
                lead={activeLead} 
                onClick={() => {}}
                isDragging 
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <LeadsTable
          leads={filteredLeads}
          onEditLead={openLeadDrawer}
          onDeleteLead={handleDeleteLead}
          onViewLead={openLeadDrawer}
        />
      )}

      {/* Modals */}
      <NewLeadModal
        open={showNewLeadModal}
        onOpenChange={setShowNewLeadModal}
        onSave={handleSaveLead}
      />

      <LeadDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        lead={selectedLead}
        onSave={handleUpdateLead}
        onDelete={handleDeleteLead}
      />

      <ClientPreCadastroModal
        open={showClientModal}
        onOpenChange={setShowClientModal}
        onSave={handleClientCreated}
      />

      {selectedLead && (
        <FormSendModal
          open={showFormModal}
          onOpenChange={setShowFormModal}
          client={{
            id: selectedLead.id,
            name: selectedLead.name,
            status: 'active' as const,
            stage: 'Setup inicial' as const,
            owner: selectedLead.owner || '',
            lastUpdate: format(new Date(), 'yyyy-MM-dd'),
            budgetMonth: selectedLead.value || 0,
          }}
          formLink=""
        />
      )}

      {selectedLeadForLoss && (
        <LossReasonModal
          open={showLossModal}
          onClose={() => setShowLossModal(false)}
          lead={selectedLeadForLoss}
          onSave={(leadId: string, lossReason: string) => {
            handleLossReasonSubmit(lossReason);
          }}
        />
      )}

      <FunnelConfigModal
        open={showFunnelConfig}
        onClose={() => setShowFunnelConfig(false)}
        onSave={handleSaveFunnelConfig}
        currentStages={funnelStages}
      />

      {showAnalytics && (
        <LeadAnalytics
          leads={leads}
        />
      )}
    </div>
  );
}