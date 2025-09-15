import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Calendar, User, CheckSquare } from 'lucide-react';
import { OnboardingCard } from '@/shared/db/onboardingStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnboardingCardComponentProps {
  card: OnboardingCard;
  badge?: React.ReactNode;
  onEdit: (card: OnboardingCard) => void;
  onDelete: (cardId: string) => void;
  isDragging?: boolean;
  isSubStage?: boolean;
}

export function OnboardingCardComponent({
  card,
  badge,
  onEdit,
  onDelete,
  isDragging = false,
  isSubStage = false,
}: OnboardingCardComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const completedTasks = card.checklist.filter(item => item.startsWith('✓')).length;
  const totalTasks = card.checklist.length;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
        isDragging ? 'shadow-lg rotate-3' : ''
      } ${isSubStage ? 'bg-muted/30' : ''}`}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">
              {card.title}
            </h4>
            {badge}
          </div>

          {/* Client info (only show in global view) */}
          {card.clientName && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              {card.clientName}
            </div>
          )}

          {/* Responsável */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            {card.responsavel}
          </div>

          {/* Due date */}
          {card.vencimento && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(card.vencimento), 'dd/MM/yyyy', { locale: ptBR })}
            </div>
          )}

          {/* Checklist progress */}
          {totalTasks > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              {completedTasks}/{totalTasks} tarefas
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}