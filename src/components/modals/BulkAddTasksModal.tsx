import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useDataSource } from "@/hooks/useDataSource";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { taskOperations } from "@/shared/db/dashboardStore";
import { Calendar, Flag, Hash, Plus, Eye, X } from "lucide-react";

interface ParsedTask {
  title: string;
  due_date?: string;
  priority?: TaskPriority;
  tags?: string[];
  client_id?: string;
}

interface BulkAddTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTasksCreated: (tasks: Task[]) => void;
}

export function BulkAddTasksModal({ open, onOpenChange, onTasksCreated }: BulkAddTasksModalProps) {
  const { toast } = useToast();
  const { dataSource } = useDataSource();
  
  const [inputText, setInputText] = useState('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [defaultClient, setDefaultClient] = useState<string>('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    if (dataSource) {
      try {
        const clientsData = await dataSource.getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    }
  };

  const parseInput = () => {
    const lines = inputText.split('\n').filter(line => line.trim());
    const tasks: ParsedTask[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let title = trimmed;
      let due_date: string | undefined;
      let priority: TaskPriority | undefined;
      let tags: string[] = [];

      // Parse @data (formato DD/MM/YYYY ou DD/MM)
      const dateMatch = title.match(/@(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
      if (dateMatch) {
        const dateStr = dateMatch[1];
        let parsedDate = dateStr;
        
        // Add current year if not provided
        if (!dateStr.includes('/')) {
          // Just day/month
          const currentYear = new Date().getFullYear();
          parsedDate = `${dateStr}/${currentYear}`;
        } else if (dateStr.split('/').length === 2) {
          // Day/month without year
          const currentYear = new Date().getFullYear();
          parsedDate = `${dateStr}/${currentYear}`;
        }
        
        // Convert to ISO format
        const [day, month, year] = parsedDate.split('/');
        due_date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString().split('T')[0];
        title = title.replace(dateMatch[0], '').trim();
      }

      // Parse !prioridade
      const priorityMatch = title.match(/!(alta|média|media|baixa)/i);
      if (priorityMatch) {
        const p = priorityMatch[1].toLowerCase();
        priority = p === 'alta' ? 'Alta' : p === 'média' || p === 'media' ? 'Média' : 'Baixa';
        title = title.replace(priorityMatch[0], '').trim();
      }

      // Parse #tags
      const tagMatches = title.matchAll(/#(\w+)/g);
      for (const match of tagMatches) {
        tags.push(match[1]);
        title = title.replace(match[0], '').trim();
      }

      if (title) {
        tasks.push({
          title,
          due_date,
          priority,
          tags: tags.length > 0 ? tags : undefined,
          client_id: defaultClient || undefined
        });
      }
    });

    setParsedTasks(tasks);
  };

  React.useEffect(() => {
    if (inputText.trim()) {
      parseInput();
    } else {
      setParsedTasks([]);
    }
  }, [inputText, defaultClient]);

  const handleCreateTasks = async () => {
    if (parsedTasks.length === 0) return;

    setLoading(true);
    try {
      const createdTasks: Task[] = [];
      
      for (const parsedTask of parsedTasks) {
        const taskData = {
          title: parsedTask.title,
          description: parsedTask.tags?.length ? `Tags: ${parsedTask.tags.join(', ')}` : undefined,
          client_id: parsedTask.client_id,
          status: 'Aberta' as TaskStatus,
          priority: parsedTask.priority || 'Média' as TaskPriority,
          due_date: parsedTask.due_date
        };
        
        const newTask = await taskOperations.create(taskData);
        createdTasks.push(newTask);
      }

      onTasksCreated(createdTasks);
      
      toast({
        title: "Tarefas criadas",
        description: `${createdTasks.length} tarefa(s) criada(s) com sucesso`
      });

      // Reset form
      setInputText('');
      setParsedTasks([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar tarefas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, i) => i !== index));
    // Also update input text
    const lines = inputText.split('\n');
    const filteredLines = lines.filter((_, i) => i !== index);
    setInputText(filteredLines.join('\n'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Tarefas em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Cliente Padrão (opcional)
              </label>
              <Select value={defaultClient} onValueChange={setDefaultClient}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-sm font-medium mb-2 block">
                Tarefas (uma por linha)
              </label>
              <Textarea
                placeholder={`Digite suas tarefas, uma por linha:

Revisar campanhas de Black Friday @25/11 !alta #marketing
Configurar tracking #analytics
Otimizar landing pages !média
Análise de concorrência @30/11 #pesquisa

Formato:
@DD/MM ou @DD/MM/YYYY = data
!alta, !média, !baixa = prioridade
#tag = tags`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 min-h-[200px] resize-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">
                Preview ({parsedTasks.length} tarefa(s))
              </span>
            </div>
            
            <div className="flex-1 border rounded-lg p-3 overflow-y-auto">
              {parsedTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Digite tarefas à esquerda</p>
                  <p className="text-xs">Use @data, !prioridade, #tags</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {parsedTasks.map((task, index) => (
                    <Card key={index} className="p-3 relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTask(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <CardContent className="p-0">
                        <div className="font-medium text-sm mb-2">{task.title}</div>
                        
                        <div className="flex flex-wrap gap-1 text-xs">
                          {task.due_date && (
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                          
                          {task.priority && (
                            <Badge 
                              variant={
                                task.priority === 'Alta' ? 'destructive' :
                                task.priority === 'Média' ? 'default' : 'secondary'
                              }
                              className="gap-1"
                            >
                              <Flag className="h-3 w-3" />
                              {task.priority}
                            </Badge>
                          )}
                          
                          {task.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="gap-1">
                              <Hash className="h-3 w-3" />
                              {tag}
                            </Badge>
                          ))}
                          
                          {task.client_id && (
                            <Badge variant="outline">
                              {clients.find(c => c.id === task.client_id)?.name || 'Cliente'}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {parsedTasks.length > 0 && `${parsedTasks.length} tarefa(s) pronta(s) para criar`}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateTasks}
              disabled={parsedTasks.length === 0 || loading}
            >
              {loading ? 'Criando...' : `Criar ${parsedTasks.length} Tarefa(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}