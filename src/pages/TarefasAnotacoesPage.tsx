import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDataSource } from "@/hooks/useDataSource";
import { taskOperations, noteOperations, dashboardDb } from "@/shared/db/dashboardStore";
import { NewTaskModal } from "@/components/modals/NewTaskModal";
import { NewNoteModal } from "@/components/modals/NewNoteModal";
import { BulkAddTasksModal } from "@/components/modals/BulkAddTasksModal";
import { TaskEditModal } from "@/components/modals/TaskEditModal";
import { TaskDashboardCards } from "@/components/dashboard/TaskDashboardCards";
import { TaskAlertsBanner } from "@/components/dashboard/TaskAlertsBanner";
import { TaskKanban } from "@/components/dashboard/TaskKanban";
import { TaskFiltersAndViews, TaskFilters } from "@/components/dashboard/TaskFiltersAndViews";
import { Task, Note, TaskPriority, TaskStatus } from "@/types";
import { 
  Plus, 
  Search,
  CheckSquare,
  StickyNote,
  Calendar,
  User,
  Flag,
  Clock,
  Edit,
  Trash2,
  Pin,
  CheckCircle,
  Filter,
  ChevronRight,
  Loader2
} from "lucide-react";

export default function TarefasAnotacoesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dataSource } = useDataSource();
  
  // States
  const [activeTab, setActiveTab] = useState("tarefas");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showTaskEditModal, setShowTaskEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Filter states
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({});

  // Load data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load clients first
      let clientsData: any[] = [];
      if (dataSource) {
        clientsData = await dataSource.getClients();
        setClients(clientsData);
      }

      // Load tasks from all clients
      let allTasks: Task[] = [];
      for (const client of clientsData) {
        try {
          const clientTasks = await taskOperations.getByClient(client.id);
          allTasks = [...allTasks, ...clientTasks];
        } catch (error) {
          console.error(`Error loading tasks for client ${client.id}:`, error);
        }
      }
      setTasks(allTasks);

      // Load notes from all clients
      let allNotes: Note[] = []; 
      for (const client of clientsData) {
        try {
          const clientNotes = await noteOperations.getByClient(client.id);
          allNotes = [...allNotes, ...clientNotes];
        } catch (error) {
          console.error(`Error loading notes for client ${client.id}:`, error);
        }
      }
      setNotes(allNotes);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Task handlers
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newTask = await taskOperations.create(taskData);
      setTasks(prev => [...prev, newTask]);
      setShowNewTaskModal(false);
      toast({
        title: "Tarefa criada",
        description: "Tarefa criada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleCreateTasksBulk = async (tasksData: Omit<Task, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const newTasks = [];
      for (const taskData of tasksData) {
        const newTask = await taskOperations.create(taskData);
        newTasks.push(newTask);
      }
      setTasks(prev => [...prev, ...newTasks]);
      setShowBulkAddModal(false);
      toast({
        title: "Tarefas criadas",
        description: `${newTasks.length} tarefa${newTasks.length !== 1 ? 's' : ''} criada${newTasks.length !== 1 ? 's' : ''} com sucesso`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefas",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingTask) return;
    
    try {
      await taskOperations.update(editingTask.id, taskData);
      // Get the updated task
      const updatedTask = { ...editingTask, ...taskData, updated_at: new Date().toISOString() };
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      setEditingTask(null);
      toast({
        title: "Tarefa atualizada",
        description: "Tarefa atualizada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus, shouldArchive?: boolean) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      let updateData: Partial<Task>;
      
      if (shouldArchive) {
        updateData = { archived_at: new Date().toISOString() };
      } else {
        updateData = { status: newStatus };
      }

      await taskOperations.update(taskId, updateData);
      const updatedTask = { ...task, ...updateData, updated_at: new Date().toISOString() };
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover tarefa",
        variant: "destructive"
      });
    }
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowTaskEditModal(true);
  };

  const handleTaskSave = async (updatedTask: Task) => {
    try {
      await taskOperations.update(updatedTask.id, updatedTask);
      const saved = { ...updatedTask, updated_at: new Date().toISOString() };
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? saved : t));
      setShowTaskEditModal(false);
      setEditingTask(null);
      toast({
        title: "Tarefa atualizada",
        description: "Tarefa atualizada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskOperations.delete(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast({
        title: "Tarefa excluída",
        description: "Tarefa excluída com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir tarefa",
        variant: "destructive"
      });
    }
  };

  // Note handlers
  const handleCreateNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newNote = await noteOperations.create(noteData);
      setNotes(prev => [...prev, newNote]);
      setShowNewNoteModal(false);
      toast({
        title: "Anotação criada",
        description: "Anotação criada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar anotação",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNote = async (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingNote) return;
    
    try {
      await noteOperations.update(editingNote.id, noteData);
      const updatedNote = { ...editingNote, ...noteData, updated_at: new Date().toISOString() };
      setNotes(prev => prev.map(n => n.id === editingNote.id ? updatedNote : n));
      setEditingNote(null);
      toast({
        title: "Anotação atualizada",
        description: "Anotação atualizada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar anotação",
        variant: "destructive"
      });
    }
  };

  const handlePinNote = async (noteId: string, pinned: boolean) => {
    try {
      await noteOperations.update(noteId, { pinned });
      const note = notes.find(n => n.id === noteId);
      if (note) {
        const updatedNote = { ...note, pinned, updated_at: new Date().toISOString() };
        setNotes(prev => prev.map(n => n.id === noteId ? updatedNote : n));
      }
      toast({
        title: pinned ? "Anotação fixada" : "Anotação desfixada",
        description: pinned ? "Anotação fixada no topo" : "Anotação removida do topo"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar anotação",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await noteOperations.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast({
        title: "Anotação excluída",
        description: "Anotação excluída com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir anotação",
        variant: "destructive"
      });
    }
  };

  // Utility functions
  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'Alta': return 'destructive';
      case 'Média': return 'default';
      case 'Baixa': return 'secondary';
      default: return 'default';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Concluída': return 'default';
      case 'Em progresso': return 'default';
      case 'Aberta': return 'secondary';
      default: return 'default';
    }
  };

  // Apply filters
  const applyTaskFilters = (tasks: Task[], filters: TaskFilters) => {
    return tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && filters.status !== 'all' && (filters.status as string) !== '' && task.status !== filters.status) {
        return false;
      }
      if (filters.priority && filters.priority !== 'all' && (filters.priority as string) !== '' && task.priority !== filters.priority) {
        return false;
      }
      if (filters.client_id && filters.client_id !== 'all' && task.client_id !== filters.client_id) {
        return false;
      }
      if (filters.owner && filters.owner !== 'all' && task.owner !== filters.owner) {
        return false;
      }
      if (filters.due_date_from && task.due_date && task.due_date < filters.due_date_from) {
        return false;
      }
      if (filters.due_date_to && task.due_date && task.due_date > filters.due_date_to) {
        return false;
      }
      return true;
    });
  };

  const filteredTasks = applyTaskFilters(tasks, taskFilters);

  // Sort notes (pinned first, then by date)
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tarefas & Anotações</h1>
          <p className="text-muted-foreground">Gerencie suas tarefas e anotações</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bulk Add Button (only for tasks) */}
          {activeTab === "tarefas" && (
            <Button 
              variant="outline"
              onClick={() => setShowBulkAddModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar em Lote
            </Button>
          )}

          {/* New Button */}
          <Button 
            onClick={() => {
              if (activeTab === "tarefas") {
                setShowNewTaskModal(true);
              } else {
                setShowNewNoteModal(true);
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="tarefas" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Tarefas
          </TabsTrigger>
          <TabsTrigger value="anotacoes" className="flex items-center gap-2">
            <StickyNote className="h-4 w-4" />
            Anotações
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tarefas" className="space-y-6">
          {/* Task Dashboard Cards */}
          <TaskDashboardCards tasks={tasks} />
          
          {/* Task Alerts Banner */}
          <TaskAlertsBanner 
            tasks={tasks} 
            onCompleteTask={(taskId) => handleTaskMove(taskId, 'Concluída')}
            onPostponeTask={(taskId) => {
              const task = tasks.find(t => t.id === taskId);
              if (task) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                handleTaskSave({ ...task, due_date: tomorrow.toISOString().split('T')[0] });
              }
            }}
          />
          
          {/* Task Filters */}
          <TaskFiltersAndViews
            filters={taskFilters}
            onFiltersChange={setTaskFilters}
            clients={clients}
            tasks={tasks}
          />
          
          {/* Task Kanban */}
          <TaskKanban
            tasks={filteredTasks}
            onTaskMove={handleTaskMove}
            onTaskEdit={handleTaskEdit}
            clients={clients}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="anotacoes" className="space-y-6">
          {sortedNotes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <StickyNote className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma anotação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  Comece criando sua primeira anotação
                </p>
                <Button onClick={() => setShowNewNoteModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Anotação
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sortedNotes.map(note => (
                <Card key={note.id} className={`transition-colors hover:shadow-md ${note.pinned ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                  <div className="flex items-start gap-4 p-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{note.title}</h3>
                        {note.pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Fixado
                          </Badge>
                        )}
                      </div>
                      
                      {note.content && (
                        <div className="text-sm text-muted-foreground">
                          {note.content.length > 200 
                            ? `${note.content.substring(0, 200)}...` 
                            : note.content
                          }
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {note.client_id && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => navigate(`/cliente/${note.client_id}/overview`)}
                            >
                              {getClientName(note.client_id)}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Badge>
                          </div>
                        )}
                        
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {note.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(note.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePinNote(note.id, !note.pinned)}
                        title={note.pinned ? "Desfixar" : "Fixar no topo"}
                      >
                        <Pin className={`h-4 w-4 ${note.pinned ? 'text-primary' : ''}`} />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingNote(note)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewTaskModal
        open={showNewTaskModal}
        onOpenChange={setShowNewTaskModal}
        onSave={handleCreateTask}
      />

      <NewNoteModal
        open={showNewNoteModal}
        onOpenChange={setShowNewNoteModal}
        onSave={handleCreateNote}
      />

      <NewNoteModal
        open={!!editingNote}
        onOpenChange={(open) => !open && setEditingNote(null)}
        onSave={handleUpdateNote}
        initialData={editingNote || undefined}
      />

      <BulkAddTasksModal
        open={showBulkAddModal}
        onOpenChange={setShowBulkAddModal}
        onTasksCreated={handleCreateTasksBulk}
      />

      <TaskEditModal
        open={showTaskEditModal}
        onOpenChange={setShowTaskEditModal}
        onSave={handleTaskSave}
        task={editingTask}
      />
    </div>
  );
}