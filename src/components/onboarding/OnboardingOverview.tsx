import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDataSource } from '@/hooks/useDataSource';
import { onboardingCardOperations } from '@/shared/db/onboardingStore';
import { Client } from '@/types';
import { Search, Filter, ExternalLink, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClientOnboardingStatus {
  client: Client;
  totalCards: number;
  completedCards: number;
  overdueCards: number;
  todayCards: number;
  currentStage: string;
  lastActivity: string;
  responsible: string;
}

export function OnboardingOverview() {
  const [clientsStatus, setClientsStatus] = useState<ClientOnboardingStatus[]>([]);
  const [filteredStatus, setFilteredStatus] = useState<ClientOnboardingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [responsibleFilter, setResponsibleFilter] = useState('all');
  
  const { dataSource } = useDataSource();
  const navigate = useNavigate();

  useEffect(() => {
    loadOnboardingOverview();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clientsStatus, searchQuery, stageFilter, responsibleFilter]);

  const loadOnboardingOverview = async () => {
    try {
      setLoading(true);
      const clients = await dataSource.getClients();
      const allCards = await onboardingCardOperations.getAll();
      
      const statusList: ClientOnboardingStatus[] = [];
      
      for (const client of clients) {
        const clientCards = allCards.filter(card => card.clientId === client.id);
        const completedCards = clientCards.filter(card => card.checklist.some(item => item.includes('✓')));
        const today = new Date().toISOString().split('T')[0];
        const overdueCards = clientCards.filter(card => 
          card.vencimento && card.vencimento < today && !completedCards.includes(card)
        );
        const todayCards = clientCards.filter(card => card.vencimento === today);
        
        // Determine current stage based on most recent card
        const latestCard = clientCards.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        const currentStage = latestCard?.stage || 'Não iniciado';
        const lastActivity = latestCard?.updated_at || latestCard?.created_at || client.lastUpdate;
        const responsible = latestCard?.responsavel || client.owner;
        
        statusList.push({
          client,
          totalCards: clientCards.length,
          completedCards: completedCards.length,
          overdueCards: overdueCards.length,
          todayCards: todayCards.length,
          currentStage,
          lastActivity,
          responsible
        });
      }
      
      setClientsStatus(statusList);
    } catch (error) {
      console.error('Error loading onboarding overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    let filtered = [...clientsStatus];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(status => 
        status.client.name.toLowerCase().includes(query) ||
        status.responsible.toLowerCase().includes(query) ||
        status.currentStage.toLowerCase().includes(query)
      );
    }
    
    // Stage filter
    if (stageFilter !== 'all') {
      filtered = filtered.filter(status => status.currentStage === stageFilter);
    }
    
    // Responsible filter
    if (responsibleFilter !== 'all') {
      filtered = filtered.filter(status => status.responsible === responsibleFilter);
    }
    
    setFilteredStatus(filtered);
  };

  const getStatusBadge = (status: ClientOnboardingStatus) => {
    if (status.overdueCards > 0) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Atrasado ({status.overdueCards})
      </Badge>;
    }
    
    if (status.todayCards > 0) {
      return <Badge variant="outline" className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Hoje ({status.todayCards})
      </Badge>;
    }
    
    if (status.totalCards === 0) {
      return <Badge variant="secondary">Não iniciado</Badge>;
    }
    
    if (status.completedCards === status.totalCards) {
      return <Badge variant="default" className="flex items-center gap-1 bg-green-500">
        <CheckCircle className="h-3 w-3" />
        Completo
      </Badge>;
    }
    
    return <Badge variant="outline">Em andamento</Badge>;
  };

  const getProgressPercent = (status: ClientOnboardingStatus) => {
    if (status.totalCards === 0) return 0;
    return Math.round((status.completedCards / status.totalCards) * 100);
  };

  const getAllStages = () => {
    const stages = new Set(clientsStatus.map(s => s.currentStage));
    return Array.from(stages).filter(stage => stage !== 'Não iniciado');
  };

  const getAllResponsibles = () => {
    const responsibles = new Set(clientsStatus.map(s => s.responsible));
    return Array.from(responsibles);
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/cliente/${clientId}/onboarding`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalClients = clientsStatus.length;
  const activeOnboarding = clientsStatus.filter(s => s.totalCards > 0 && s.completedCards < s.totalCards).length;
  const completedOnboarding = clientsStatus.filter(s => s.totalCards > 0 && s.completedCards === s.totalCards).length;
  const overdueCount = clientsStatus.reduce((sum, s) => sum + s.overdueCards, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-2xl font-bold">{totalClients}</div>
                <div className="text-sm text-muted-foreground">Total de Clientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-2xl font-bold text-blue-600">{activeOnboarding}</div>
                <div className="text-sm text-muted-foreground">Em Andamento</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-2xl font-bold text-green-600">{completedOnboarding}</div>
                <div className="text-sm text-muted-foreground">Concluídos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div>
                <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
                <div className="text-sm text-muted-foreground">Tarefas Atrasadas</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar clientes, responsáveis ou etapas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Etapa atual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as etapas</SelectItem>
                {getAllStages().map(stage => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {getAllResponsibles().map(responsible => (
                  <SelectItem key={responsible} value={responsible}>{responsible}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Status dos Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Etapa Atual</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStatus.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {clientsStatus.length === 0 ? 'Nenhum cliente encontrado' : 'Nenhum resultado para os filtros aplicados'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStatus.map((status) => (
                  <TableRow key={status.client.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {status.client.logoUrl && (
                          <img 
                            src={status.client.logoUrl} 
                            alt={status.client.name}
                            className="h-8 w-8 rounded-full"
                          />
                        )}
                        <span>{status.client.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${getProgressPercent(status)}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {getProgressPercent(status)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{status.currentStage}</Badge>
                    </TableCell>
                    <TableCell>{status.responsible}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(status.lastActivity).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClientClick(status.client.id)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}