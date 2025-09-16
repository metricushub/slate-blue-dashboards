import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinancialGoal } from "@/shared/db/financialStore";

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<FinancialGoal, 'id' | 'created_at' | 'month'>) => void;
}

export function NewGoalModal({ isOpen, onClose, onSubmit }: NewGoalModalProps) {
  const [formData, setFormData] = useState({
    type: 'revenue' as 'revenue' | 'clients',
    target: '',
    current: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.target || !formData.current) {
      return;
    }

    onSubmit({
      type: formData.type,
      target: parseFloat(formData.target),
      current: parseFloat(formData.current)
    });

    // Reset form
    setFormData({
      type: 'revenue',
      target: '',
      current: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
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
                <SelectItem value="revenue">Faturamento</SelectItem>
                <SelectItem value="clients">Número de Clientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target">
              Meta {formData.type === 'revenue' ? '(R$)' : '(quantidade)'}
            </Label>
            <Input
              id="target"
              type="number"
              step={formData.type === 'revenue' ? '0.01' : '1'}
              min="0"
              value={formData.target}
              onChange={(e) => setFormData({...formData, target: e.target.value})}
              placeholder={formData.type === 'revenue' ? '50000,00' : '10'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current">
              Valor Atual {formData.type === 'revenue' ? '(R$)' : '(quantidade)'}
            </Label>
            <Input
              id="current"
              type="number"
              step={formData.type === 'revenue' ? '0.01' : '1'}
              min="0"
              value={formData.current}
              onChange={(e) => setFormData({...formData, current: e.target.value})}
              placeholder={formData.type === 'revenue' ? '25000,00' : '5'}
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