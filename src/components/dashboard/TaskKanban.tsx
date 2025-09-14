import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Task, TaskStatus } from "@/types";
import { DndContext, DragEndEvent, DragStartEvent, closestCorners, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Archive,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  User,
  Flag,
  Eye,
  EyeOff
} from "lucide-react";

interface TaskKanbanProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, shouldArchive?: boolean) => void;
  clients: any[];
}

const KANBAN_COLUMNS = [
  { id: 'Aberta', title: 'Planejamento', icon: Target, color: 'bg-blue-50 border-blue-200' },
  { id: 'Em progresso', title: 'Execução', icon: Clock, color: 'bg-orange-50 border-orange-200' },
  { id: 'overdue', title: 'Atrasadas', icon: Flag, color: 'bg-red-50 border-red-200' },
  { id: 'Concluída', title: 'Concluídas', icon: CheckCircle, color: 'bg-green-50 border-green-200' },
  { id: 'archived', title: 'Arquivadas', icon: Archive, color: 'bg-gray-50 border-gray-200' }
] as const;

interface SortableTaskCardProps {
  task: Task;
  clients: any[];
}

function SortableTaskCard({ task, clients }: SortableTaskCardProps) {
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
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <Card className={`mb-3 ${isOverdue ? 'border-red-300 bg-red-50/50' : ''}`}>
        <CardContent className="p-3 space-y-2">
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
        </CardContent>
      </Card>
    </div>
  );
}

export function TaskKanban({ tasks, onTaskMove, clients }: TaskKanbanProps) {
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
        // Paginate archived tasks
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
    
    // Handle different column types
    switch (newColumnId) {
      case 'Aberta':
      case 'Em progresso':
        onTaskMove(taskId, newColumnId as TaskStatus);
        break;
      case 'overdue':
        // Tasks in overdue keep their status but we could mark them as overdue
        break;
      case 'Concluída':
        onTaskMove(taskId, 'Concluída');
        break;
      case 'archived':
        onTaskMove(taskId, 'Aberta', true); // Archive the task
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
              <Card key={column.id} className={`${column.color} flex flex-col`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">
                      {columnTasks.length}
                    </Badge>
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
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <SortableTaskCard task={activeTask} clients={clients} />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
