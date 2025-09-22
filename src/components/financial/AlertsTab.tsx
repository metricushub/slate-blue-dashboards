import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, CheckCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabaseFinancialStore, financialCalculations, PendingExpense } from "@/shared/db/supabaseFinancialStore";
import { NewPendingExpenseModal } from "./NewPendingExpenseModal";

interface AlertsTabProps {
  onRefresh?: () => void;
}

export function AlertsTab({ onRefresh }: AlertsTabProps) {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingExpenses();
  }, []);

  const loadPendingExpenses = async () => {
    try {
      const data = await supabaseFinancialStore.getPendingExpenses();
      setPendingExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar despesas pendentes:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar despesas pendentes",
        variant: "destructive",
      });
    }
  };

  const handleCreateExpense = async (expenseData: Omit<PendingExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      await supabaseFinancialStore.addPendingExpense(expenseData);
      await loadPendingExpenses();
      setIsNewExpenseModalOpen(false);
      onRefresh?.();
      toast({
        title: "Sucesso",
        description: "Despesa pendente criada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar despesa pendente",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await supabaseFinancialStore.updatePendingExpense(id, { status: 'paid' });
      await loadPendingExpenses();
      onRefresh?.();
      toast({
        title: "Sucesso",
        description: "Despesa marcada como paga",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao marcar despesa como paga",
        variant: "destructive",
      });
    }
  };

  const getUrgencyLevel = (expense: PendingExpense) => {
    const daysUntilDue = financialCalculations.getDaysUntilDue(expense.due_date);
    return financialCalculations.getAlertSeverity(daysUntilDue);
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'overdue': return 'destructive';
      case 'due-today': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const criticalExpenses = pendingExpenses.filter(exp => {
    const daysUntil = financialCalculations.getDaysUntilDue(exp.due_date);
    return daysUntil <= 7;
  });

  const overdueExpenses = pendingExpenses.filter(exp => {
    const daysUntil = financialCalculations.getDaysUntilDue(exp.due_date);
    return daysUntil < 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Alertas de Despesas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie despesas pendentes e recorrentes
          </p>
        </div>
        <Button onClick={() => setIsNewExpenseModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      {/* Critical Alerts */}
      {criticalExpenses.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardHeader>
            <CardTitle className="flex items-center text-warning">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Despesas Críticas ({criticalExpenses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalExpenses.map((expense) => {
                const daysUntil = financialCalculations.getDaysUntilDue(expense.due_date);
                const urgency = getUrgencyLevel(expense);
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{expense.description}</p>
                        <Badge variant={getUrgencyColor(urgency) as any}>
                          {daysUntil < 0 ? `${Math.abs(daysUntil)} dias em atraso` : 
                           daysUntil === 0 ? 'Vence hoje' : 
                           `${daysUntil} dias`}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span>R$ {expense.amount.toLocaleString('pt-BR')}</span>
                        <span>{expense.category}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsPaid(expense.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Marcar como Pago
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Pending Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Despesas Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingExpenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma despesa pendente encontrada
            </p>
          ) : (
            <div className="space-y-3">
              {pendingExpenses.map((expense) => {
                const daysUntil = financialCalculations.getDaysUntilDue(expense.due_date);
                const urgency = getUrgencyLevel(expense);
                
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{expense.description}</p>
                        <Badge variant={getUrgencyColor(urgency) as any}>
                          {daysUntil < 0 ? `${Math.abs(daysUntil)} dias em atraso` : 
                           daysUntil === 0 ? 'Vence hoje' : 
                           `${daysUntil} dias`}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(expense.due_date).toLocaleDateString('pt-BR')}
                        </span>
                        <span>R$ {expense.amount.toLocaleString('pt-BR')}</span>
                        <span>{expense.category}</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsPaid(expense.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Marcar como Pago
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <NewPendingExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setIsNewExpenseModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
}