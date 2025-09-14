import { useState, useEffect } from 'react';
import { Optimization, OptimizationStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataSource } from '@/hooks/useDataSource';

interface NewOptimizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (optimization: Omit<Optimization, 'id' | 'created_at'>) => void;
}

const OPTIMIZATION_STATUS: OptimizationStatus[] = ["Planejada", "Em teste", "Concluída", "Abortada"];
const OPTIMIZATION_TYPES = [
  "Landing Page",
  "Campanhas",
  "Criativos",
  "Públicos",
  "Bidding",
  "Keywords",
  "Estrutura",
  "Tracking",
  "Outros"
];

const TARGET_METRICS = [
  "CPL",
  "CPA", 
  "ROAS",
  "CTR",
  "Taxa de Conversão",
  "CPC",
  "CPM",
  "Volume de Leads",
  "Revenue",
  "Outros"
];

export function NewOptimizationModal({ open, onOpenChange, onSave }: NewOptimizationModalProps) {
  const { dataSource } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    objective: '',
    target_metric: '',
    hypothesis: '',
    start_date: '',
    review_date: '',
    expected_impact: '',
    status: 'Planejada' as OptimizationStatus,
    client_id: '',
  });

  // Carregar clientes quando o modal abre
  useEffect(() => {
    if (open && dataSource) {
      dataSource.getClients().then(setClients).catch(console.error);
    }
  }, [open, dataSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.client_id) {
      return;
    }

    setLoading(true);
    
    try {
      const optimizationData: Omit<Optimization, 'id' | 'created_at'> = {
        client_id: formData.client_id,
        title: formData.title.trim(),
        type: formData.type,
        objective: formData.objective.trim() || undefined,
        target_metric: formData.target_metric || undefined,
        hypothesis: formData.hypothesis.trim() || undefined,
        start_date: formData.start_date || new Date().toISOString(),
        review_date: formData.review_date || undefined,
        expected_impact: formData.expected_impact.trim() || undefined,
        status: formData.status,
        updated_at: new Date().toISOString()
      };

      await onSave(optimizationData);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar otimização:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      type: '',
      objective: '',
      target_metric: '',
      hypothesis: '',
      start_date: '',
      review_date: '',
      expected_impact: '',
      status: 'Planejada',
      client_id: '',
    });
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Otimização</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Cliente vinculado (obrigatório) */}
            <div>
              <Label htmlFor="client_id">Cliente *</Label>
              <Select
                value={formData.client_id}
                onValueChange={(value) => handleInputChange('client_id', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar cliente" />
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

            {/* Título (obrigatório) */}
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Título da otimização"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo */}
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTIMIZATION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Métrica Alvo */}
              <div>
                <Label htmlFor="target_metric">Métrica Alvo</Label>
                <Select
                  value={formData.target_metric}
                  onValueChange={(value) => handleInputChange('target_metric', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar métrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_METRICS.map(metric => (
                      <SelectItem key={metric} value={metric}>
                        {metric}
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
                    {OPTIMIZATION_STATUS.map(status => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data de Início */}
              <div>
                <Label htmlFor="start_date">Data de Início</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleInputChange('start_date', e.target.value)}
                />
              </div>
            </div>

            {/* Objetivo */}
            <div>
              <Label htmlFor="objective">Objetivo</Label>
              <Textarea
                id="objective"
                value={formData.objective}
                onChange={(e) => handleInputChange('objective', e.target.value)}
                placeholder="Descreva o objetivo da otimização..."
                rows={2}
              />
            </div>

            {/* Hipótese */}
            <div>
              <Label htmlFor="hypothesis">Hipótese</Label>
              <Textarea
                id="hypothesis"
                value={formData.hypothesis}
                onChange={(e) => handleInputChange('hypothesis', e.target.value)}
                placeholder="Qual a hipótese por trás desta otimização?"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data de Revisão */}
              <div>
                <Label htmlFor="review_date">Data de Revisão</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => handleInputChange('review_date', e.target.value)}
                />
              </div>

              {/* Impacto Esperado */}
              <div>
                <Label htmlFor="expected_impact">Impacto Esperado</Label>
                <Input
                  id="expected_impact"
                  value={formData.expected_impact}
                  onChange={(e) => handleInputChange('expected_impact', e.target.value)}
                  placeholder="Ex: Redução de 20% no CPL"
                />
              </div>
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
              disabled={loading || !formData.title.trim() || !formData.client_id}
            >
              {loading ? 'Salvando...' : 'Criar Otimização'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}