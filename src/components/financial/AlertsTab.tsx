import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, CheckCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { financialStore, financialCalculations, PendingExpense } from "@/shared/db/financialStore";
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
      const expenses = await financialStore.getPendingExpenses();
      setPendingExpenses(expenses);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar despesas pendentes",
        variant: "destructive",
      });
    }
  };

  const handleCreateExpense = async (expenseData: Omit<PendingExpense, 'id' | 'created_at'>) => {
    try {
      await financialStore.createPendingExpense(expenseData);
      await loadPendingExpenses();
      setIsNewExpenseModalOpen(false);
      onRefresh?.();
      toast({
        title: "Sucesso",
        description: "Despesa recorrente criada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar despesa recorrente",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await financialStore.markExpenseAsPaid(id);
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

  const handleDeleteExpense = async (id: string) => {
    try {
      await financialStore.deletePendingExpense(id);
      await loadPendingExpenses();
      onRefresh?.();
      toast({
        title: "Sucesso",
        description: "Despesa removida com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover despesa",
        variant: "destructive",
      });
    }
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overdueExpenses = pendingExpenses.filter(expense => 
    expense.status === 'pending' && expense.dueDate < todayStr
  );

  const dueTodayExpenses = pendingExpenses.filter(expense => 
    expense.status === 'pending' && expense.dueDate === todayStr
  );

  const dueSoonExpenses = pendingExpenses.filter(expense => {
    if (expense.status !== 'pending') return false;
    const daysUntil = financialCalculations.getDaysUntilDue(expense.dueDate);
    return daysUntil > 0 && daysUntil <= 7;
  });

  const getSeverityBadge = (expense: PendingExpense) => {
    const daysUntil = financialCalculations.getDaysUntilDue(expense.dueDate);
    const severity = financialCalculations.getAlertSeverity(daysUntil);
    
    if (daysUntil < 0) {
      return <Badge variant="destructive">Atrasado ({Math.abs(daysUntil)} dias)</Badge>;
    }
    if (daysUntil === 0) {
      return <Badge variant="destructive">Vence hoje</Badge>;
    }
    if (severity === 'high') {
      return <Badge variant="destructive">Vence em {daysUntil} dias</Badge>;
    }
    if (severity === 'medium') {
      return <Badge variant="secondary">Vence em {daysUntil} dias</Badge>;
    }
    return <Badge variant="outline">Vence em {daysUntil} dias</Badge>;
  };

  const ExpenseCard = ({ expense }: { expense: PendingExpense }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">{expense.description}</p>
            <p className="text-sm text-muted-foreground">{expense.category}</p>
            <p className="text-lg font-bold">R$ {expense.amount.toLocaleString('pt-BR')}</p>
          </div>
          <div className="space-y-2 text-right">
            {getSeverityBadge(expense)}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleMarkAsPaid(expense.id!)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Pagar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleDeleteExpense(expense.id!)}
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Alertas de Vencimento</h2>
        <Button onClick={() => setIsNewExpenseModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Despesa
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueExpenses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{dueTodayExpenses.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonExpenses.length}</div>
          </CardContent>
        </Card>
      </div>

      {overdueExpenses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Despesas Atrasadas
          </h3>
          {overdueExpenses.map(expense => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}

      {dueTodayExpenses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-warning flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vencem Hoje
          </h3>
          {dueTodayExpenses.map(expense => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}

      {dueSoonExpenses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximos 7 Dias
          </h3>
          {dueSoonExpenses.map(expense => (
            <ExpenseCard key={expense.id} expense={expense} />
          ))}
        </div>
      )}

      {pendingExpenses.filter(e => e.status === 'pending').length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhuma despesa pendente!</p>
            <p className="text-muted-foreground">Todas as contas estão em dia.</p>
          </CardContent>
        </Card>
      )}

      <NewPendingExpenseModal
        isOpen={isNewExpenseModalOpen}
        onClose={() => setIsNewExpenseModalOpen(false)}
        onSubmit={handleCreateExpense}
      />
    </div>
  );
}