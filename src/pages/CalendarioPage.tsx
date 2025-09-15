import React, { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths, startOfDay, endOfDay, addWeeks, subWeeks, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List, Plus, Search, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from '@dnd-kit/core';
import { dashboardDb, taskOperations } from '@/shared/db/dashboardStore';
import { NewTaskModal } from '@/components/modals/NewTaskModal';
import { TaskEditDrawer } from '@/components/modals/TaskEditDrawer';
import { toast } from '@/hooks/use-toast';
import { Task, TaskStatus, TaskPriority } from '@/types/index';

interface Client {
  id: string;
  name: string;
}

type ViewType = 'month' | 'week' | 'day' | 'list';

const priorityColors = {
  'Baixa': 'bg-blue-500',
  'Média': 'bg-yellow-500', 
  'Alta': 'bg-orange-500',
};

const statusColors = {
  'Aberta': 'bg-gray-500',
  'Em progresso': 'bg-blue-500',
  'Concluída': 'bg-green-500',
};

function DraggableTask({ task, clients }: { task: Task; clients: Client[] }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const client = clients.find(c => c.id === task.client_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`text-xs p-1 rounded mb-1 cursor-move ${statusColors[task.status]} text-white truncate`}
      title={`${task.title} ${client ? `- ${client.name}` : ''}`}
    >
      {task.title.length > 15 ? `${task.title.substring(0, 15)}...` : task.title}
    </div>
  );
}

