import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Task, AlertRule, TaskStatus, TaskPriority } from "@/types";
import { taskOperations, alertOperations } from "@/shared/db/dashboardStore";
import { Plus, Edit, Trash2, Calendar, User, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModalFrameV2 } from "./ModalFrameV2";

interface TasksAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

interface TaskFormData {
  title: string;
  description: string;
  due_date: string;
  owner: string;
  priority: TaskPriority;
  status: TaskStatus;
}

interface AlertFormData {
  name: string;
  expression: string;
  severity: "info" | "warn" | "error";
  enabled: boolean;
}

const TASK_PRIORITY_COLORS = {
  "Baixa": "bg-green-100 text-green-800",
  "Média": "bg-yellow-100 text-yellow-800", 
  "Alta": "bg-red-100 text-red-800"
};

const TASK_STATUS_COLORS = {
  "Aberta": "bg-blue-100 text-blue-800",
  "Em progresso": "bg-orange-100 text-orange-800",
  "Concluída": "bg-green-100 text-green-800"
};

const ALERT_SEVERITY_ICONS = {
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle
};

const ALERT_SEVERITY_COLORS = {
  info: "bg-blue-100 text-blue-800",
  warn: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800"
};

export function TasksAlertsModal({ isOpen, onClose, clientId }: TasksAlertsModalProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isAlertFormOpen, setIsAlertFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingAlert, setEditingAlert] = useState<AlertRule | null>(null);
  const { toast } = useToast();

  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: "",
    description: "",
    due_date: "",
    owner: "",
    priority: "Média",
    status: "Aberta"
  });

  const [alertForm, setAlertForm] = useState<AlertFormData>({
    name: "",
    expression: "",
    severity: "warn",
    enabled: true
  });

  // Load tasks and alerts
  useEffect(() => {
    if (isOpen && clientId) {
      loadData();
    }
  }, [isOpen, clientId]);

  const loadData = async () => {
    try {
      const [tasksData, alertsData] = await Promise.all([
        taskOperations.getByClient(clientId),
        alertOperations.getByClient(clientId)
      ]);
      setTasks(tasksData);
      setAlerts(alertsData);
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar tarefas e alertas.",
        variant: "destructive"
      });
    }
  };

  // Task operations
  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O título da tarefa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingTask) {
        await taskOperations.update(editingTask.id, taskForm);
        toast({ title: "Tarefa atualizada com sucesso" });
      } else {
        await taskOperations.create({
          ...taskForm,
          client_id: clientId
        });
        toast({ title: "Tarefa criada com sucesso" });
      }
      
      await loadData();
      resetTaskForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar tarefa",
        description: "Ocorreu um erro ao salvar a tarefa.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskOperations.delete(taskId);
      toast({ title: "Tarefa excluída com sucesso" });
      await loadData();
    } catch (error) {
      toast({
        title: "Erro ao excluir tarefa",
        variant: "destructive"
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      due_date: task.due_date || "",
      owner: task.owner || "",
      priority: task.priority,
      status: task.status
    });
    setIsTaskFormOpen(true);
  };

  // Alert operations
  const handleSaveAlert = async () => {
    if (!alertForm.name.trim() || !alertForm.expression.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e expressão são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingAlert) {
        await alertOperations.update(editingAlert.id, alertForm);
        toast({ title: "Alerta atualizado com sucesso" });
      } else {
        await alertOperations.create({
          ...alertForm,
          client_id: clientId
        });
        toast({ title: "Alerta criado com sucesso" });
      }
      
      await loadData();
      resetAlertForm();
    } catch (error) {
      toast({
        title: "Erro ao salvar alerta",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertOperations.delete(alertId);
      toast({ title: "Alerta excluído com sucesso" });
      await loadData();
    } catch (error) {
      toast({
        title: "Erro ao excluir alerta",
        variant: "destructive"
      });
    }
  };

  const handleEditAlert = (alert: AlertRule) => {
    setEditingAlert(alert);
    setAlertForm({
      name: alert.name,
      expression: alert.expression,
      severity: alert.severity,
      enabled: alert.enabled
    });
    setIsAlertFormOpen(true);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      due_date: "",
      owner: "",
      priority: "Média",
      status: "Aberta"
    });
    setEditingTask(null);
    setIsTaskFormOpen(false);
  };

  const resetAlertForm = () => {
    setAlertForm({
      name: "",
      expression: "",
      severity: "warn",
      enabled: true
    });
    setEditingAlert(null);
    setIsAlertFormOpen(false);
  };

  const getNextTasks = () => {
    return tasks
      .filter(task => task.status !== "Concluída" && task.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 5);
  };

  return (
    <>
    <ModalFrameV2
      isOpen={isOpen}
      onClose={onClose}
      title="Tarefas & Alertas"
      maxWidth="4xl"
    >

        <Tabs defaultValue="tasks" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks" className="gap-2">
              <Calendar className="h-4 w-4" />
              Tarefas ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas ({alerts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="h-full">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Gerenciar Tarefas</h3>
              <Button onClick={() => setIsTaskFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Tarefa
              </Button>
            </div>

            <ScrollArea className="h-full">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <Card key={task.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge className={TASK_PRIORITY_COLORS[task.priority]}>
                              {task.priority}
                            </Badge>
                            <Badge className={TASK_STATUS_COLORS[task.status]}>
                              {task.status}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                            {task.owner && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {task.owner}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {tasks.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma tarefa cadastrada</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="alerts" className="h-full">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-medium">Regras de Alerta</h3>
              <Button onClick={() => setIsAlertFormOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Regra
              </Button>  
            </div>

            <ScrollArea className="h-full">
              <div className="space-y-4">
                {alerts.map((alert) => {
                  const IconComponent = ALERT_SEVERITY_ICONS[alert.severity];
                  return (
                    <Card key={alert.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <IconComponent className="h-4 w-4" />
                              <h4 className="font-medium">{alert.name}</h4>
                              <Badge className={ALERT_SEVERITY_COLORS[alert.severity]}>
                                {alert.severity}
                              </Badge>
                              {!alert.enabled && (
                                <Badge variant="secondary">Desabilitado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground font-mono">
                              {alert.expression}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditAlert(alert)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteAlert(alert.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {alerts.length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Nenhuma regra de alerta configurada</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Task Form Dialog */}
        <Dialog open={isTaskFormOpen} onOpenChange={resetTaskForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="task-title">Título *</Label>
                <Input
                  id="task-title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Digite o título da tarefa"
                />
              </div>
              <div>
                <Label htmlFor="task-description">Descrição</Label>
                <Textarea
                  id="task-description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva a tarefa..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-due">Data de Vencimento</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={taskForm.due_date}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="task-owner">Responsável</Label>
                  <Input
                    id="task-owner"
                    value={taskForm.owner}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, owner: e.target.value }))}
                    placeholder="Nome do responsável"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="task-priority">Prioridade</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(value: TaskPriority) => setTaskForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baixa">Baixa</SelectItem>
                      <SelectItem value="Média">Média</SelectItem>
                      <SelectItem value="Alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-status">Status</Label>
                  <Select
                    value={taskForm.status}
                    onValueChange={(value: TaskStatus) => setTaskForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aberta">Aberta</SelectItem>
                      <SelectItem value="Em progresso">Em progresso</SelectItem>
                      <SelectItem value="Concluída">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetTaskForm}>Cancelar</Button>
                <Button onClick={handleSaveTask}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alert Form Dialog */}
        <Dialog open={isAlertFormOpen} onOpenChange={resetAlertForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAlert ? "Editar Alerta" : "Nova Regra de Alerta"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="alert-name">Nome da Regra *</Label>
                <Input
                  id="alert-name"
                  value={alertForm.name}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: CPL Alto"
                />
              </div>
              <div>
                <Label htmlFor="alert-expression">Expressão *</Label>
                <Input
                  id="alert-expression"
                  value={alertForm.expression}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, expression: e.target.value }))}
                  placeholder="Ex: CPL > 100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Métricas disponíveis: CPL, CPA, ROAS, CTR, Clicks, Impressions, Leads, Revenue, Spend
                </p>
              </div>
              <div>
                <Label htmlFor="alert-severity">Severidade</Label>
                <Select
                  value={alertForm.severity}
                  onValueChange={(value: "info" | "warn" | "error") => setAlertForm(prev => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Aviso</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="alert-enabled"
                  checked={alertForm.enabled}
                  onChange={(e) => setAlertForm(prev => ({ ...prev, enabled: e.target.checked }))}
                />
                <Label htmlFor="alert-enabled">Habilitado</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetAlertForm}>Cancelar</Button>
                <Button onClick={handleSaveAlert}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </ModalFrameV2>
    </>
  );
}

// Hook to get next 5 tasks for overview display
export function useNextTasks(clientId: string) {
  const [nextTasks, setNextTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadNextTasks = async () => {
      if (!clientId) return;
      
      try {
        const allTasks = await taskOperations.getByClient(clientId);
        const upcoming = allTasks
          .filter(task => task.status !== "Concluída" && task.due_date)
          .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
          .slice(0, 5);
        setNextTasks(upcoming);
      } catch (error) {
        console.error('Failed to load next tasks:', error);
      }
    };

    loadNextTasks();
  }, [clientId]);

  return nextTasks;
}