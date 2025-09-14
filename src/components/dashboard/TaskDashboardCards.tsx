import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Task } from "@/types";
import { Calendar, Clock, Target, CheckCircle } from "lucide-react";

interface TaskDashboardCardsProps {
  tasks: Task[];
}

export function TaskDashboardCards({ tasks }: TaskDashboardCardsProps) {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate metrics
  const dueTodayTasks = tasks.filter(task => 
    task.due_date === today && task.status !== 'Concluída' && !task.archived_at
  );
  
  const overdueTasks = tasks.filter(task => 
    task.due_date && task.due_date < today && task.status !== 'Concluída' && !task.archived_at
  );
  
  const inProgressTasks = tasks.filter(task => 
    task.status === 'Em progresso' && !task.archived_at
  );
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const weeklyPlanningTasks = tasks.filter(task => {
    if (!task.due_date || task.archived_at) return false;
    const dueDate = new Date(task.due_date);
    return dueDate >= weekStart && dueDate <= weekEnd && task.status === 'Aberta';
  });

  const cards = [
    {
      title: "Vencem Hoje",
      count: dueTodayTasks.length,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Atrasadas",
      count: overdueTasks.length,
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Em Execução",
      count: inProgressTasks.length,
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Planejamento (Semana)",
      count: weeklyPlanningTasks.length,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, count, icon: Icon, color, bgColor }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className={`${bgColor} p-2 rounded-md`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{count}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}