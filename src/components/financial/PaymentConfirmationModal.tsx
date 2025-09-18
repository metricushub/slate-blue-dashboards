import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinancialEntry } from "@/shared/db/supabaseFinancialStore";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paidAt: string) => void;
  entry?: FinancialEntry;
  action: 'pay' | 'cancel' | 'reactivate';
}

export function PaymentConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  entry, 
  action 
}: PaymentConfirmationModalProps) {
  const [paidAt, setPaidAt] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(action === 'pay' ? paidAt : '');
    onClose();
  };

  const getTitle = () => {
    switch (action) {
      case 'pay':
        return `Confirmar ${entry?.type === 'income' ? 'Recebimento' : 'Pagamento'}`;
      case 'cancel':
        return 'Cancelar Entrada';
      case 'reactivate':
        return 'Reativar Entrada';
      default:
        return 'Confirmar Ação';
    }
  };

  const getDescription = () => {
    switch (action) {
      case 'pay':
        return `Confirme a data do ${entry?.type === 'income' ? 'recebimento' : 'pagamento'} de "${entry?.description}"`;
      case 'cancel':
        return `Tem certeza que deseja cancelar "${entry?.description}"?`;
      case 'reactivate':
        return `Tem certeza que deseja reativar "${entry?.description}"?`;
      default:
        return 'Confirme a ação';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {getDescription()}
            </p>
            
            {action === 'pay' && (
              <div className="space-y-2">
                <Label htmlFor="paid_at">
                  Data do {entry?.type === 'income' ? 'Recebimento' : 'Pagamento'}
                </Label>
                <Input
                  id="paid_at"
                  type="date"
                  value={paidAt}
                  onChange={(e) => setPaidAt(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant={action === 'cancel' ? 'destructive' : 'default'}>
              {action === 'pay' ? 'Confirmar Baixa' : action === 'cancel' ? 'Cancelar Entrada' : 'Reativar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}