function DroppableDay({ date, tasks, clients, onTaskClick, onDayDoubleClick }: {
  date: Date;
  tasks: Task[];
  clients: Client[];
  onTaskClick: (task: Task) => void;
  onDayDoubleClick: (date: Date) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: format(date, 'yyyy-MM-dd'),
    data: { date }
  });

  const dayTasks = tasks.filter(task => 
    task.due_date && isSameDay(new Date(task.due_date), date)
  );

  const visibleTasks = dayTasks.slice(0, 3);
  const hiddenCount = dayTasks.length - 3;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] p-2 border border-border ${
        isToday(date) ? 'bg-primary/10 border-primary' : 'bg-card'
      } ${isOver ? 'bg-accent' : ''}`}
      onDoubleClick={() => onDayDoubleClick(date)}
    >
      <div className="font-medium text-sm mb-1">
        {format(date, 'd')}
      </div>
      
      <div className="space-y-1">
        {visibleTasks.map(task => (
          <div
            key={task.id}
            onClick={() => onTaskClick(task)}
            className={`text-xs p-1 rounded cursor-pointer ${statusColors[task.status]} text-white truncate hover:opacity-80`}
          >
            {task.title.length > 15 ? `${task.title.substring(0, 15)}...` : task.title}
          </div>
        ))}
        
        {hiddenCount > 0 && (
          <div className="text-xs text-muted-foreground">
            +{hiddenCount} mais
          </div>
        )}
      </div>
    </div>
  );
}

export default function CalendarioPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Modals
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskEditDrawerOpen, setIsTaskEditDrawerOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState<Date | null>(null);

  // Load data
  useEffect(() => {
    loadTasks();
    loadClients();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [tasks, searchQuery, selectedClient, selectedOwner, selectedPriority, selectedStatus, showCompleted]);

  const loadTasks = async () => {
    try {
      const allTasks = await dashboardDb.tasks.toArray();
      setTasks(allTasks);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    }
  };

  const loadClients = async () => {
    try {
      // Mock clients for now - replace with actual client data
      const mockClients: Client[] = [
        { id: '1', name: 'Cliente A' },
        { id: '2', name: 'Cliente B' },
        { id: '3', name: 'Cliente C' }
      ];
      setClients(mockClients);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    // Hide archived by default (filter completed tasks)
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'Concluída');
    }

    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClient !== 'all') {
      filtered = filtered.filter(task => task.client_id === selectedClient);
    }

    if (selectedOwner !== 'all') {
      filtered = filtered.filter(task => task.owner === selectedOwner);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === selectedPriority);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(task => task.status === selectedStatus);
    }

    setFilteredTasks(filtered);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newDate = over.id as string;
    
    try {
      await taskOperations.update(taskId, {
        due_date: newDate
      });
      
      await loadTasks();
      toast({
        title: "Tarefa atualizada",
        description: "Data de vencimento alterada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar a data da tarefa.",
        variant: "destructive"
      });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskEditDrawerOpen(true);
  };

  const handleDayDoubleClick = (date: Date) => {
    setNewTaskDate(date);
    setIsNewTaskModalOpen(true);
  };

  const handleTaskSave = async (taskData: any) => {
    try {
      if (selectedTask) {
        await taskOperations.update(selectedTask.id, taskData);
      } else {
        const newTask = {
          ...taskData,
          due_date: newTaskDate ? format(newTaskDate, 'yyyy-MM-dd') : taskData.due_date
        };
        await taskOperations.create(newTask);
      }
      
      await loadTasks();
      setSelectedTask(null);
      setNewTaskDate(null);
      setIsTaskEditDrawerOpen(false);
      setIsNewTaskModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: selectedTask ? "Tarefa atualizada!" : "Tarefa criada!"
      });
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a tarefa.",
        variant: "destructive"
      });
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await taskOperations.delete(taskId);
      await loadTasks();
      setSelectedTask(null);
      setIsTaskEditDrawerOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Tarefa excluída!"
      });
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a tarefa.",
        variant: "destructive"
      });
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else if (view === 'day') {
      setCurrentDate(direction === 'prev' ? addDays(currentDate, -1) : addDays(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const exportCSV = () => {
    const headers = ['Título', 'Descrição', 'Data de Vencimento', 'Status', 'Prioridade', 'Cliente', 'Responsável'];
    const csvContent = [
      headers.join(','),
      ...filteredTasks.map(task => [
        `"${task.title}"`,
        `"${task.description || ''}"`,
        task.due_date || '',
        task.status,
        task.priority,
        clients.find(c => c.id === task.client_id)?.name || '',
        task.owner || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarefas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getUniqueOwners = () => {
    return [...new Set(tasks.map(task => task.owner).filter(owner => owner && owner.trim() !== ''))];
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

    const days = [];
    let day = weekStart;
    while (day <= weekEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2">
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(dayName => (
            <div key={dayName} className="text-center font-medium text-sm p-2">
              {dayName}
            </div>
          ))}
          
          {days.map(day => (
            <div key={day.toString()} className="min-h-[200px]">
              <DroppableDay
                date={day}
                tasks={filteredTasks}
                clients={clients}
                onTaskClick={handleTaskClick}
                onDayDoubleClick={handleDayDoubleClick}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = filteredTasks.filter(task => 
      task.due_date && isSameDay(new Date(task.due_date), currentDate)
    );

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-card rounded-lg">
          <h2 className="text-lg font-semibold">
            {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: ptBR })}
          </h2>
        </div>
        
        <div className="grid gap-2">
          {dayTasks.length === 0 ? (
            <div 
              className="text-center text-muted-foreground p-8 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent"
              onDoubleClick={() => handleDayDoubleClick(currentDate)}
            >
              Nenhuma tarefa para hoje. Duplo clique para criar uma nova.
            </div>
          ) : (
            dayTasks.map(task => {
              const client = clients.find(c => c.id === task.client_id);
              return (
                <div
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className={`p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${statusColors[task.status]} text-white`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm opacity-90 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-white/20 px-2 py-1 rounded">
                          {task.priority}
                        </span>
                        {client && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded">
                            {client.name}
                          </span>
                        )}
                        {task.owner && (
                          <span className="text-xs bg-white/20 px-2 py-1 rounded">
                            {task.owner}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-border">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="bg-card p-2 text-center font-medium text-sm">
            {day}
          </div>
        ))}
        
        {days.map(day => (
          <DroppableDay
            key={day.toString()}
            date={day}
            tasks={filteredTasks}
            clients={clients}
            onTaskClick={handleTaskClick}
            onDayDoubleClick={handleDayDoubleClick}
          />
        ))}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Lista de Tarefas</h3>
          <Button onClick={exportCSV} size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
        
        {filteredTasks.map(task => {
          const client = clients.find(c => c.id === task.client_id);
          return (
            <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTaskClick(task)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={statusColors[task.status]}>
                        {task.status}
                      </Badge>
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      {client && (
                        <Badge variant="secondary">{client.name}</Badge>
                      )}
                      {task.owner && (
                        <Badge variant="secondary">{task.owner}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {task.due_date && (
                      <div className="text-sm">
                        {format(new Date(task.due_date), 'dd/MM/yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Calendário</h1>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="font-medium min-w-[200px] text-center">
              {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'dd MMMM yyyy', { locale: ptBR })}
            </div>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <Button onClick={() => setIsNewTaskModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedOwner} onValueChange={setSelectedOwner}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {getUniqueOwners().map(owner => (
                    <SelectItem key={owner} value={owner!}>{owner}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Aberta">Aberta</SelectItem>
                  <SelectItem value="Em progresso">Em progresso</SelectItem>
                  <SelectItem value="Concluída">Concluída</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-completed"
                  checked={showCompleted}
                  onCheckedChange={setShowCompleted}
                />
                <Label htmlFor="show-completed">Mostrar concluídas</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Views */}
        <Tabs value={view} onValueChange={(value) => setView(value as ViewType)}>
          <TabsList>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="list">Lista</TabsTrigger>
          </TabsList>
          
          <TabsContent value="month" className="mt-6">
            {renderMonthView()}
          </TabsContent>
          
          <TabsContent value="week" className="mt-6">
            {renderWeekView()}
          </TabsContent>
          
          <TabsContent value="day" className="mt-6">
            {renderDayView()}
          </TabsContent>
          
          <TabsContent value="list" className="mt-6">
            {renderListView()}
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <NewTaskModal
          open={isNewTaskModalOpen}
          onOpenChange={setIsNewTaskModalOpen}
          onSave={handleTaskSave}
          initialData={newTaskDate ? { 
            title: '',
            description: '',
            due_date: format(newTaskDate, 'yyyy-MM-dd'),
            owner: '',
            priority: 'Média' as TaskPriority,
            status: 'Aberta' as TaskStatus,
            id: '',
            created_at: '',
            client_id: ''
          } as Task : undefined}
        />

        <TaskEditDrawer
          open={isTaskEditDrawerOpen}
          onOpenChange={setIsTaskEditDrawerOpen}
          task={selectedTask}
          onSave={handleTaskSave}
          onDelete={handleTaskDelete}
          onDuplicate={async (task) => {
            setSelectedTask(null);
            setIsNewTaskModalOpen(true);
          }}
          clients={clients}
        />
      </div>
    </DndContext>
  );
}