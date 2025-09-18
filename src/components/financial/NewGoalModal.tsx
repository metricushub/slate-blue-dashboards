import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialGoal } from "@/shared/db/supabaseFinancialStore";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'month'>) => void;
}

export function NewGoalModal({ isOpen, onClose, onSubmit }: NewGoalModalProps) {
  const [formData, setFormData] = useState({
    type: 'revenue' as 'revenue' | 'clients',
    target_amount: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.target_amount) {
      return;
    }

    onSubmit({
      type: formData.type,
      target_amount: parseFloat(formData.target_amount)
    });

    // Reset form
    setFormData({
      type: 'revenue',
      target_amount: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Se já existe uma meta do mesmo tipo para este mês, ela será atualizada.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Meta</Label>
            <Select
              value={formData.type}
              onValueChange={(value: 'revenue' | 'clients') => setFormData({...formData, type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Meta de Faturamento</SelectItem>
                <SelectItem value="clients">Meta de Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_amount">
              {formData.type === 'revenue' ? 'Meta de Faturamento (R$)' : 'Meta de Clientes (quantidade)'}
            </Label>
            <Input
              id="target_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.target_amount}
              onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
              placeholder="50000,00"
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Meta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}