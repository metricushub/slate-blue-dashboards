import { useState } from 'react';
import { Lead, LeadStage } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataSource } from '@/hooks/useDataSource';

interface NewLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => void;
}

const LEAD_STAGES: LeadStage[] = ["Novo", "Qualificação", "Proposta", "Fechado"];

export function NewLeadModal({ open, onOpenChange, onSave }: NewLeadModalProps) {
  const { dataSource } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    value: '',
    owner: '',
    stage: 'Novo' as LeadStage,
    notes: '',
    client_id: '',
  });

  // Carregar clientes quando o modal abre
  useState(() => {
    if (open && dataSource) {
      dataSource.getClients().then(setClients).catch(console.error);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      const leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        utm_source: formData.utm_source.trim() || undefined,
        utm_medium: formData.utm_medium.trim() || undefined,
        utm_campaign: formData.utm_campaign.trim() || undefined,
        utm_content: formData.utm_content.trim() || undefined,
        value: formData.value ? parseFloat(formData.value) : undefined,
        owner: formData.owner.trim() || undefined,
        stage: formData.stage,
        notes: formData.notes.trim() || undefined,
        client_id: formData.client_id || undefined,
      };

      await onSave(leadData);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar lead:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      value: '',
      owner: '',
      stage: 'Novo',
      notes: '',
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
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nome (obrigatório) */}
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome do lead"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            {/* Telefone */}
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            {/* Proprietário */}
            <div>
              <Label htmlFor="owner">Proprietário</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                placeholder="Responsável pelo lead"
              />
            </div>

            {/* Valor potencial */}
            <div>
              <Label htmlFor="value">Valor Potencial (R$)</Label>
              <Input
                id="value"
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) => handleInputChange('value', e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Estágio */}
            <div>
              <Label htmlFor="stage">Estágio</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => handleInputChange('stage', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {stage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <SelectValue placeholder="Selecionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum cliente</SelectItem>
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

          {/* UTM Parameters */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Parâmetros UTM</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="utm_source" className="text-xs text-muted-foreground">UTM Source</Label>
                <Input
                  id="utm_source"
                  value={formData.utm_source}
                  onChange={(e) => handleInputChange('utm_source', e.target.value)}
                  placeholder="google, facebook, email..."
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="utm_medium" className="text-xs text-muted-foreground">UTM Medium</Label>
                <Input
                  id="utm_medium"
                  value={formData.utm_medium}
                  onChange={(e) => handleInputChange('utm_medium', e.target.value)}
                  placeholder="cpc, organic, social..."
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="utm_campaign" className="text-xs text-muted-foreground">UTM Campaign</Label>
                <Input
                  id="utm_campaign"
                  value={formData.utm_campaign}
                  onChange={(e) => handleInputChange('utm_campaign', e.target.value)}
                  placeholder="spring-sale, brand-campaign..."
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="utm_content" className="text-xs text-muted-foreground">UTM Content</Label>
                <Input
                  id="utm_content"
                  value={formData.utm_content}
                  onChange={(e) => handleInputChange('utm_content', e.target.value)}
                  placeholder="logolink, textlink..."
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações sobre o lead..."
              rows={3}
            />
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
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Salvando...' : 'Criar Lead'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}