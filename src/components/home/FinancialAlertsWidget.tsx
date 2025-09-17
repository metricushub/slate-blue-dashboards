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
    <Card className="rounded-xl shadow-sm border-0 bg-card/60 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className={`h-4 w-4 ${totalCriticalAlerts > 0 ? 'text-destructive' : 'text-success'}`} />
            <span className="text-sm font-medium">Financeiro</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="text-center">
              <div className={`font-bold ${totalCriticalAlerts > 0 ? 'text-destructive' : 'text-success'}`}>
                {totalCriticalAlerts}
              </div>
              <div className="text-muted-foreground">críticos</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-warning">
                {dueSoonExpenses.length}
              </div>
              <div className="text-muted-foreground">semana</div>
            </div>
          </div>
        </div>

        {totalCriticalAlerts > 0 && overdueAmount > 0 ? (
          <div className="text-xs p-2 bg-destructive/5 rounded border border-destructive/10 text-center">
            <span className="font-medium text-destructive">
              R$ {overdueAmount.toLocaleString('pt-BR')} em atraso
            </span>
          </div>
        ) : pendingExpenses.length === 0 ? (
          <div className="text-xs text-center text-muted-foreground">
            Finanças em dia! 🎉
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}