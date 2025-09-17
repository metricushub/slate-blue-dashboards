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

        {totalCriticalAlerts > 0 && overdueAmount > 0 && (
          <div className="text-sm p-2 bg-destructive/5 rounded-lg border border-destructive/10 text-center">
            <span className="font-medium text-destructive">
              R$ {overdueAmount.toLocaleString('pt-BR')} em atraso
            </span>
          </div>
        )}

        {pendingExpenses.length === 0 && (
          <div className="text-center py-2 text-muted-foreground">
            <p className="text-sm">Finanças em dia! 🎉</p>
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