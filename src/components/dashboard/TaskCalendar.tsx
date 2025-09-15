import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, TaskStatus } from "@/types";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  Target
} from "lucide-react";

interface TaskCalendarProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskDateChange: (taskId: string, newDate: string) => void;
  clients: any[];
}

type CalendarView = 'month' | 'week' | 'day';

export function TaskCalendar({ tasks, onTaskClick, onTaskDateChange, clients }: TaskCalendarProps) {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const dragRef = useRef<string | null>(null);

  const getClientName = (clientId?: string) => {
    if (!clientId) return null;
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 border-red-300 text-red-700';
      case 'Média': return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      case 'Baixa': return 'bg-green-100 border-green-300 text-green-700';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start on Sunday
    
    const days = [];
    const current = new Date(startDate);
    
    // Get 6 weeks (42 days) to fill calendar grid
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return { days, firstDay, lastDay };
  };

  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(startOfWeek);
      current.setDate(startOfWeek.getDate() + i);
      days.push(current);
    }
    return days;
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = formatDateForInput(date);
    return tasks.filter(task => task.due_date === dateStr && !task.archived_at);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    dragRef.current = taskId;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    if (dragRef.current) {
      const newDate = formatDateForInput(date);
      onTaskDateChange(dragRef.current, newDate);
      dragRef.current = null;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const renderMonthView = () => {
    const { days, firstDay, lastDay } = getDaysInMonth(currentDate);
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Week headers */}
        {weekDays.map(day => (
          <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground bg-muted/30">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map((day, index) => {
          const isCurrentMonth = day >= firstDay && day <= lastDay;
          const isToday = day.toDateString() === new Date().toDateString();
          const dayTasks = getTasksForDate(day);
          
          return (
            <div
              key={index}
              className={`min-h-24 p-1 border border-border ${
                !isCurrentMonth ? 'bg-muted/20 text-muted-foreground' : 'bg-background'
              } ${isToday ? 'bg-primary/10 border-primary' : ''}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, day)}
            >
              <div className="text-xs font-medium mb-1 text-center">
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onTaskClick(task)}
                    className={`text-xs p-1 rounded cursor-pointer hover:shadow-sm ${getPriorityColor(task.priority)} border`}
                    title={task.title}
                  >
                    <div className="truncate font-medium">{task.title}</div>
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground text-center">
                    +{dayTasks.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const weekDayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const isToday = day.toDateString() === new Date().toDateString();
          const dayTasks = getTasksForDate(day);
          
          return (
            <div key={index} className="space-y-2">
              <div className={`p-2 text-center border rounded ${isToday ? 'bg-primary/10 border-primary' : 'bg-muted/30'}`}>
                <div className="font-medium">{weekDayNames[index]}</div>
                <div className="text-lg">{day.getDate()}</div>
              </div>
              
              <div
                className="min-h-96 p-2 border border-dashed border-border rounded bg-background"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, day)}
              >
                <div className="space-y-2">
                  {dayTasks.map(task => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onTaskClick(task)}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-2">
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm truncate">{task.title}</h4>
                          <div className="flex items-center gap-1">
                            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </Badge>
                          </div>
                          {task.client_id && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span className="truncate">{getClientName(task.client_id)}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);
    const isToday = currentDate.toDateString() === new Date().toDateString();
    
    return (
      <div className="space-y-4">
        <div className={`p-4 text-center border rounded ${isToday ? 'bg-primary/10 border-primary' : 'bg-muted/30'}`}>
          <div className="text-2xl font-bold">
            {currentDate.toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        
        <div
          className="min-h-96 p-4 border border-dashed border-border rounded bg-background"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, currentDate)}
        >
          {dayTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Nenhuma tarefa para hoje</p>
              <p className="text-sm">Arraste tarefas aqui para agendar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayTasks.map(task => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{task.title}</h4>
                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3">
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge variant="outline">{task.status}</Badge>
                          {task.client_id && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>{getClientName(task.client_id)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getDateRangeText = () => {
    switch (view) {
      case 'month':
        return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'week':
        const weekDays = getWeekDays(currentDate);
        const start = weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const end = weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${start} - ${end}`;
      case 'day':
        return currentDate.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      default:
        return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Calendário</h3>
          <Select value={view} onValueChange={(value: CalendarView) => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Dia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="px-4 py-2 min-w-48 text-center font-medium">
            {getDateRangeText()}
          </div>
          
          <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Hoje
          </Button>
        </div>
      </div>

      {/* Calendar Content */}
      <Card>
        <CardContent className="p-4">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </CardContent>
      </Card>
      
      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
          <span>Alta prioridade</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
          <span>Média prioridade</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
          <span>Baixa prioridade</span>
        </div>
        <div className="ml-4">
          <Target className="h-3 w-3 inline mr-1" />
          <span>Arraste para reagendar</span>
        </div>
      </div>
    </div>
  );
}