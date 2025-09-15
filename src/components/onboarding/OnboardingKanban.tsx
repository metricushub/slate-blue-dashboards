import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Filter } from 'lucide-react';
import { OnboardingCard, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { OnboardingCardComponent } from './OnboardingCardComponent';
import { OnboardingCardModal } from './OnboardingCardModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnboardingKanbanProps {
  clientId?: string; // If provided, filter by client
}

const STAGES = [
  { id: 'dados-gerais', title: 'Dados gerais' },
  { id: 'financeiro', title: 'Financeiro', hasSubStage: true },
  { id: 'implementacao', title: 'Implementação Cliente' },
  { id: 'briefing', title: 'Briefing & 1º Contato/Reuniões' },
  { id: 'configuracao', title: 'Reunião de Configuração — Informações Necessárias' },
] as const;

const SUB_STAGES = {
  'financeiro': [
    { id: '2.1-cadastrar-financeiro', title: '2.1 Cadastrar no financeiro' }
  ]
} as const;

export function OnboardingKanban({ clientId }: OnboardingKanbanProps) {
  const [cards, setCards] = useState<OnboardingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<OnboardingCard | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<OnboardingCard | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    responsavel: '',
    cliente: '',
  });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadCards();
  }, [clientId]);

  const loadCards = async () => {
    try {
      const allCards = clientId 
        ? await onboardingCardOperations.getByClient(clientId)
        : await onboardingCardOperations.getAll();
      setCards(allCards);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar cards do onboarding.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const cardId = active.id as string;
    const overId = over.id as string;

    // Parse the drop target
    const [stage, subStage] = overId.split('.');
    
    try {
      await onboardingCardOperations.moveCard(
        cardId, 
        stage as OnboardingCard['stage'], 
        subStage as OnboardingCard['subStage']
      );
      
      // Update local state
      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { 
              ...card, 
              stage: stage as OnboardingCard['stage'], 
              subStage: stage === 'financeiro' ? subStage as OnboardingCard['subStage'] : undefined 
            }
          : card
      ));

      toast({
        title: "Sucesso",
        description: "Card movido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover card.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCard = async (cardData: Omit<OnboardingCard, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newCard = await onboardingCardOperations.create(cardData);
      setCards(prev => [newCard, ...prev]);
      setIsModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Card criado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar card.",
        variant: "destructive",
      });
    }
  };

  const handleEditCard = async (cardData: Partial<OnboardingCard>) => {
    if (!editingCard) return;
    
    try {
      await onboardingCardOperations.update(editingCard.id, cardData);
      setCards(prev => prev.map(card => 
        card.id === editingCard.id ? { ...card, ...cardData } : card
      ));
      setEditingCard(null);
      toast({
        title: "Sucesso",
        description: "Card atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar card.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      await onboardingCardOperations.delete(cardId);
      setCards(prev => prev.filter(card => card.id !== cardId));
      toast({
        title: "Sucesso",
        description: "Card excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir card.",
        variant: "destructive",
      });
    }
  };

  const getFilteredCards = () => {
    return cards.filter(card => {
      const searchMatch = !filters.search || 
        card.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        card.clientName?.toLowerCase().includes(filters.search.toLowerCase());
        
      const responsavelMatch = !filters.responsavel || card.responsavel === filters.responsavel;
      const clienteMatch = !filters.cliente || card.clientId === filters.cliente;
      
      return searchMatch && responsavelMatch && clienteMatch;
    });
  };

  const getCardsForStage = (stage: string, subStage?: string) => {
    const filteredCards = getFilteredCards();
    if (subStage) {
      return filteredCards.filter(card => card.stage === stage && card.subStage === subStage);
    }
    return filteredCards.filter(card => card.stage === stage && !card.subStage);
  };

  const getCardBadge = (card: OnboardingCard) => {
    if (!card.vencimento) return null;
    
    const dueDate = new Date(card.vencimento);
    if (isToday(dueDate)) {
      return <Badge variant="destructive" className="text-xs">Vence hoje</Badge>;
    }
    if (isPast(dueDate)) {
      return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    }
    return null;
  };

  const uniqueResponsaveis = [...new Set(cards.map(card => card.responsavel).filter(Boolean))];
  const uniqueClientes = [...new Set(cards.map(card => card.clientName).filter(Boolean))];

  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {clientId ? 'Onboarding do Cliente' : 'Onboarding'}
          </h1>
          <p className="text-muted-foreground">
            Gerencie o processo de onboarding dos clientes
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Card
        </Button>
      </div>

      {/* Filters */}
      {!clientId && (
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Buscar por título ou cliente..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-xs"
          />
          <Select value={filters.responsavel} onValueChange={(value) => setFilters(prev => ({ ...prev, responsavel: value === '__all__' ? '' : value }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os responsáveis</SelectItem>
              {uniqueResponsaveis.map(responsavel => (
                <SelectItem key={responsavel} value={responsavel}>{responsavel}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.cliente} onValueChange={(value) => setFilters(prev => ({ ...prev, cliente: value === '__all__' ? '' : value }))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos os clientes</SelectItem>
              {uniqueClientes.map(cliente => (
                <SelectItem key={cliente} value={cliente}>{cliente}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {STAGES.map((stage) => (
            <Card key={stage.id} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {stage.title}
                  <Badge variant="secondary" className="text-xs">
                    {getCardsForStage(stage.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Main stage cards */}
                <SortableContext
                  items={getCardsForStage(stage.id).map(card => card.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="min-h-24 space-y-2"
                    data-stage={stage.id}
                  >
                    {getCardsForStage(stage.id).map((card) => (
                      <OnboardingCardComponent
                        key={card.id}
                        card={card}
                        badge={getCardBadge(card)}
                        onEdit={(card) => setEditingCard(card)}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </div>
                </SortableContext>

                {/* Sub-stage swimlane */}
                {stage.id === 'financeiro' && SUB_STAGES[stage.id] && (
                  <div className="mt-4 border border-dashed border-border rounded-lg p-3">
                    {SUB_STAGES[stage.id].map((subStage) => (
                      <div key={subStage.id}>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center justify-between">
                          {subStage.title}
                          <Badge variant="outline" className="text-xs">
                            {getCardsForStage(stage.id, subStage.id).length}
                          </Badge>
                        </h4>
                        <SortableContext
                          items={getCardsForStage(stage.id, subStage.id).map(card => card.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div
                            className="min-h-16 space-y-2"
                            data-stage={`${stage.id}.${subStage.id}`}
                          >
                            {getCardsForStage(stage.id, subStage.id).map((card) => (
                              <OnboardingCardComponent
                                key={card.id}
                                card={card}
                                badge={getCardBadge(card)}
                                onEdit={(card) => setEditingCard(card)}
                                onDelete={handleDeleteCard}
                                isSubStage
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <OnboardingCardComponent
              card={activeCard}
              badge={getCardBadge(activeCard)}
              onEdit={() => {}}
              onDelete={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <OnboardingCardModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleCreateCard}
        clientId={clientId}
      />

      <OnboardingCardModal
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        onSave={handleEditCard}
        initialData={editingCard}
        clientId={clientId}
      />
    </div>
  );
}