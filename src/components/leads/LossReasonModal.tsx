import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lead } from '@/types';
import { AlertTriangle } from 'lucide-react';

interface LossReasonModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead;
  onSave: (leadId: string, lossReason: string, notes?: string) => void;
}

const LOSS_REASONS = [
  'Preço muito alto',
  'Optou pela concorrência',
  'Orçamento insuficiente',
  'Timing inadequado',
  'Não houve engajamento',
  'Não era o decisor',
  'Produto/serviço não adequado',
  'Questões técnicas',
  'Processo interno complexo',
  'Perdeu contato',
  'Outros'
];

export function LossReasonModal({ open, onClose, lead, onSave }: LossReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedReason) return;

    setLoading(true);
    try {
      await onSave(lead.id, selectedReason, notes.trim() || undefined);
      onClose();
      setSelectedReason('');
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Motivo da Perda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Lead: <span className="font-medium">{lead.name}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Por que este lead foi perdido?
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Motivo da perda</label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo..." />
              </SelectTrigger>
              <SelectContent>
                {LOSS_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações (opcional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais sobre a perda..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!selectedReason || loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}