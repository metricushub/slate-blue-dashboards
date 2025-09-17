import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
import { TaskEditDrawer } from '@/components/modals/TaskEditDrawer';
import { TaskDashboardCards } from "@/components/dashboard/TaskDashboardCards";
import { TaskAlertsBanner } from "@/components/dashboard/TaskAlertsBanner";
import { TaskKanban } from "@/components/dashboard/TaskKanban";
import { TaskCalendar } from "@/components/dashboard/TaskCalendar";
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
  Loader2,
  UserCheck
} from "lucide-react";

export default function ClientTarefasAnotacoesPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  const { dataSource } = useDataSource();
  
  // States
  const [activeTab, setActiveTab] = useState("tarefas");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [clientInfo, setClientInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [showEditTaskDrawer, setShowEditTaskDrawer] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Filter states
  const [taskFilters, setTaskFilters] = useState<TaskFilters>({});

  // Load data
  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    if (!clientId) return;
    
    console.log('Loading data for client:', clientId);
    setLoading(true);
    try {
      // Load client-specific tasks
      const allTasks = await dashboardDb.tasks.orderBy('created_at').reverse().toArray();
      console.log('All tasks loaded:', allTasks.length);
      const clientTasks = allTasks.filter(task => task.client_id === clientId);
      console.log('Client tasks filtered:', clientTasks.length, clientTasks);
      setTasks(clientTasks);
      
      // Load client-specific notes
      const allNotes = await noteOperations.getAll();
      console.log('All notes loaded:', allNotes.length);
      const clientNotes = allNotes.filter(note => note.client_id === clientId);
      console.log('Client notes filtered:', clientNotes.length, clientNotes);
      setNotes(clientNotes);
      
      // Load client info if available
      if (dataSource) {
        const clients = await dataSource.getClients();
        const client = clients.find(c => c.id === clientId);
        console.log('Client info loaded:', client);
        setClientInfo(client);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do cliente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Task handlers (pre-fill clientId)
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const taskWithClient = { ...taskData, client_id: clientId };
      console.log('Creating task for client:', clientId, taskWithClient);
      const newTask = await taskOperations.create(taskWithClient);
      setTasks(prev => [newTask, ...prev]);
      toast({
        title: "Tarefa criada",
        description: "Tarefa criada com sucesso para este cliente"
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    if (!editingTask) return;
    
    try {
      await taskOperations.update(editingTask.id, taskData);
      setTasks(prev => prev.map(t => 
        t.id === editingTask.id 
          ? { ...t, ...taskData, updated_at: new Date().toISOString() }
          : t
      ));
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

  const handleCompleteTask = async (taskId: string) => {
    try {
      const now = new Date().toISOString();
      await taskOperations.update(taskId, { 
        status: 'Concluída',
        completed_at: now,
        updated_at: now
      });
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'Concluída' as TaskStatus, completed_at: now, updated_at: now }
          : t
      ));
      toast({
        title: "Tarefa concluída",
        description: "Tarefa marcada como concluída"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao concluir tarefa",
        variant: "destructive"
      });
    }
  };

  const handlePostponeTask = async (taskId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const newDueDate = tomorrow.toISOString().split('T')[0];
      
      await taskOperations.update(taskId, { 
        due_date: newDueDate,
        updated_at: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, due_date: newDueDate, updated_at: new Date().toISOString() }
          : t
      ));
      toast({
        title: "Tarefa adiada",
        description: "Prazo adiado para amanhã"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao adiar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus, shouldArchive?: boolean) => {
    try {
      const now = new Date().toISOString();
      const updates: Partial<Task> = {
        status: newStatus,
        updated_at: now
      };

      if (shouldArchive) {
        updates.archived_at = now;
      } else if (newStatus === 'Concluída') {
        updates.completed_at = now;
      }

      await taskOperations.update(taskId, updates);
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      ));
      
      const action = shouldArchive ? 'arquivada' : 
                    newStatus === 'Concluída' ? 'concluída' : 
                    `movida para ${newStatus}`;
      
      toast({
        title: "Tarefa atualizada",
        description: `Tarefa ${action} com sucesso`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao mover tarefa",
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

  const handleCreateTasksBulk = async (newTasks: Task[]) => {
    console.log('Creating bulk tasks for client:', clientId, newTasks);
    // Pre-fill all tasks with current clientId
    const tasksWithClient = newTasks.map(task => ({ ...task, client_id: clientId }));
    setTasks(prev => [...tasksWithClient, ...prev]);
    toast({
      title: "Tarefas criadas",
      description: `${newTasks.length} tarefa(s) criada(s) para este cliente`
    });
  };

  // Note handlers (pre-fill clientId)
  const handleCreateNote = async (noteData: Omit<Note, 'id' | 'created_at'>) => {
    try {
      const noteWithClient = { ...noteData, client_id: clientId };
      console.log('Creating note for client:', clientId, noteWithClient);
      const newNote = await noteOperations.create(noteWithClient);
      setNotes(prev => [newNote, ...prev]);
      toast({
        title: "Anotação criada",
        description: "Anotação criada com sucesso para este cliente"
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar anotação",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNote = async (noteData: Omit<Note, 'id' | 'created_at'>) => {
    if (!editingNote) return;
    
    try {
      await noteOperations.update(editingNote.id, noteData);
      setNotes(prev => prev.map(n => 
        n.id === editingNote.id 
          ? { ...n, ...noteData, updated_at: new Date().toISOString() }
          : n
      ));
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
      setNotes(prev => prev.map(n => 
        n.id === noteId 
          ? { ...n, pinned, updated_at: new Date().toISOString() }
          : n
      ));
      toast({
        title: pinned ? "Anotação fixada" : "Anotação desfixada",
        description: pinned ? "Anotação fixada no topo" : "Anotação removida do topo"
      });
      // Reload to update order
      loadClientData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fixar anotação",
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

  // Edit task handlers
  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setShowEditTaskDrawer(true);
  };

  const handleSaveEditTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await taskOperations.update(taskId, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, ...updates, updated_at: new Date().toISOString() }
          : t
      ));
      setEditingTask(null);
      setShowEditTaskDrawer(false);
      toast({
        title: "Tarefa atualizada",
        description: "Tarefa atualizada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };

  const handleTaskDateChange = async (taskId: string, newDate: string) => {
    try {
      await taskOperations.update(taskId, { 
        due_date: newDate,
        updated_at: new Date().toISOString()
      });
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, due_date: newDate, updated_at: new Date().toISOString() }
          : t
      ));
      toast({
        title: "Data atualizada",
        description: "Data de vencimento atualizada com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar data",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateTaskForDrawer = async (task: Task) => {
    try {
      const duplicatedTask = {
        title: `${task.title} (cópia)`,
        description: task.description,
        status: 'Aberta' as TaskStatus,
        priority: task.priority,
        due_date: task.due_date,
        client_id: clientId, // Ensure duplicated task stays with same client
        owner: task.owner,
      };
      const newTask = await taskOperations.create(duplicatedTask);
      setTasks(prev => [newTask, ...prev]);
      setShowEditTaskDrawer(false);
      toast({
        title: "Tarefa duplicada",
        description: "Tarefa duplicada com sucesso"
      });
    } catch (error) {
      console.error('Erro ao duplicar tarefa:', error);
      toast({
        title: "Erro",
        description: "Erro ao duplicar tarefa",
        variant: "destructive"
      });
    }
  };

  // Utility functions
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

  // Apply filters (no client filter needed since we already filter)
  const applyTaskFilters = (tasks: Task[], filters: TaskFilters) => {
    return tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.owner && task.owner !== filters.owner) {
        return false;
      }
      if (filters.due_date_from && (!task.due_date || task.due_date < filters.due_date_from)) {
        return false;
      }
      if (filters.due_date_to && (!task.due_date || task.due_date > filters.due_date_to)) {
        return false;
      }
      return true;
    });
  };

  const filteredTasks = applyTaskFilters(tasks, taskFilters);
  
  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (taskFilters.search && !note.title.toLowerCase().includes(taskFilters.search.toLowerCase())) {
      return false;
    }
    return true;
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Tarefas & Anotações</h1>
            <Badge variant="outline" className="flex items-center gap-1">
              <UserCheck className="h-3 w-3" />
              {clientInfo?.name || clientId}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Gerencie tarefas e anotações específicas deste cliente
          </p>
          <div className="mt-2 text-xs text-muted-foreground">
            Debug: {tasks.length} tarefas, {notes.length} anotações carregadas
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowBulkAddModal(true)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Lote
          </Button>
          <Button 
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {tasks.filter(t => t.status === 'Concluída').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {tasks.filter(t => t.status === 'Em progresso').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Anotações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notes.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Alerts Banner */}
      <TaskAlertsBanner 
        tasks={filteredTasks} 
        onCompleteTask={handleCompleteTask}
        onPostponeTask={handlePostponeTask}  
      />

      {/* Task Dashboard Cards */}
      <TaskDashboardCards 
        tasks={filteredTasks} 
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tarefas">Lista de Tarefas</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
          <TabsTrigger value="anotacoes">Anotações</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <TaskFiltersAndViews 
          filters={taskFilters}
          onFiltersChange={setTaskFilters}
          clients={[]}
          tasks={filteredTasks}
        />

        <TabsContent value="tarefas" className="space-y-4">
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    {taskFilters.search || Object.keys(taskFilters).length > 0 
                      ? "Nenhuma tarefa corresponde aos filtros aplicados."
                      : "Este cliente ainda não possui tarefas. Crie a primeira tarefa!"
                    }
                  </p>
                  <Button onClick={() => setShowNewTaskModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Tarefa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4" onClick={() => handleTaskClick(task)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge variant={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          <Badge variant={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.due_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                          {task.owner && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.owner}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {task.status !== 'Concluída' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteTask(task.id);
                            }}
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="kanban">
          <TaskKanban 
            tasks={filteredTasks}
            onTaskMove={handleTaskMove}
            onTaskClick={handleTaskClick}
            clients={[]}
          />
        </TabsContent>

        <TabsContent value="calendario">
          <TaskCalendar 
            tasks={filteredTasks}
            onTaskClick={handleTaskClick}
            onTaskDateChange={handleTaskDateChange}
            clients={[]}
          />
        </TabsContent>

        <TabsContent value="anotacoes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Anotações do Cliente</h2>
            <Button onClick={() => setShowNewNoteModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Anotação
            </Button>
          </div>
          
          <div className="space-y-4">
            {filteredNotes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <StickyNote className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma anotação encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Este cliente ainda não possui anotações. Crie a primeira anotação!
                  </p>
                  <Button onClick={() => setShowNewNoteModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Anotação
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{note.title}</h3>
                          {note.pinned && (
                            <Badge variant="secondary">
                              <Pin className="h-3 w-3 mr-1" />
                              Fixada
                            </Badge>
                          )}
                        </div>
                        
                        {note.content && (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {note.content}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Criada em {new Date(note.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {note.updated_at && note.updated_at !== note.created_at && (
                            <span>
                              Atualizada em {new Date(note.updated_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePinNote(note.id, !note.pinned)}
                        >
                          <Pin className={`h-3 w-3 ${note.pinned ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingNote(note)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals - Reativados e corrigidos */}
      <NewTaskModal
        open={showNewTaskModal}
        onOpenChange={setShowNewTaskModal}
        onSave={(taskData) => {
          handleCreateTask(taskData);
          setShowNewTaskModal(false);
        }}
      />

      <NewNoteModal
        open={showNewNoteModal}
        onOpenChange={setShowNewNoteModal}
        onSave={(noteData) => {
          if (editingNote) {
            handleUpdateNote(noteData);
          } else {
            handleCreateNote(noteData);
          }
          setShowNewNoteModal(false);
        }}
        initialData={editingNote || undefined}
      />

      <BulkAddTasksModal
        open={showBulkAddModal}
        onOpenChange={setShowBulkAddModal}
        onTasksCreated={(newTasks) => {
          // Ensure all tasks have the current clientId
          const tasksWithClient = newTasks.map(task => ({
            ...task,
            client_id: clientId
          }));
          handleCreateTasksBulk(tasksWithClient);
        }}
      />

      {showEditTaskDrawer && editingTask && (
        <TaskEditDrawer
          task={editingTask}
          open={showEditTaskDrawer}
          onOpenChange={(open) => {
            setShowEditTaskDrawer(open);
            if (!open) setEditingTask(null);
          }}
          clients={clientInfo ? [clientInfo] : []}
          onSave={handleSaveEditTask}
          onDelete={handleDeleteTask}
          onDuplicate={handleDuplicateTaskForDrawer}
        />
      )}
    </div>
  );
}