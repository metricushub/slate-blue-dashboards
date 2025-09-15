import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DndContext, DragEndEvent, DragStartEvent, closestCorners, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FileText,
  CreditCard,
  Settings,
  MessageSquare,
  Rocket,
  CheckCircle,
  Clock,
  User,
  Calendar,
  Edit,
  Flag,
  Plus
} from "lucide-react";
import { OnboardingCard } from '@/shared/db/onboardingStore';
import { toast } from '@/hooks/use-toast';

interface NewOnboardingKanbanProps {
  clientId?: string;
  cards: OnboardingCard[];
  onCardMove: (cardId: string, newStage: string, newSubStage?: string) => void;
  onCardClick?: (card: OnboardingCard) => void;
  onCreateCard?: () => void;
}

interface DroppableColumnProps {
  column: typeof ONBOARDING_COLUMNS[number];
  children: React.ReactNode;
}

function DroppableColumn({ column, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`${column.color} flex flex-col ${isOver ? 'ring-2 ring-primary' : ''}`}
    >
      {children}
    </Card>
  );
}

const ONBOARDING_COLUMNS = [
  { id: 'pre-cadastro', title: 'Pré-cadastro', icon: FileText, color: 'bg-blue-50 border-blue-200' },
  { id: 'formulario-documentos', title: 'Formulário & Documentos', icon: FileText, color: 'bg-yellow-50 border-yellow-200' },
  { id: 'financeiro', title: 'Financeiro', icon: CreditCard, color: 'bg-orange-50 border-orange-200' },
  { id: 'acessos-setup', title: 'Acessos & Setup', icon: Settings, color: 'bg-purple-50 border-purple-200' },
  { id: 'briefing-estrategia', title: 'Briefing & Estratégia', icon: MessageSquare, color: 'bg-indigo-50 border-indigo-200' },
  { id: 'go-live', title: 'Go-Live', icon: Rocket, color: 'bg-green-50 border-green-200' }
] as const;

interface SortableOnboardingCardProps {
  card: OnboardingCard;
  onCardClick?: (card: OnboardingCard) => void;
}

function SortableOnboardingCard({ card, onCardClick }: SortableOnboardingCardProps) {
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
    onCardClick?.(card);
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

          {/* Checklist Progress */}
          {card.checklist && card.checklist.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 inline mr-1" />
              {card.checklist.filter(item => item.includes('✓')).length}/{card.checklist.length} itens
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function NewOnboardingKanban({ 
  clientId, 
  cards, 
  onCardMove, 
  onCardClick, 
  onCreateCard 
}: NewOnboardingKanbanProps) {
  const [activeCard, setActiveCard] = useState<OnboardingCard | null>(null);
  
  // Organize cards by columns
  const getCardsForColumn = (columnId: string) => {
    return cards.filter(card => {
      switch (columnId) {
        case 'pre-cadastro':
          return card.stage === 'dados-gerais';
        case 'formulario-documentos':
          return card.stage === 'implementacao';
        case 'financeiro':
          return card.stage === 'financeiro';
        case 'acessos-setup':
          return card.stage === 'configuracao';
        case 'briefing-estrategia':
          return card.stage === 'briefing';
        case 'go-live':
          return card.stage === 'briefing'; // Temporary until we add go-live stage
        default:
          return false;
      }
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = cards.find(c => c.id === event.active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCard(null);
    
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const targetId = String(over.id);
    
    // Map column IDs to stages
    const stageMapping: Record<string, string> = {
      'pre-cadastro': 'dados-gerais',
      'formulario-documentos': 'implementacao',
      'financeiro': 'financeiro',
      'acessos-setup': 'configuracao',
      'briefing-estrategia': 'briefing',
      'go-live': 'go-live'
    };

    const newStage = stageMapping[targetId];
    if (newStage) {
      onCardMove(cardId, newStage);
      toast({
        title: "Card movido",
        description: `Card movido para ${ONBOARDING_COLUMNS.find(c => c.id === targetId)?.title}`,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Onboarding do Cliente</h3>
        {onCreateCard && (
          <Button onClick={onCreateCard} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Card
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 min-h-96">
          {ONBOARDING_COLUMNS.map(column => {
            const columnCards = getCardsForColumn(column.id);
            const Icon = column.icon;
            
            return (
              <DroppableColumn key={column.id} column={column}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs leading-tight">{column.title}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {columnCards.length}
                    </Badge>
                  </CardTitle>
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
                            onCardClick={onCardClick}
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

        <DragOverlay>
          {activeCard && (
            <SortableOnboardingCard 
              card={activeCard}
              onCardClick={onCardClick}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}