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
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  // Filter states
  const [taskFilters, setTaskFilters] = useState({
    status: '',
    priority: '',
    client_id: ''
  });

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
      await taskOperations.update(taskId, { status: 'Concluída' });
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: 'Concluída' as TaskStatus, updated_at: new Date().toISOString() }
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

  const handleCreateTasksBulk = async (tasks: Task[]) => {
    setTasks(prev => [...tasks, ...prev]);
    toast({
      title: "Tarefas criadas",
      description: `${tasks.length} tarefa(s) criada(s) em lote`
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

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (taskFilters.status && task.status !== taskFilters.status) {
      return false;
    }
    if (taskFilters.priority && task.priority !== taskFilters.priority) {
      return false;
    }
    if (taskFilters.client_id && task.client_id !== taskFilters.client_id) {
      return false;
    }
    return true;
  });

  // Filter notes
  const filteredNotes = notes.filter(note => {
    if (searchQuery && !note.title.toLowerCase().includes(searchQuery.toLowerCase())) {
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
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

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
        <TabsContent value="tarefas" className="space-y-4">
          {/* Task Filters */}
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
            <Filter className="h-4 w-4 text-muted-foreground" />
            
            <Select 
              value={taskFilters.status} 
              onValueChange={(value) => setTaskFilters(prev => ({...prev, status: value}))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aberta">Aberta</SelectItem>
                <SelectItem value="Em progresso">Em progresso</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>

            <Select 
              value={taskFilters.priority} 
              onValueChange={(value) => setTaskFilters(prev => ({...prev, priority: value}))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            {clients.length > 0 && (
              <Select 
                value={taskFilters.client_id} 
                onValueChange={(value) => setTaskFilters(prev => ({...prev, client_id: value}))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(taskFilters.status || taskFilters.priority || taskFilters.client_id) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setTaskFilters({ status: '', priority: '', client_id: '' })}
              >
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Tasks List */}
          {filteredTasks.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery || Object.values(taskFilters).some(Boolean) 
                  ? "Nenhuma tarefa encontrada" 
                  : "Nenhuma tarefa ainda"
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || Object.values(taskFilters).some(Boolean)
                  ? "Tente ajustar os filtros ou busca"
                  : "Crie sua primeira tarefa para começar a organizar seu trabalho"
                }
              </p>
              {!(searchQuery || Object.values(taskFilters).some(Boolean)) && (
                <Button onClick={() => setShowNewTaskModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeira tarefa
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.map(task => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge variant={getStatusColor(task.status)}>{task.status}</Badge>
                        <Badge variant={getPriorityColor(task.priority)}>{task.priority}</Badge>
                      </div>
                      
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {task.client_id && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-accent"
                              onClick={() => navigate(`/cliente/${task.client_id}/overview`)}
                            >
                              {getClientName(task.client_id)}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Badge>
                          </div>
                        )}
                        
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
                    
                    <div className="flex items-center gap-2 ml-4">
                      {task.status !== 'Concluída' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingTask(task)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTask(task.id)}
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

        {/* Notes Tab */}
        <TabsContent value="anotacoes" className="space-y-4">
          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <Card className="p-12 text-center">
              <StickyNote className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Nenhuma anotação encontrada" : "Nenhuma anotação ainda"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? "Tente ajustar os termos de busca"
                  : "Crie sua primeira anotação para começar a documentar informações importantes"
                }
              </p>
              {!searchQuery && (
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
    </div>
  );
}