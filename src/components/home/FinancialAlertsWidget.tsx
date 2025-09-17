import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Calendar, DollarSign, ArrowRight } from "lucide-react";
import { financialStore, financialCalculations, PendingExpense } from "@/shared/db/financialStore";

export function FinancialAlertsWidget() {
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadPendingExpenses();
  }, []);

  const loadPendingExpenses = async () => {
    try {
      const expenses = await financialStore.getPendingExpenses();
      setPendingExpenses(expenses.filter(e => e.status === 'pending'));
    } catch (error) {
      console.error('Erro ao carregar despesas pendentes:', error);
    }
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overdueExpenses = pendingExpenses.filter(expense => 
    expense.dueDate < todayStr
  );

  const dueTodayExpenses = pendingExpenses.filter(expense => 
    expense.dueDate === todayStr
  );

  const dueSoonExpenses = pendingExpenses.filter(expense => {
    const daysUntil = financialCalculations.getDaysUntilDue(expense.dueDate);
    return daysUntil > 0 && daysUntil <= 7;
  });

  const totalCriticalAlerts = overdueExpenses.length + dueTodayExpenses.length;
  const totalUpcomingAmount = dueSoonExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const overdueAmount = overdueExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const getSeverityBadge = (expense: PendingExpense) => {
    const daysUntil = financialCalculations.getDaysUntilDue(expense.dueDate);
    
    if (daysUntil < 0) {
      return <Badge variant="destructive" className="text-xs">Atrasado</Badge>;
    }
    if (daysUntil === 0) {
      return <Badge variant="destructive" className="text-xs">Hoje</Badge>;
    }
    if (daysUntil <= 3) {
      return <Badge variant="destructive" className="text-xs">{daysUntil}d</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">{daysUntil}d</Badge>;
  };

  const criticalExpenses = [...overdueExpenses, ...dueTodayExpenses].slice(0, 3);

  return (
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border-0 bg-card/60 backdrop-blur-sm animate-fade-in">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-3">
          <div className={`p-2 rounded-lg ${totalCriticalAlerts > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
            <DollarSign className={`h-5 w-5 ${totalCriticalAlerts > 0 ? 'text-destructive' : 'text-success'}`} />
          </div>
          Alertas Financeiros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${totalCriticalAlerts > 0 ? 'text-destructive' : 'text-success'}`}>
              {totalCriticalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">Críticos</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">
              {dueSoonExpenses.length}
            </div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </div>
        </div>

        {totalCriticalAlerts > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Atenção necessária
            </div>
            {overdueAmount > 0 && (
              <div className="text-sm p-2 bg-destructive/5 rounded-lg border border-destructive/10">
                <span className="font-medium text-destructive">
                  R$ {overdueAmount.toLocaleString('pt-BR')} em atraso
                </span>
              </div>
            )}
            {criticalExpenses.map(expense => (
              <div 
                key={expense.id} 
                className="text-sm p-3 bg-muted/30 rounded-lg flex items-center justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{expense.description}</div>
                  <div className="text-muted-foreground text-xs">
                    R$ {expense.amount.toLocaleString('pt-BR')}
                  </div>
                </div>
                {getSeverityBadge(expense)}
              </div>
            ))}
          </div>
        )}

        {totalUpcomingAmount > 0 && (
          <div className="text-sm p-3 bg-warning/5 rounded-lg border border-warning/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-warning" />
              <span className="font-medium">Próximos 7 dias</span>
            </div>
            <span className="text-warning font-medium">
              R$ {totalUpcomingAmount.toLocaleString('pt-BR')} a vencer
            </span>
          </div>
        )}

        {pendingExpenses.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-success opacity-50" />
            <p className="text-sm">Nenhuma despesa pendente</p>
            <p className="text-xs">Finanças em dia! 🎉</p>
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full rounded-lg"
          onClick={() => navigate('/financeiro')}
        >
          Ver Financeiro
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}