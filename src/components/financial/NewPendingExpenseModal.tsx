import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PendingExpense } from "@/shared/db/financialStore";

interface NewPendingExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<PendingExpense, 'id' | 'created_at'>) => void;
}

const EXPENSE_CATEGORIES = [
  'Salários',
  'Ferramentas/Software',
  'Marketing',
  'Escritório/Aluguel',
  'Impostos',
  'Comissões',
  'Fornecedores',
  'Outros'
];

export function NewPendingExpenseModal({ isOpen, onClose, onSubmit }: NewPendingExpenseModalProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: '',
    dueDate: '',
    recurring: 'none' as 'monthly' | 'quarterly' | 'yearly' | 'none',
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    clientId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category || !formData.dueDate) {
      return;
    }

    onSubmit({
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      dueDate: formData.dueDate,
      recurring: formData.recurring,
      status: formData.status,
      clientId: formData.clientId || undefined
    });

    // Reset form
    setFormData({
      description: '',
      amount: '',
      category: '',
      dueDate: '',
      recurring: 'none',
      status: 'pending',
      clientId: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Despesa Recorrente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({...formData, category: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Descreva a despesa..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              placeholder="0,00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Data de Vencimento</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recurring">Recorrência</Label>
            <Select
              value={formData.recurring}
              onValueChange={(value: 'monthly' | 'quarterly' | 'yearly' | 'none') => setFormData({...formData, recurring: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Não recorrente</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="quarterly">Trimestral</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Cliente (opcional)</Label>
            <Input
              id="clientId"
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              placeholder="ID ou nome do cliente"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}