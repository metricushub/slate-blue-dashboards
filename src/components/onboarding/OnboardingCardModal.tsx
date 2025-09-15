import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OnboardingCard } from '@/shared/db/onboardingStore';
import { Plus, X } from 'lucide-react';

interface OnboardingCardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (card: Omit<OnboardingCard, 'id' | 'created_at' | 'updated_at'> | Partial<OnboardingCard>) => void;
  initialData?: OnboardingCard | null;
  clientId?: string;
}

// Mock clients for demonstration
const MOCK_CLIENTS = [
  { id: '1', name: 'Empresa A' },
  { id: '2', name: 'Empresa B' },
  { id: '3', name: 'Empresa C' },
];

const RESPONSAVEIS = ['João Silva', 'Maria Santos', 'Pedro Costa', 'Ana Lima'];

const STAGES = [
  { value: 'dados-gerais', label: 'Dados gerais' },
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'implementacao', label: 'Implementação Cliente' },
  { value: 'briefing', label: 'Briefing & 1º Contato/Reuniões' },
  { value: 'configuracao', label: 'Reunião de Configuração — Informações Necessárias' },
];

export function OnboardingCardModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  clientId,
}: OnboardingCardModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    clientId: clientId || '',
    clientName: '',
    responsavel: '',
    vencimento: '',
    checklist: [] as string[],
    notas: '',
    stage: 'dados-gerais' as OnboardingCard['stage'],
    subStage: undefined as OnboardingCard['subStage'],
  });
  
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (initialData) {
      const selectedClient = MOCK_CLIENTS.find(c => c.id === initialData.clientId);
      setFormData({
        title: initialData.title,
        clientId: initialData.clientId || clientId || '',
        clientName: initialData.clientName || selectedClient?.name || '',
        responsavel: initialData.responsavel,
        vencimento: initialData.vencimento || '',
        checklist: [...initialData.checklist],
        notas: initialData.notas,
        stage: initialData.stage,
        subStage: initialData.subStage,
      });
    } else {
      // Reset form for new card
      const selectedClient = clientId ? MOCK_CLIENTS.find(c => c.id === clientId) : null;
      setFormData({
        title: '',
        clientId: clientId || '',
        clientName: selectedClient?.name || '',
        responsavel: '',
        vencimento: '',
        checklist: [],
        notas: '',
        stage: 'dados-gerais',
        subStage: undefined,
      });
    }
    setNewChecklistItem('');
  }, [initialData, clientId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    onSave({
      ...formData,
      checklist: formData.checklist,
    });
    onOpenChange(false);
  };

  const handleClientChange = (selectedClientId: string) => {
    const selectedClient = MOCK_CLIENTS.find(c => c.id === selectedClientId);
    setFormData(prev => ({
      ...prev,
      clientId: selectedClientId,
      clientName: selectedClient?.name || '',
    }));
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [...prev.checklist, newChecklistItem.trim()],
      }));
      setNewChecklistItem('');
    }
  };

  const removeChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index),
    }));
  };

  const toggleChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => 
        i === index 
          ? item.startsWith('✓') 
            ? item.slice(2) 
            : `✓ ${item}`
          : item
      ),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Card' : 'Novo Card de Onboarding'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título do card..."
              required
            />
          </div>

          {/* Client Selection (only if not in client view) */}
          {!clientId && (
            <div className="space-y-2">
              <Label htmlFor="client">Cliente</Label>
              <Select value={formData.clientId} onValueChange={handleClientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_CLIENTS.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Select value={formData.responsavel} onValueChange={(value) => setFormData(prev => ({ ...prev, responsavel: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o responsável" />
              </SelectTrigger>
              <SelectContent>
                {RESPONSAVEIS.map((responsavel) => (
                  <SelectItem key={responsavel} value={responsavel}>
                    {responsavel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage */}
          <div className="space-y-2">
            <Label htmlFor="stage">Etapa</Label>
            <Select value={formData.stage} onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as OnboardingCard['stage'] }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sub-stage for Financeiro */}
          {formData.stage === 'financeiro' && (
            <div className="space-y-2">
              <Label htmlFor="subStage">Sub-etapa</Label>
              <Select value={formData.subStage ?? 'none'} onValueChange={(value) => setFormData(prev => ({ ...prev, subStage: value === 'none' ? undefined : (value as OnboardingCard['subStage']) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a sub-etapa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Etapa principal</SelectItem>
                  <SelectItem value="2.1-cadastrar-financeiro">2.1 Cadastrar no financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="vencimento">Data de Vencimento</Label>
            <Input
              id="vencimento"
              type="date"
              value={formData.vencimento}
              onChange={(e) => setFormData(prev => ({ ...prev, vencimento: e.target.value }))}
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <Label>Checklist</Label>
            <div className="space-y-2">
              {formData.checklist.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`flex-shrink-0 ${item.startsWith('✓') ? 'text-green-600' : ''}`}
                    onClick={() => toggleChecklistItem(index)}
                  >
                    {item.startsWith('✓') ? '✓' : '○'}
                  </Button>
                  <span className={`flex-1 text-sm ${item.startsWith('✓') ? 'line-through text-muted-foreground' : ''}`}>
                    {item.startsWith('✓') ? item.slice(2) : item}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-destructive"
                    onClick={() => removeChecklistItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  placeholder="Nova tarefa..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addChecklistItem())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notas">Observações</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!formData.title.trim()}>
              {initialData ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}