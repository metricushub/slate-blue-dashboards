import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useDataSource } from "@/hooks/useDataSource";
import { Task, TaskPriority, TaskStatus } from "@/types";
import { Calendar, User, Flag, Hash, X } from "lucide-react";

interface TaskEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Task) => void;
  task: Task | null;
}

export function TaskEditModal({ open, onOpenChange, onSave, task }: TaskEditModalProps) {
  const { dataSource } = useDataSource();
  const [clients, setClients] = useState<any[]>([]);
  const [tags, setTags] = useState<string>('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    owner: '',
    priority: 'Média' as TaskPriority,
    status: 'Aberta' as TaskStatus,
    client_id: ''
  });

  useEffect(() => {
    if (open && task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        due_date: task.due_date || '',
        owner: task.owner || '',
        priority: task.priority,
        status: task.status,
        client_id: task.client_id || ''
      });
      // Convert tags array to string
      setTags(task.tags?.join(', ') || '');
      loadClients();
    }
  }, [open, task]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !formData.title.trim()) return;

    // Parse tags from string to array
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);

    const updatedTask: Task = {
      ...task,
      ...formData,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
      updated_at: new Date().toISOString()
    };

    onSave(updatedTask);
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setFormData({
      title: '',
      description: '',
      due_date: '',
      owner: '',
      priority: 'Média',
      status: 'Aberta',
      client_id: ''
    });
    setTags('');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Editar Tarefa
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Digite o título da tarefa"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva a tarefa (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Priority */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">
                    <Badge variant="secondary" className="text-xs">Baixa</Badge>
                  </SelectItem>
                  <SelectItem value="Média">
                    <Badge variant="default" className="text-xs">Média</Badge>
                  </SelectItem>
                  <SelectItem value="Alta">
                    <Badge variant="destructive" className="text-xs">Alta</Badge>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
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

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Data de vencimento
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
            />
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label htmlFor="owner" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Responsável
            </Label>
            <Input
              id="owner"
              value={formData.owner}
              onChange={(e) => handleInputChange('owner', e.target.value)}
              placeholder="Nome do responsável (opcional)"
            />
          </div>

          {/* Client */}
          {clients.length > 0 && (
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={formData.client_id || "none"}
                onValueChange={(value) => handleInputChange('client_id', value === "none" ? "" : value)}
              >
                <SelectTrigger>
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

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-1">
              <Hash className="h-4 w-4" />
              Etiquetas
            </Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="tag1, tag2, tag3..."
            />
            <p className="text-xs text-muted-foreground">
              Separe as etiquetas por vírgula
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.title.trim()}
            >
              Salvar alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}