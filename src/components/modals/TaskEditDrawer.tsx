import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Task, TaskStatus } from "@/types";
import { CalendarIcon, Save, X, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onDuplicate?: (task: Task) => Promise<void>;
  clients: any[];
}

export function TaskEditDrawer({ 
  open, 
  onOpenChange, 
  task, 
  onSave, 
  onDelete, 
  onDuplicate,
  clients 
}: TaskEditDrawerProps) {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (task && open) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        owner: task.owner || '',
        priority: task.priority || 'Média',
        client_id: task.client_id || '',
        status: task.status || 'Aberta',
      });
    }
  }, [task, open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === 'Escape') {
          onOpenChange(false);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, formData]);

  const handleSave = async () => {
    if (!task || !formData.title?.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      await onSave(task.id, formData);
      toast.success("Tarefa atualizada com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast.error("Erro ao salvar tarefa");
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    
    setIsDeleting(true);
    try {
      await onDelete(task.id);
      toast.success("Tarefa excluída com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast.error("Erro ao excluir tarefa");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!task || !onDuplicate) return;
    
    try {
      await onDuplicate(task);
      toast.success("Tarefa duplicada com sucesso");
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao duplicar tarefa:', error);
      toast.error("Erro ao duplicar tarefa");
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        due_date: format(date, 'yyyy-MM-dd')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        due_date: ''
      }));
    }
    setCalendarOpen(false);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Tarefa</SheetTitle>
          <SheetDescription>
            Faça alterações na tarefa. Pressione ESC para cancelar ou Ctrl+S para salvar.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título da tarefa"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição detalhada da tarefa"
              rows={3}
            />
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.due_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(new Date(formData.due_date), "PPP", { locale: pt })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date ? new Date(formData.due_date) : undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                />
                {formData.due_date && (
                  <div className="p-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleDateSelect(undefined)}
                    >
                      Limpar data
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="owner">Responsável</Label>
            <Input
              id="owner"
              value={formData.owner || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
              placeholder="Nome do responsável"
            />
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select 
              value={formData.priority || 'Média'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select 
              value={formData.client_id ?? 'none'} 
              onValueChange={(value) =>
                setFormData(prev => ({ ...prev, client_id: value === 'none' ? undefined : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente (opcional)" />
              </SelectTrigger>
              <SelectContent className="z-50">
                <SelectItem value="none">Nenhum cliente</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status/Coluna */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status || 'Aberta'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aberta">Planejamento</SelectItem>
                <SelectItem value="Em progresso">Execução</SelectItem>
                <SelectItem value="Concluída">Concluída</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 pt-4">
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={!formData.title?.trim()}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          <div className="flex gap-2">
            {onDuplicate && (
              <Button 
                variant="outline" 
                onClick={handleDuplicate}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}