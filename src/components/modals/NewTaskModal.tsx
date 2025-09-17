import { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataSource } from '@/hooks/useDataSource';

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (task: Omit<Task, 'id' | 'created_at'>) => void;
  initialData?: Task;
  initialStatus?: TaskStatus;
}

const TASK_PRIORITIES: TaskPriority[] = ["Baixa", "Média", "Alta"];
const TASK_STATUS: TaskStatus[] = ["Aberta", "Em progresso", "Concluída"];

export function NewTaskModal({ open, onOpenChange, onSave, initialData, initialStatus }: NewTaskModalProps) {
  const { dataSource } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    owner: '',
    priority: 'Média' as TaskPriority,
    status: 'Aberta' as TaskStatus,
    client_id: '',
  });

  // Load initial data if editing or set initial status
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        due_date: initialData.due_date || '',
        owner: initialData.owner || '',
        priority: initialData.priority,
        status: initialData.status,
        client_id: initialData.client_id || '',
      });
    } else if (initialStatus && open) {
      // Set initial status for new tasks from Kanban
      setFormData(prev => ({
        ...prev,
        status: initialStatus
      }));
    }
  }, [initialData, initialStatus, open]);

  // Carregar clientes quando o modal abre
  useEffect(() => {
    if (open && dataSource) {
      dataSource.getClients().then(setClients).catch(console.error);
    }
  }, [open, dataSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const taskData: Omit<Task, 'id' | 'created_at'> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        due_date: formData.due_date || undefined,
        owner: formData.owner.trim() || undefined,
        priority: formData.priority,
        status: formData.status,
        client_id: formData.client_id || undefined,
        updated_at: new Date().toISOString()
      };

      await onSave(taskData);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      due_date: '',
      owner: '',
      priority: 'Média',
      status: initialStatus || 'Aberta', // Use initialStatus if provided
      client_id: '',
    });
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Título (obrigatório) */}
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título da tarefa"
                required
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Detalhes da tarefa..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de vencimento */}
              <div>
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                />
              </div>

              {/* Responsável */}
              <div>
                <Label htmlFor="owner">Responsável</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  placeholder="Nome do responsável"
                />
              </div>

              {/* Prioridade */}
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cliente vinculado */}
            {clients.length > 0 && (
              <div>
                <Label htmlFor="client_id">Cliente</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(value) => handleInputChange('client_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar cliente (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.filter((c) => c && c.id && String(c.id).trim() !== '').map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title.trim()}
            >
              {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar Tarefa')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}