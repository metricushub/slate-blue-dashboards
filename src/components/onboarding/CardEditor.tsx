import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { TemplateCard } from '@/types/template';
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
import {
  GripVertical,
  Edit,
  Trash2,
  User,
  Clock,
  Tag,
  MoreHorizontal
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface CardEditorProps {
  card: TemplateCard;
  onUpdate: (updates: Partial<TemplateCard>) => void;
  onDelete: () => void;
}

export function CardEditor({ card, onUpdate, onDelete }: CardEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(card.title);
  const [newTag, setNewTag] = useState('');

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

  const handleTitleSave = () => {
    onUpdate({ title: tempTitle });
    setEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTempTitle(card.title);
    setEditingTitle(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !card.tags?.includes(newTag.trim())) {
      onUpdate({ 
        tags: [...(card.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdate({
      tags: card.tags?.filter(tag => tag !== tagToRemove)
    });
  };

  const offsetOptions = [
    { value: '+0d', label: 'Hoje' },
    { value: '+1d', label: '+1 dia' },
    { value: '+2d', label: '+2 dias' },
    { value: '+3d', label: '+3 dias' },
    { value: '+1w', label: '+1 semana' },
    { value: '+2w', label: '+2 semanas' },
    { value: '+3w', label: '+3 semanas' },
    { value: '+1m', label: '+1 mês' },
  ];

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-l-2 border-l-blue-200">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing mt-1"
            >
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-2">
              {/* Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave();
                      if (e.key === 'Escape') handleTitleCancel();
                    }}
                    className="text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleTitleSave}>
                    ✓
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleTitleCancel}>
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium">{card.title}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setEditingTitle(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-1">
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
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {card.responsavel && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {card.responsavel}
                  </div>
                )}
                {card.prazoOffset && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {offsetOptions.find(o => o.value === card.prazoOffset)?.label || card.prazoOffset}
                  </div>
                )}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {card.tags.length} etiqueta{card.tags.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="space-y-3 pt-2 border-t">
                  {/* Description */}
                  <div>
                    <Label className="text-xs">Descrição</Label>
                    <Textarea
                      value={card.description || ''}
                      onChange={(e) => onUpdate({ description: e.target.value })}
                      placeholder="Descrição da tarefa..."
                      className="text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Responsible */}
                  <div>
                    <Label className="text-xs">Responsável</Label>
                    <Input
                      value={card.responsavel || ''}
                      onChange={(e) => onUpdate({ responsavel: e.target.value })}
                      placeholder="Nome do responsável"
                      className="text-sm"
                    />
                  </div>

                  {/* Due Date Offset */}
                  <div>
                    <Label className="text-xs">Prazo (relativo à data âncora)</Label>
                    <Select
                      value={card.prazoOffset || '+1d'}
                      onValueChange={(prazoOffset) => onUpdate({ prazoOffset })}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {offsetOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="text-xs">Etiquetas</Label>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {card.tags?.map((tag) => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="text-xs cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        placeholder="Nova etiqueta..."
                        className="text-sm"
                      />
                      <Button 
                        size="sm" 
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}