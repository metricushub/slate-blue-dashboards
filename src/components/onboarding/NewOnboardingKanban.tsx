import React, { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingCard } from '@/shared/db/onboardingStore';
import { BulkAddOnboardingCardsModal } from '@/components/modals/BulkAddOnboardingCardsModal';
import { OnboardingCardEditDrawer } from '@/components/modals/OnboardingCardEditDrawer';
import { Plus, Calendar, User, Clock, PackagePlus, FileText, CreditCard, Settings, MessageSquare, Rocket, Edit } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NewOnboardingKanbanProps {
  clientId?: string;
  cards: OnboardingCard[];
  onCardMove: (cardId: string, newStage: string, newSubStage?: string) => void;
  onCardClick?: (card: OnboardingCard) => void;
  onCreateCard?: () => void;
  onCardsReload?: () => void;
}

interface DroppableColumnProps {
  column: typeof ONBOARDING_COLUMNS[number];
  children: React.ReactNode;
}

function DroppableColumn({ column, children }: DroppableColumnProps) {
  return (
    <Card className={`${column.color} flex flex-col h-fit`}>
      {children}
    </Card>
  );
}

const ONBOARDING_COLUMNS = [
  { id: 'dados-gerais', title: 'Pré-cadastro', icon: FileText, color: 'bg-blue-50 border-blue-200' },
  { id: 'implementacao', title: 'Formulário & Docs', icon: FileText, color: 'bg-yellow-50 border-yellow-200' },
  { id: 'financeiro', title: 'Financeiro', icon: CreditCard, color: 'bg-orange-50 border-orange-200' },
  { id: 'configuracao', title: 'Acessos & Setup', icon: Settings, color: 'bg-purple-50 border-purple-200' },
  { id: 'briefing', title: 'Briefing & Estratégia', icon: MessageSquare, color: 'bg-indigo-50 border-indigo-200' },
  { id: 'go-live', title: 'Go-Live', icon: Rocket, color: 'bg-green-50 border-green-200' }
] as const;

interface SortableOnboardingCardProps {
  card: OnboardingCard;
  onClick: (card: OnboardingCard) => void;
}

function SortableOnboardingCard({ card, onClick }: SortableOnboardingCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = card.vencimento && card.vencimento < today;
  const isDueToday = card.vencimento === today;

  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(card);
  };

  const getStatusBadge = () => {
    if (isOverdue) return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    if (isDueToday) return <Badge variant="default" className="text-xs">Hoje</Badge>;
    return null;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab active:cursor-grabbing"
    >
      <Card className={`${isOverdue ? 'border-red-300 bg-red-50/50' : ''} group hover:shadow-md transition-shadow`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <h4 
              className="font-medium text-sm leading-tight cursor-pointer hover:text-primary hover:underline transition-all flex-1 group-hover:text-primary"
              onClick={handleCardClick}
              onPointerDown={(e) => e.stopPropagation()}
              title="Clique para editar"
            >
              {card.title}
            </h4>
            <div 
              className="flex-shrink-0 mt-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleCardClick}
              onPointerDown={(e) => e.stopPropagation()}
              title="Editar card"
            >
              <Edit className="h-3 w-3 text-muted-foreground/50 hover:text-primary" />
            </div>
          </div>
          
          {card.notas && (
            <p className="text-xs text-muted-foreground line-clamp-2">{card.notas}</p>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {getStatusBadge()}
            </div>
            
            {card.vencimento && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(card.vencimento).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          
          {card.responsavel && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate">{card.responsavel}</span>
            </div>
          )}

          {card.checklist && card.checklist.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              {card.checklist.filter(item => item.includes('✓')).length}/{card.checklist.length} itens
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingCardComponent({ card, isDragging }: { card: OnboardingCard; isDragging?: boolean }) {
  return (
    <Card className={`${isDragging ? 'opacity-75 rotate-2' : ''} shadow-lg`}>
      <CardContent className="p-3">
        <h4 className="font-medium text-sm">{card.title}</h4>
        {card.notas && <p className="text-xs text-muted-foreground mt-1">{card.notas}</p>}
      </CardContent>
    </Card>
  );
}

export function NewOnboardingKanban({ 
  clientId, 
  cards, 
  onCardMove, 
  onCardClick, 
  onCreateCard,
  onCardsReload
}: NewOnboardingKanbanProps) {
  const [activeCard, setActiveCard] = useState<OnboardingCard | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [editingCard, setEditingCard] = useState<OnboardingCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  // Organize cards by columns
  const getCardsForColumn = (columnId: string) => {
    return cards.filter(card => card.stage === columnId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const stageId = over.id as string;
      onCardMove(active.id as string, stageId);
    }
    
    setActiveCard(null);
  };

  const handleCardClick = (card: OnboardingCard) => {
    setEditingCard(card);
    setShowEditDrawer(true);
  };

  const handleSaveCard = async (cardId: string, updates: Partial<OnboardingCard>) => {
    // This will be handled by the parent component
    if (onCardClick) {
      await onCardClick({ ...updates, id: cardId } as OnboardingCard);
    }
    if (onCardsReload) {
      onCardsReload();
    }
    setShowEditDrawer(false);
  };

  const handleDeleteCard = async (cardId: string) => {
    // This will be handled by the parent component - we'll need to add a delete handler
    console.log('Delete card:', cardId);
    if (onCardsReload) {
      onCardsReload();
    }
    setShowEditDrawer(false);
  };

  const handleDuplicateCard = async (card: OnboardingCard) => {
    // This will be handled by the parent component - we'll need to add a duplicate handler
    console.log('Duplicate card:', card);
    if (onCardsReload) {
      onCardsReload();
    }
    setShowEditDrawer(false);
  };

  const handleBulkCardsCreated = (newCards: OnboardingCard[]) => {
    if (onCardsReload) {
      onCardsReload();
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Onboarding do Cliente</h1>
              <p className="text-muted-foreground">
                Acompanhe o progresso do onboarding através das etapas
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onCreateCard && (
                <Button onClick={onCreateCard} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Novo
                </Button>
              )}
              <Button 
                onClick={() => setShowBulkModal(true)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Adicionar em Lote
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 flex-1">
            {ONBOARDING_COLUMNS.map(column => {
              const columnCards = getCardsForColumn(column.id);
              const Icon = column.icon;
              
              return (
                <DroppableColumn key={column.id} column={column}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{column.title}</span>
                      </div>
                      <Badge variant="secondary">{columnCards.length}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <SortableContext
                      items={columnCards.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 min-h-20">
                        {columnCards.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Nenhum card</p>
                          </div>
                        ) : (
                          columnCards.map(card => (
                            <SortableOnboardingCard
                              key={card.id}
                              card={card}
                              onClick={handleCardClick}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                  </CardContent>
                </DroppableColumn>
              );
            })}
          </div>
        </div>

        {activeCard && (
          <DragOverlay>
            <OnboardingCardComponent card={activeCard} isDragging />
          </DragOverlay>
        )}
      </DndContext>

      <BulkAddOnboardingCardsModal
        open={showBulkModal}
        onOpenChange={setShowBulkModal}
        onCardsCreated={handleBulkCardsCreated}
        clientId={clientId}
      />

      <OnboardingCardEditDrawer
        open={showEditDrawer}
        onOpenChange={setShowEditDrawer}
        card={editingCard}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
        onDuplicate={handleDuplicateCard}
      />
    </>
  );
}