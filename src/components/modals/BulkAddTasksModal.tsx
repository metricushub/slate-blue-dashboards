import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  const [defaultDueDate, setDefaultDueDate] = useState<string>('');
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

  const parseInput = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const tasks: ParsedTask[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let title = trimmed;
      let due_date: string | undefined;
      let priority: TaskPriority | undefined;
      let tags: string[] = [];

      // Extract due date (@YYYY-MM-DD or @DD/MM/YYYY or @DD/MM)
      const dateMatch = title.match(/@(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\/\d{1,2})/);
      if (dateMatch) {
        let dateStr = dateMatch[1];
        
        // Convert DD/MM format to current year
        if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
          const currentYear = new Date().getFullYear();
          dateStr = dateStr + '/' + currentYear;
        }
        
        // Convert DD/MM/YYYY to YYYY-MM-DD
        if (dateStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
          const parts = dateStr.split('/');
          due_date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          due_date = dateStr;
        }
        
        title = title.replace(dateMatch[0], '').trim();
      }

      // Extract priority (!alta, !media, !baixa)
      const priorityMatch = title.match(/!(alta|media|média|baixa)/i);
      if (priorityMatch) {
        const p = priorityMatch[1].toLowerCase();
        priority = p === 'alta' ? 'Alta' : p === 'media' || p === 'média' ? 'Média' : 'Baixa';
        title = title.replace(priorityMatch[0], '').trim();
      }

      // Extract tags (#tag1 #tag2)
      const tagMatches = title.match(/#\w+/g);
      if (tagMatches) {
        tags = tagMatches.map(tag => tag.substring(1));
        tagMatches.forEach(tag => {
          title = title.replace(tag, '').trim();
        });
      }

      if (title) {
        tasks.push({
          title: title.replace(/\s+/g, ' ').trim(),
          due_date,
          priority,
          tags: tags.length > 0 ? tags : undefined,
        });
      }
    });

    setParsedTasks(tasks);
  };

  const handleCreateTasks = async () => {
    if (parsedTasks.length === 0) return;
    
    setLoading(true);
    try {
      const createdTasks: Task[] = [];
      
      for (const parsedTask of parsedTasks) {
        const task = await taskOperations.create({
          title: parsedTask.title,
          priority: parsedTask.priority || 'Média',
          status: 'Aberta',
          client_id: parsedTask.client_id || defaultClient || undefined,
          due_date: parsedTask.due_date || defaultDueDate || undefined,
          tags: parsedTask.tags || undefined
        });
        createdTasks.push(task);
      }
      
      onTasksCreated(createdTasks);
      
      toast({
        title: "Tarefas criadas",
        description: `${createdTasks.length} tarefa${createdTasks.length !== 1 ? 's' : ''} criada${createdTasks.length !== 1 ? 's' : ''} com sucesso`
      });
      
      handleClose();
    } catch (error) {
      console.error('Error creating tasks:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setInputText('');
    setParsedTasks([]);
    setDefaultClient('');
    setDefaultDueDate('');
  };

  const removeTask = (index: number) => {
    setParsedTasks(prev => prev.filter((_, i) => i !== index));
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Cliente não encontrado';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Tarefas em Lote
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4">
          {/* Default Settings */}
          <Card className="p-4 bg-muted/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                <Label className="text-sm font-medium">Configurações Padrão</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Default Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="defaultDueDate" className="text-xs">Data padrão (opcional)</Label>
                  <Input
                    id="defaultDueDate"
                    type="date"
                    value={defaultDueDate}
                    onChange={(e) => setDefaultDueDate(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Default Client */}
                {clients.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="defaultClient" className="text-xs">Cliente padrão (opcional)</Label>
                    <Select value={defaultClient} onValueChange={setDefaultClient}>
                      <SelectTrigger className="text-sm">
                        <SelectValue placeholder="Selecionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum cliente</SelectItem>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                As configurações padrão serão aplicadas às tarefas que não especificarem esses campos.
              </p>
            </div>
          </Card>

          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="taskInput">Tarefas (uma por linha)</Label>
              {inputText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => parseInput(inputText)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar ({inputText.split('\n').filter(l => l.trim()).length})
                </Button>
              )}
            </div>
            
            <Textarea
              id="taskInput"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Digite uma tarefa por linha. Exemplo:&#10;Revisar proposta @25/12 !alta #urgente&#10;Ligar para cliente @amanha&#10;Preparar apresentação !media"
              rows={8}
              className="font-mono text-sm"
            />
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div><strong>Formatação:</strong></div>
              <div>• <code>@25/12</code> ou <code>@2024-12-25</code> = data de vencimento</div>
              <div>• <code>!alta</code>, <code>!media</code>, <code>!baixa</code> = prioridade</div>
              <div>• <code>#tag1 #tag2</code> = etiquetas</div>
            </div>
          </div>

          {/* Preview */}
          {parsedTasks.length > 0 && (
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <Label className="font-medium">Preview - {parsedTasks.length} tarefa{parsedTasks.length !== 1 ? 's' : ''} será{parsedTasks.length !== 1 ? 'm' : ''} criada{parsedTasks.length !== 1 ? 's' : ''}</Label>
                  </div>
                  <Badge variant="secondary">{parsedTasks.length}</Badge>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {parsedTasks.map((task, index) => (
                    <div key={index} className="flex items-start justify-between p-3 bg-muted/50 rounded-md">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{task.title}</span>
                          {task.priority && (
                            <Badge variant={task.priority === 'Alta' ? 'destructive' : 'secondary'} className="text-xs">
                              {task.priority}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div>📅 Vencimento: {task.due_date || defaultDueDate || 'Sem prazo'}</div>
                          {(task.client_id || defaultClient) && (
                            <div>👤 Cliente: {getClientName(task.client_id || defaultClient)}</div>
                          )}
                          <div>⚡ Prioridade: {task.priority || 'Média'}</div>
                          {task.tags && task.tags.length > 0 && (
                            <div>🏷️ Tags: {task.tags.join(', ')}</div>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="button" 
              onClick={handleCreateTasks}
              disabled={parsedTasks.length === 0 || loading}
            >
              {loading ? "Criando..." : `Criar ${parsedTasks.length} tarefa${parsedTasks.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}