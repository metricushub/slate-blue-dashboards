import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CardEditor } from './CardEditor';
import { TemplateBlock, BLOCK_COLORS, BLOCK_ICONS } from '@/types/template';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit,
  Palette,
  FileText,
  CreditCard,
  Settings,
  MessageSquare,
  Rocket,
  User,
  Calendar,
  CheckSquare,
  Target,
  Briefcase,
  MoreHorizontal
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const iconMap = {
  FileText,
  CreditCard,
  Settings,
  MessageSquare,
  Rocket,
  User,
  Calendar,
  CheckSquare,
  Target,
  Briefcase
};

interface BlockEditorProps {
  block: TemplateBlock;
  onUpdate: (updates: Partial<TemplateBlock>) => void;
  onDelete: () => void;
}

export function BlockEditor({ block, onUpdate, onDelete }: BlockEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(block.name);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const IconComponent = iconMap[block.icon as keyof typeof iconMap] || CheckSquare;

  const handleNameSave = () => {
    onUpdate({ name: tempName });
    setEditingName(false);
  };

  const handleNameCancel = () => {
    setTempName(block.name);
    setEditingName(false);
  };

  const handleAddCard = () => {
    const newCard = {
      id: crypto.randomUUID(),
      title: 'Nova Tarefa',
      description: '',
      responsavel: '',
      prazoOffset: '+1d',
      tags: [],
      order: block.cards.length + 1
    };

    onUpdate({
      cards: [...block.cards, newCard]
    });
  };

  const handleUpdateCard = (cardId: string, updates: any) => {
    onUpdate({
      cards: block.cards.map(card =>
        card.id === cardId ? { ...card, ...updates } : card
      )
    });
  };

  const handleDeleteCard = (cardId: string) => {
    onUpdate({
      cards: block.cards.filter(card => card.id !== cardId)
    });
  };

  const handleCardsReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = block.cards.findIndex(card => card.id === active.id);
    const newIndex = block.cards.findIndex(card => card.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newCards = [...block.cards];
    const [movedCard] = newCards.splice(oldIndex, 1);
    newCards.splice(newIndex, 0, movedCard);

    // Update order
    newCards.forEach((card, index) => {
      card.order = index + 1;
    });

    onUpdate({ cards: newCards });
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={cn("border-l-4", block.color)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                <IconComponent className="h-5 w-5 text-muted-foreground" />
                
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave();
                        if (e.key === 'Escape') handleNameCancel();
                      }}
                      className="text-sm font-semibold"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleNameSave}>
                      ✓
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleNameCancel}>
                      ✕
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <h3 className="font-semibold">{block.name}</h3>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setEditingName(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>

              <Badge variant="outline">
                {block.cards.length} {block.cards.length === 1 ? 'card' : 'cards'}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <Palette className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Cor do Bloco</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {BLOCK_COLORS.map((color) => (
                          <button
                            key={color}
                            className={cn(
                              "h-8 rounded border-2 transition-all",
                              color,
                              block.color === color ? "ring-2 ring-primary" : ""
                            )}
                            onClick={() => onUpdate({ color })}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Ícone</h4>
                      <Select
                        value={block.icon}
                        onValueChange={(icon) => onUpdate({ icon })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOCK_ICONS.map((icon) => {
                            const Icon = iconMap[icon as keyof typeof iconMap];
                            return (
                              <SelectItem key={icon} value={icon}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {icon}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? '−' : '+'}
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCardsReorder}
            >
              <SortableContext 
                items={block.cards.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {block.cards.map((card) => (
                    <CardEditor
                      key={card.id}
                      card={card}
                      onUpdate={(updates) => handleUpdateCard(card.id, updates)}
                      onDelete={() => handleDeleteCard(card.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            <Button
              onClick={handleAddCard}
              variant="outline"
              size="sm"
              className="w-full mt-3 border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Card
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}