import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Task, TaskStatus } from "@/types";
import { DndContext, DragEndEvent, DragStartEvent, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useToast } from "@/hooks/use-toast";
import {
  Archive,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  User,
  Flag,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

interface TaskKanbanProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, shouldArchive?: boolean) => void;
  onTaskEdit: (task: Task) => void;
  clients: any[];
}

const KANBAN_COLUMNS = [
  { id: 'Aberta', title: 'Planejamento', icon: Target, color: 'bg-blue-50 border-blue-200', droppable: true },
  { id: 'Em progresso', title: 'Execução', icon: Clock, color: 'bg-orange-50 border-orange-200', droppable: true },
  { id: 'overdue', title: 'Atrasadas', icon: Flag, color: 'bg-red-50 border-red-200', droppable: false },
  { id: 'Concluída', title: 'Concluídas', icon: CheckCircle, color: 'bg-green-50 border-green-200', droppable: true },
  { id: 'archived', title: 'Arquivadas', icon: Archive, color: 'bg-gray-50 border-gray-200', droppable: true }
] as const;

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
  droppable: boolean;
}

function DroppableColumn({ id, children, droppable }: DroppableColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    disabled: !droppable
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`h-full ${isOver && droppable ? 'ring-2 ring-primary ring-offset-2' : ''}`}
    >
      {children}
      {!droppable && isOver && (
        <div className="absolute inset-0 bg-red-100/80 border-2 border-red-300 border-dashed rounded-lg flex items-center justify-center z-10">
          <div className="bg-red-50 p-3 rounded-lg border border-red-200 shadow-sm">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Atrasadas é gerada automaticamente</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SortableTaskCardProps {
  task: Task;
  clients: any[];
  onEdit: (task: Task) => void;
}

function SortableTaskCard({ task, clients, onEdit }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'text-red-600 bg-red-50';
      case 'Média': return 'text-yellow-600 bg-yellow-50';
      case 'Baixa': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'Concluída';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card 
        className={`mb-3 transition-colors hover:shadow-md ${isOverdue ? 'border-red-300 bg-red-50/50' : ''}`}
        onClick={(e) => {
          // Only trigger edit if not dragging
          if (!isDragging) {
            e.stopPropagation();
            onEdit(task);
          }
        }}
      >
        <CardContent className="p-3 space-y-2">
          <div {...listeners} className="space-y-2">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
              </div>
              
              {task.due_date && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
            
            {(task.client_id || task.owner) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {task.client_id && (
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-20">{getClientName(task.client_id)}</span>
                  </div>
                )}
                {task.owner && (
                  <span className="truncate">{task.owner}</span>
                )}
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {task.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                    #{tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function TaskKanban({ tasks, onTaskMove, onTaskEdit, clients }: TaskKanbanProps) {
  const { toast } = useToast();
  const [showArchived, setShowArchived] = useState(false);
  const [archivedPage, setArchivedPage] = useState(1);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Organize tasks by columns
  const getTasksForColumn = (columnId: string) => {
    switch (columnId) {
      case 'Aberta':
        return tasks.filter(t => t.status === 'Aberta' && !t.archived_at);
      case 'Em progresso':
        return tasks.filter(t => t.status === 'Em progresso' && !t.archived_at);
      case 'overdue':
        return tasks.filter(t => 
          t.due_date && t.due_date < today && t.status !== 'Concluída' && !t.archived_at
        );
      case 'Concluída':
        return tasks.filter(t => t.status === 'Concluída' && !t.archived_at);
      case 'archived':
        if (!showArchived) return [];
        const archivedTasks = tasks.filter(t => t.archived_at);
        const startIndex = (archivedPage - 1) * 10;
        return archivedTasks.slice(startIndex, startIndex + 10);
      default:
        return [];
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newColumnId = over.id as string;
    
    // Check if dropping in a non-droppable column
    const column = KANBAN_COLUMNS.find(col => col.id === newColumnId);
    if (column && !column.droppable) {
      // Show toast for read-only columns
      if (newColumnId === 'overdue') {
        toast({
          title: "Coluna somente leitura",
          description: "A coluna 'Atrasadas' é gerada automaticamente pelo prazo",
          variant: "default"
        });
      }
      return;
    }
    
    // Handle different column types
    switch (newColumnId) {
      case 'Aberta':
      case 'Em progresso':
      case 'Concluída':
        onTaskMove(taskId, newColumnId as TaskStatus);
        toast({
          title: "Tarefa movida",
          description: `Movida para ${column?.title}`,
          variant: "default"
        });
        break;
      case 'archived':
        onTaskMove(taskId, 'Aberta', true); // Archive the task
        toast({
          title: "Tarefa arquivada",
          description: "Tarefa movida para Arquivadas",
          variant: "default"
        });
        break;
    }
  };

  const archivedTasks = tasks.filter(t => t.archived_at);
  const hasMoreArchived = archivedTasks.length > archivedPage * 10;

  return (
    <div className="space-y-4">
      {/* Archive Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Kanban</h3>
        <div className="flex items-center gap-2">
          <label htmlFor="show-archived" className="text-sm font-medium">
            Mostrar Arquivadas
          </label>
          <Switch
            id="show-archived"
            checked={showArchived}
            onCheckedChange={setShowArchived}
          />
          {showArchived && archivedTasks.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({archivedTasks.length} arquivada{archivedTasks.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 min-h-96">
          {KANBAN_COLUMNS.map(column => {
            if (column.id === 'archived' && !showArchived) return null;
            
            const columnTasks = getTasksForColumn(column.id);
            const Icon = column.icon;
            
            return (
              <DroppableColumn key={column.id} id={column.id} droppable={column.droppable}>
                <Card className={`${column.color} flex flex-col h-full relative`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {column.title}
                      <Badge variant="secondary" className="ml-auto">
                        {columnTasks.length}
                      </Badge>
                      {!column.droppable && (
                        <Badge variant="outline" className="text-xs px-1">
                          Auto
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <SortableContext
                      items={columnTasks.map(t => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {columnTasks.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Nenhuma tarefa</p>
                          </div>
                        ) : (
                          columnTasks.map(task => (
                            <SortableTaskCard
                              key={task.id}
                              task={task}
                              clients={clients}
                              onEdit={onTaskEdit}
                            />
                          ))
                        )}
                      </div>
                    </SortableContext>
                    
                    {/* Load more for archived */}
                    {column.id === 'archived' && hasMoreArchived && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3"
                        onClick={() => setArchivedPage(prev => prev + 1)}
                      >
                        Ver mais ({archivedTasks.length - archivedPage * 10} restantes)
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <SortableTaskCard 
              task={activeTask} 
              clients={clients} 
              onEdit={() => {}} 
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}