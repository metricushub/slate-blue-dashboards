import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GripVertical, X, Palette } from 'lucide-react';

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface SortableStageItemProps {
  id: string;
  stage: FunnelStage;
  index: number;
  onUpdate: (id: string, field: keyof FunnelStage, value: any) => void;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', 
  '#f97316', '#ef4444', '#84cc16', '#ec4899', '#6366f1'
];

export function SortableStageItem({ 
  id, 
  stage, 
  index, 
  onUpdate, 
  onRemove, 
  canRemove 
}: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground w-8">
                {index + 1}.
              </span>
              <Input
                value={stage.name}
                onChange={(e) => onUpdate(id, 'name', e.target.value)}
                placeholder="Nome da etapa"
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center space-x-2 ml-10">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div className="flex space-x-1">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 ${
                      stage.color === color ? 'border-foreground' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => onUpdate(id, 'color', color)}
                  />
                ))}
              </div>
            </div>
          </div>

          {canRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(id)}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}