import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, AlertCircle, Plus, Calendar } from 'lucide-react';
import { format, isToday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeDataSummary } from '@/shared/hooks/useHomeData';
import { taskOperations } from '@/shared/db/dashboardStore';
import { Task } from '@/types';
import { toast } from '@/hooks/use-toast';

interface TasksInboxProps {
  tasks: HomeDataSummary['tasks'];
  clientNames: Record<string, string>;
  onRefresh: () => void;
}

export const TasksInbox = ({ tasks, clientNames, onRefresh }: TasksInboxProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [showNewTask, setShowNewTask] = useState(false);

  const handleCompleteTask = async (taskId: string) => {
    try {
      await taskOperations.update(taskId, { 
        status: 'Concluída',
        updated_at: new Date().toISOString()
      });
      onRefresh();
      toast({
        title: "Sucesso",
        description: "Tarefa marcada como concluída",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tarefa",
        variant: "destructive",
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !selectedClient) return;

    try {
      await taskOperations.create({
        client_id: selectedClient,
        title: newTaskTitle.trim(),
        priority: 'Média',
        status: 'Aberta',
        due_date: new Date().toISOString().split('T')[0] // today
      });
      
      setNewTaskTitle('');
      setSelectedClient('');
      setShowNewTask(false);
      onRefresh();
      
      toast({
        title: "Sucesso",
        description: "Nova tarefa criada",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefa",
        variant: "destructive",
      });
    }
  };

  const renderTaskItem = (task: Task, section: string) => {
    const isOverdue = isPast(new Date(task.due_date || '')) && !isToday(new Date(task.due_date || ''));
    
    return (
      <div
        key={task.id}
        className={`
          flex items-center gap-3 p-3 rounded-lg border 
          ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'hover:bg-muted/50'}
          transition-colors
        `}
      >
        <Checkbox
          checked={false}
          onCheckedChange={() => handleCompleteTask(task.id)}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{task.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {clientNames[task.client_id] || 'Cliente'}
            </Badge>
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(task.due_date), 'dd/MM', { locale: ptBR })}
              </div>
            )}
            <Badge 
              variant={task.priority === 'Alta' ? 'destructive' : task.priority === 'Média' ? 'outline' : 'secondary'}
              className="text-xs"
            >
              {task.priority}
            </Badge>
          </div>
        </div>
        {isOverdue && <AlertCircle className="h-4 w-4 text-destructive" />}
      </div>
    );
  };

  const clientOptions = Object.keys(tasks.byClient);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Inbox de Tarefas
            <Badge variant="secondary">{tasks.total}</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewTask(!showNewTask)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Task Creation */}
        {showNewTask && (
          <div className="p-3 border rounded-lg bg-muted/50 space-y-3">
            <Input
              placeholder="Título da tarefa..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            <div className="flex gap-2">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientOptions.map(clientId => (
                    <SelectItem key={clientId} value={clientId}>
                      {clientNames[clientId] || 'Cliente sem nome'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateTask} disabled={!newTaskTitle.trim() || !selectedClient}>
                Criar
              </Button>
            </div>
          </div>
        )}

        {/* Overdue Tasks */}
        {tasks.overdue.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h3 className="font-medium text-sm">Vencidas ({tasks.overdue.length})</h3>
            </div>
            <div className="space-y-2">
              {tasks.overdue.slice(0, 5).map(task => renderTaskItem(task, 'overdue'))}
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        {tasks.today.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Hoje ({tasks.today.length})</h3>
            </div>
            <div className="space-y-2">
              {tasks.today.slice(0, 5).map(task => renderTaskItem(task, 'today'))}
            </div>
          </div>
        )}

        {/* Upcoming Tasks */}
        {tasks.upcoming.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Próximos 7 dias ({tasks.upcoming.length})</h3>
            </div>
            <div className="space-y-2">
              {tasks.upcoming.slice(0, 5).map(task => renderTaskItem(task, 'upcoming'))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {tasks.total === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa pendente</p>
            <p className="text-sm">Todas as tarefas foram concluídas</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};