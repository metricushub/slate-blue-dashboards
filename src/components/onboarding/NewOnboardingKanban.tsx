import React, { useState, useEffect } from 'react';
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
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { OnboardingCard, onboardingStageOperations, OnboardingStage, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { BulkAddOnboardingCardsModal } from '@/components/modals/BulkAddOnboardingCardsModal';
import { OnboardingCardEditDrawer } from '@/components/modals/OnboardingCardEditDrawer';
import { TemplateApplicator } from './TemplateApplicator';
import { SaveTemplateModal } from './SaveTemplateModal';
import { 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  PackagePlus, 
  FileText, 
  CreditCard, 
  Settings, 
  MessageSquare, 
  Rocket, 
  Edit,
  ChevronDown,
  CheckSquare,
  Trash2,
  Check
} from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface NewOnboardingKanbanProps {
  clientId?: string;
  cards: OnboardingCard[];
  onCardMove: (cardId: string, newStage: string, newSubStage?: string) => void;
  onCardClick?: (card: OnboardingCard) => void;
  onCreateCard?: () => void;
  onCardsReload?: () => void;
  draggable?: boolean;
}

interface DroppableColumnProps {
  column: OnboardingStage;
  children: React.ReactNode;
}

function DroppableColumn({ column, children }: DroppableColumnProps) {
  return (
    <Card className={`${column.color || 'bg-gray-50 border-gray-200'} flex flex-col h-fit`}>
      {children}
    </Card>
  );
}

// Icon mapping function
const getIconComponent = (iconName?: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    FileText,
    CreditCard,
    Settings,
    MessageSquare,
    Rocket,
    CheckSquare,
    User,
    Calendar,
    Clock
  };
  
  return iconMap[iconName || 'CheckSquare'] || CheckSquare;
};

interface SortableOnboardingCardProps {
  card: OnboardingCard;
  onClick: (card: OnboardingCard) => void;
  onComplete: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  draggable?: boolean;
}

