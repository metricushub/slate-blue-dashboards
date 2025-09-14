import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Task } from "@/types";
import { AlertTriangle, CheckCircle, Clock, ExternalLink } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface TaskAlertsBannerProps {
  tasks: Task[];
  onCompleteTask: (taskId: string) => void;
  onPostponeTask: (taskId: string) => void;
}

export function TaskAlertsBanner({ tasks, onCompleteTask, onPostponeTask }: TaskAlertsBannerProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  
  // Get urgent tasks (due today + overdue)
  const urgentTasks = tasks
    .filter(task => {
      if (task.archived_at || task.status === 'Concluída') return false;
      if (!task.due_date) return false;
      return task.due_date <= today;
    })
    .sort((a, b) => {
      // Overdue first, then by due date
      if (a.due_date! < today && b.due_date! >= today) return -1;
      if (a.due_date! >= today && b.due_date! < today) return 1;
      return a.due_date!.localeCompare(b.due_date!);
    })
    .slice(0, 5);

  if (urgentTasks.length === 0) {
    return null;
  }

  const handleOpenTask = (task: Task) => {
    if (task.client_id) {
      navigate(`/cliente/${task.client_id}/overview`);
    }
  };

  const handlePostpone = (taskId: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    onPostponeTask(taskId);
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-700">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Prazo ({urgentTasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentTasks.map(task => {
          const isOverdue = task.due_date! < today;
          
          return (
            <div key={task.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{task.title}</h4>
                  <Badge variant={isOverdue ? "destructive" : "secondary"}>
                    {isOverdue ? "Atrasada" : "Vence hoje"}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(task.due_date!).toLocaleDateString('pt-BR')}
                  </div>
                  {task.owner && (
                    <span>{task.owner}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCompleteTask(task.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handlePostpone(task.id)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  +1d
                </Button>
                
                {task.client_id && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenTask(task)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}