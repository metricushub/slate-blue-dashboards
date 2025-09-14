import { useState, useEffect } from 'react';
import { Note } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useDataSource } from '@/hooks/useDataSource';
import { X } from 'lucide-react';

interface NewNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: Omit<Note, 'id' | 'created_at'>) => void;
  initialData?: Note;
}

export function NewNoteModal({ open, onOpenChange, onSave, initialData }: NewNoteModalProps) {
  const { dataSource } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    client_id: '',
    tags: [] as string[],
    pinned: false,
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        content: initialData.content,
        client_id: initialData.client_id || '',
        tags: initialData.tags || [],
        pinned: initialData.pinned,
      });
    }
  }, [initialData]);

  // Load clients when modal opens
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
      const noteData: Omit<Note, 'id' | 'created_at'> = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        client_id: formData.client_id || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        pinned: formData.pinned,
        updated_at: new Date().toISOString()
      };

      await onSave(noteData);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar anotação:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      client_id: '',
      tags: [],
      pinned: false,
    });
    setTagInput('');
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Editar Anotação' : 'Nova Anotação'}</DialogTitle>
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
                placeholder="Título da anotação"
                required
              />
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
            <div>
              <Label htmlFor="tags">Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Digite uma tag e pressione Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim()}
                  >
                    Adicionar
                  </Button>
                </div>
                
                {/* Display tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-sm">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdo */}
            <div>
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Escreva o conteúdo da anotação... (suporta markdown básico)"
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Suporte básico a markdown: **negrito**, *itálico*, - listas, etc.
              </p>
            </div>

            {/* Fixar no topo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.pinned}
                onChange={(e) => handleInputChange('pinned', e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="pinned" className="text-sm">
                Fixar no topo da lista
              </Label>
            </div>
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
              {loading ? 'Salvando...' : (initialData ? 'Atualizar' : 'Criar Anotação')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}