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
      // Load tasks from all clients
      const allTasks = await dashboardDb.tasks.orderBy('created_at').reverse().toArray();
      setTasks(allTasks);
      
      // Load notes
      const allNotes = await noteOperations.getAll();
      setNotes(allNotes);
      
      // Load clients if available
      if (dataSource) {
        const clientsData = await dataSource.getClients();
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
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
  const handleCreateTask = async (taskData: Omit<Task, 'id' | 'created_at'>) => {
    try {
      const newTask = await taskOperations.create(taskData);
      setTasks(prev => [newTask, ...prev]);
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

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setShowTaskEditModal(true);
  };

  const handleTaskSave = async (updatedTask: Task) => {
    try {
      await taskOperations.update(updatedTask.id, {
        title: updatedTask.title,
        description: updatedTask.description,
        due_date: updatedTask.due_date,
        owner: updatedTask.owner,
        priority: updatedTask.priority,
        status: updatedTask.status,
        client_id: updatedTask.client_id,
        tags: updatedTask.tags,
        updated_at: updatedTask.updated_at
      });
      
      setTasks(prev => prev.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      ));
      
      toast({
        title: "Tarefa atualizada",
        description: "Alterações salvas com sucesso"
      });
      
      setShowTaskEditModal(false);
      setEditingTask(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive"
      });
    }
  };
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
    setTasks(prev => [...newTasks, ...prev]);
    toast({
      title: "Tarefas criadas",
      description: `${newTasks.length} tarefa(s) criada(s) em lote`
    });
  };

  // Note handlers
  const handleCreateNote = async (noteData: Omit<Note, 'id' | 'created_at'>) => {
    try {
      const newNote = await noteOperations.create(noteData);
      setNotes(prev => [newNote, ...prev]);
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
      loadAllData();
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
      if (filters.status && task.status !== filters.status) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.client_id && task.client_id !== filters.client_id) {
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
          {/* Dashboard Cards */}
          <TaskDashboardCards tasks={filteredTasks} />
          
          {/* Alerts Banner */}
          <TaskAlertsBanner 
            tasks={filteredTasks}
            onCompleteTask={handleCompleteTask}
            onPostponeTask={handlePostponeTask}
          />
          
          {/* Filters and Views */}
          <TaskFiltersAndViews
            filters={taskFilters}
            onFiltersChange={setTaskFilters}
            clients={clients}
            tasks={tasks}
          />
          
          {/* Kanban */}
          <TaskKanban 
            tasks={filteredTasks}
            onTaskMove={handleTaskMove}
            onTaskEdit={handleTaskEdit}
            clients={clients}
          />
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="anotacoes" className="space-y-4">
          {/* Search for notes */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar anotações..."
                  value={taskFilters.search || ''}
                  onChange={(e) => setTaskFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <StickyNote className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">
                {taskFilters.search ? "Nenhuma anotação encontrada" : "Nenhuma anotação ainda"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {taskFilters.search 
                  ? "Tente ajustar os termos de busca"
                  : "Crie sua primeira anotação para começar a documentar informações importantes"
                }
              </p>
              {!taskFilters.search && (
                <Button onClick={() => setShowNewNoteModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira anotação
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredNotes.map(note => (
                <Card key={note.id} className={`p-4 ${note.pinned ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        {note.pinned && <Pin className="h-4 w-4 text-primary" />}
                        <h3 className="font-semibold">{note.title}</h3>
                      </div>
                      
                      {note.content && (
                        <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
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

      <NewTaskModal
        open={!!editingTask}
        onOpenChange={(open) => !open && setEditingTask(null)}
        onSave={handleUpdateTask}
        initialData={editingTask || undefined}
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