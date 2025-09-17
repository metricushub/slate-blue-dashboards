import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Task, TaskStatus } from "@/types";
import { DndContext, DragEndEvent, DragStartEvent, closestCorners, DragOverlay, useDroppable } from '@dnd-kit/core';
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
  EyeOff,
  Edit,
  ChevronDown,
  Trash2,
  ArchiveX,
  Plus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskKanbanProps {
  tasks: Task[];
  onTaskMove: (taskId: string, newStatus: TaskStatus, shouldArchive?: boolean) => void;
  onTaskClick?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskCreate?: (status: TaskStatus) => void;
  clients: any[];
}

interface DroppableColumnProps {
  column: typeof KANBAN_COLUMNS[number];
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
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

function SortableTaskCard({ task, clients, onTaskClick, onStatusChange, onArchive, onDelete }: SortableTaskCardProps) {
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

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onTaskClick?.(task);
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusChange?.(task.id, newStatus as TaskStatus);
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
              onClick={handleTitleClick}
              onPointerDown={(e) => e.stopPropagation()}
              title="Clique para editar"
            >
              {task.title}
            </h4>
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-blue-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskClick?.(task);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Editar tarefa"
              >
                <Edit className="h-3 w-3 text-muted-foreground hover:text-blue-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-orange-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive?.(task.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Arquivar tarefa"
              >
                <ArchiveX className="h-3 w-3 text-muted-foreground hover:text-orange-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(task.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                title="Excluir tarefa"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-600" />
              </Button>
            </div>
          </div>
          
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
          
          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <Select value={task.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Em progresso">Em progresso</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
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

export function TaskKanban({ tasks, onTaskMove, onTaskClick, onTaskDelete, onTaskCreate, clients }: TaskKanbanProps) {
  const [showArchived, setShowArchived] = useState(false);
  const [archivedPage, setArchivedPage] = useState(1);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Organize tasks by columns - ensures no task appears in multiple columns
  const getTasksForColumn = (columnId: string) => {
    switch (columnId) {
      case 'overdue':
        // Priority 1: Overdue tasks (not completed and past due date)
        return tasks.filter(t => 
          t.due_date && t.due_date < today && t.status !== 'Concluída' && !t.archived_at
        );
      case 'Concluída':
        // Priority 2: Completed tasks
        return tasks.filter(t => t.status === 'Concluída' && !t.archived_at);
      case 'Em progresso':
        // Priority 3: In progress tasks (excluding overdue)
        return tasks.filter(t => 
          t.status === 'Em progresso' && !t.archived_at &&
          !(t.due_date && t.due_date < today)
        );
      case 'Aberta':
        // Priority 4: Open tasks (excluding overdue)
        return tasks.filter(t => 
          t.status === 'Aberta' && !t.archived_at &&
          !(t.due_date && t.due_date < today)
        );
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

    const taskId = String(active.id);
    let targetId = String(over.id);

    // If dropped over another task, infer that task's column
    if (!KANBAN_COLUMNS.some(c => c.id === targetId)) {
      const overTask = tasks.find(t => t.id === targetId);
      if (overTask) {
        if (overTask.archived_at) {
          targetId = 'archived';
        } else if (overTask.status === 'Concluída') {
          targetId = 'Concluída';
        } else if (overTask.due_date && overTask.due_date < today) {
          targetId = 'overdue';
        } else if (overTask.status === 'Em progresso') {
          targetId = 'Em progresso';
        } else {
          targetId = 'Aberta';
        }
      }
    }

    // Handle different column types
    switch (targetId) {
      case 'Aberta':
      case 'Em progresso':
        onTaskMove(taskId, targetId as TaskStatus);
        break;
      case 'overdue':
        // Keep original status when dropped on "Atrasadas"
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
              <DroppableColumn key={column.id} column={column}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">
                      {columnTasks.length}
                    </Badge>
                    {/* Botão de criação rápida - não mostrar para overdue e archived */}
                    {column.id !== 'overdue' && column.id !== 'archived' && onTaskCreate && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 ml-1 hover:bg-primary/10"
                        onClick={() => onTaskCreate(column.id as TaskStatus)}
                        title={`Criar tarefa ${column.title.toLowerCase()}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 pt-0">
                  <SortableContext
                    items={columnTasks.map(t => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 min-h-20">
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
                            onTaskClick={onTaskClick}
                            onStatusChange={onTaskMove}
                            onArchive={(taskId) => onTaskMove(taskId, 'Aberta', true)}
                            onDelete={onTaskDelete}
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
              </DroppableColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <SortableTaskCard 
              task={activeTask} 
              clients={clients} 
              onStatusChange={onTaskMove}
              onArchive={(taskId) => onTaskMove(taskId, 'Aberta', true)}
              onDelete={onTaskDelete}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