function SortableOnboardingCard({ card, onClick, onComplete, onDelete, draggable = false }: SortableOnboardingCardProps) {
  if (!draggable) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = card.vencimento && card.vencimento < today;
    const isDueToday = card.vencimento === today;

    const handleCardClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onClick(card);
    };

    const handleComplete = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onComplete(card.id);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDelete(card.id);
    };

    const getStatusBadge = () => {
      if (isOverdue) return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
      if (isDueToday) return <Badge variant="default" className="text-xs">Hoje</Badge>;
      return null;
    };

    const isCompleted = card.completed;

    return (
      <div className="mb-3">
        <Card className={`${isOverdue ? 'border-red-300 bg-red-50/50' : ''} ${isCompleted ? 'bg-green-50/50 border-green-200' : ''} group hover:shadow-md transition-shadow`}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start gap-2">
              <button
                onClick={handleComplete}
                className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : 'border-gray-300 hover:border-green-400'
                }`}
                title="Marcar como concluído"
              >
                {isCompleted && <Check className="h-2.5 w-2.5" />}
              </button>
              
              <h4 
                className={`font-medium text-sm leading-tight cursor-pointer hover:text-primary hover:underline transition-all flex-1 group-hover:text-primary ${
                  isCompleted ? 'opacity-60 line-through' : ''
                }`}
                onClick={handleCardClick}
                title="Clique para editar"
              >
                {card.title}
              </h4>
              
              <div className="flex-shrink-0 mt-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCardClick}
                  className="cursor-pointer"
                  title="Editar card"
                >
                  <Edit className="h-3 w-3 text-muted-foreground/50 hover:text-primary" />
                </button>
                <button 
                  onClick={handleDelete}
                  className="cursor-pointer"
                  title="Excluir card"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground/50 hover:text-red-500" />
                </button>
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
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onComplete(card.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(card.id);
  };

  const getStatusBadge = () => {
    if (isOverdue) return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    if (isDueToday) return <Badge variant="default" className="text-xs">Hoje</Badge>;
    return null;
  };

  const isCompleted = card.completed;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-3 cursor-grab active:cursor-grabbing"
    >
      <Card className={`${isOverdue ? 'border-red-300 bg-red-50/50' : ''} ${isCompleted ? 'bg-green-50/50 border-green-200' : ''} group hover:shadow-md transition-shadow`}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <button
              onClick={handleComplete}
              onPointerDown={(e) => e.stopPropagation()}
              className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : 'border-gray-300 hover:border-green-400'
              }`}
              title="Marcar como concluído"
            >
              {isCompleted && <Check className="h-2.5 w-2.5" />}
            </button>
            
            <h4 
              className={`font-medium text-sm leading-tight cursor-pointer hover:text-primary hover:underline transition-all flex-1 group-hover:text-primary ${
                isCompleted ? 'opacity-60 line-through' : ''
              }`}
              onClick={handleCardClick}
              onPointerDown={(e) => e.stopPropagation()}
              title="Clique para editar"
            >
              {card.title}
            </h4>
            
            <div className="flex-shrink-0 mt-0.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={handleCardClick}
                onPointerDown={(e) => e.stopPropagation()}
                className="cursor-pointer"
                title="Editar card"
              >
                <Edit className="h-3 w-3 text-muted-foreground/50 hover:text-primary" />
              </button>
              <button 
                onClick={handleDelete}
                onPointerDown={(e) => e.stopPropagation()}
                className="cursor-pointer"
                title="Excluir card"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground/50 hover:text-red-500" />
              </button>
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
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showApplyTemplate, setShowApplyTemplate] = useState(false);
  const [stages, setStages] = useState<OnboardingStage[]>([]);
  const [isLoadingStages, setIsLoadingStages] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState<{ [stageId: string]: string }>({});
  const [showingInputForStage, setShowingInputForStage] = useState<string | null>(null);

  // Load stages from database
  useEffect(() => {
    const loadStages = async () => {
      try {
        const allStages = await onboardingStageOperations.getAllStages();
        setStages(allStages.filter(s => cards.some(c => c.stage === s.id)));
      } catch (error) {
        console.error('Error loading stages:', error);
      } finally {
        setIsLoadingStages(false);
      }
    };

    loadStages();
  }, []);

  // Reload stages when cards are reloaded (in case new stages were created)
  const handleCardsReload = () => {
    const reloadStages = async () => {
      const allStages = await onboardingStageOperations.getAllStages();
      setStages(allStages.filter(s => cards.some(c => c.stage === s.id)));
    };
    
    reloadStages();
    onCardsReload?.();
  };

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

  // Local ordering per column (only reorder within same column)
  const [columnOrder, setColumnOrder] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const next: Record<string, string[]> = {};
    stages.forEach((stage) => {
      const ids = getCardsForColumn(stage.id).map((c) => c.id);
      const prev = columnOrder[stage.id] || [];
      // Preserve existing order, append any new ids
      const merged = [
        ...prev.filter((id) => ids.includes(id)),
        ...ids.filter((id) => !prev.includes(id)),
      ];
      next[stage.id] = merged;
    });
    setColumnOrder(next);
  }, [cards, stages]);
  if (isLoadingStages) {
    return <div className="flex items-center justify-center p-8">Carregando...</div>;
  }

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveCard(null);
    if (!over) return;

    const activeContainerId = (active.data?.current as any)?.sortable?.containerId as string | undefined;
    const overContainerId = (over.data?.current as any)?.sortable?.containerId as string | undefined;

    if (!activeContainerId) return;

    // Bloquear mover entre colunas
    if (overContainerId && overContainerId !== activeContainerId) {
      return;
    }

    // Reordenar apenas dentro da mesma coluna
    const stageId = activeContainerId;
    const items = columnOrder[stageId] || getCardsForColumn(stageId).map((c) => c.id);

    const activeIndex = items.indexOf(active.id as string);
    let overIndex = items.indexOf(over.id as string);

    if (overIndex === -1) {
      // Solto no container (não em um item) -> coloca no final
      overIndex = items.length - 1;
    }

    if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
      setColumnOrder((prev) => ({
        ...prev,
        [stageId]: arrayMove(items, activeIndex, overIndex),
      }));
    }
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

  const handleCompleteCard = async (cardId: string) => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      // Toggle completed status without moving stages
      await onboardingCardOperations.update(cardId, {
        completed: !card.completed
      });
      
      if (onCardsReload) {
        onCardsReload();
      }
    } catch (error) {
      console.error('Error completing card:', error);
    }
  };

  const handleDeleteCardConfirm = (cardId: string) => {
    setCardToDelete(cardId);
    setShowDeleteDialog(true);
  };

  const handleDeleteCardExecute = async () => {
    if (!cardToDelete) return;
    
    try {
      await onboardingCardOperations.delete(cardToDelete);
      if (onCardsReload) {
        onCardsReload();
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    } finally {
      setShowDeleteDialog(false);
      setCardToDelete(null);
    }
  };

  const handleAddCard = (stageId: string) => {
    setShowingInputForStage(stageId);
    setNewCardTitle({ ...newCardTitle, [stageId]: '' });
  };

  const handleCreateCard = async (stageId: string) => {
    const title = newCardTitle[stageId]?.trim();
    if (!title || !clientId) return;

    try {
      await onboardingCardOperations.create({
        title,
        clientId,
        stage: stageId,
        responsavel: '',
        vencimento: undefined,
        checklist: [],
        notas: ''
      });
      
      if (onCardsReload) {
        onCardsReload();
      }
      
      // Reset input
      setNewCardTitle({ ...newCardTitle, [stageId]: '' });
      setShowingInputForStage(null);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, stageId: string) => {
    if (e.key === 'Enter') {
      handleCreateCard(stageId);
    } else if (e.key === 'Escape') {
      setShowingInputForStage(null);
      setNewCardTitle({ ...newCardTitle, [stageId]: '' });
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
              <Button 
                onClick={() => setShowBulkModal(true)} 
                variant="outline"
                className="flex items-center gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Adicionar em Lote
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Templates
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowSaveTemplate(true)}>
                    Salvar como template
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowApplyTemplate(true)}>
                    Aplicar template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 flex-1">
            {stages.map(stage => {
              const columnCards = getCardsForColumn(stage.id);
              const Icon = getIconComponent(stage.icon);
              
              return (
                <DroppableColumn key={stage.id} column={stage}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{stage.title}</span>
                      </div>
                      <Badge variant="secondary">{columnCards.length}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <SortableContext
                      id={stage.id}
                      items={(columnOrder[stage.id] || columnCards.map(c => c.id))}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2 min-h-20">
                        {columnCards.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Nenhum card</p>
                          </div>
                        ) : (
                           (columnOrder[stage.id] || columnCards.map(c => c.id)).map((id) => {
                             const card = columnCards.find(c => c.id === id);
                             if (!card) return null;
                             return (
                               <SortableOnboardingCard
                                 key={card.id}
                                 card={card}
                                 onClick={handleCardClick}
                                 onComplete={handleCompleteCard}
                                 onDelete={handleDeleteCardConfirm}
                                 draggable={true}
                               />
                             );
                           })
                        )}
                       </div>
                       
                       {/* Add Card Button */}
                       {showingInputForStage === stage.id ? (
                         <div className="mt-2">
                           <Input
                             autoFocus
                             placeholder="Título do card..."
                             value={newCardTitle[stage.id] || ''}
                             onChange={(e) => setNewCardTitle({ ...newCardTitle, [stage.id]: e.target.value })}
                             onKeyDown={(e) => handleKeyPress(e, stage.id)}
                             onBlur={() => {
                               if (!newCardTitle[stage.id]?.trim()) {
                                 setShowingInputForStage(null);
                               }
                             }}
                             className="text-sm"
                           />
                           <p className="text-xs text-muted-foreground mt-1">
                             Enter para criar • Esc para cancelar
                           </p>
                         </div>
                       ) : (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleAddCard(stage.id)}
                           className="w-full justify-start text-muted-foreground hover:text-foreground mt-2"
                         >
                           <Plus className="h-4 w-4 mr-2" />
                           Adicionar card
                         </Button>
                       )}
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

      <SaveTemplateModal
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        clientId={clientId}
        onSaved={handleCardsReload}
      />

      <TemplateApplicator
        open={showApplyTemplate}
        onOpenChange={setShowApplyTemplate}
        clientId={clientId}
        onApplied={handleCardsReload}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O card será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCardExecute}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}