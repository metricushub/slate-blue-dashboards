import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, CheckCircle, Plus, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { financialStore, financialCalculations, FinancialEntry } from "@/shared/db/financialStore";

interface IncomeAlertsTabProps {
  onRefresh?: () => void;
}

export function IncomeAlertsTab({ onRefresh }: IncomeAlertsTabProps) {
  const [pendingIncomes, setPendingIncomes] = useState<FinancialEntry[]>([]);
  const [selectedIncome, setSelectedIncome] = useState<FinancialEntry | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    loadPendingIncomes();
  }, []);

  const loadPendingIncomes = async () => {
    try {
      const incomes = await financialStore.getPendingIncomes();
      setPendingIncomes(incomes);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar receitas pendentes",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (income: FinancialEntry) => {
    setSelectedIncome(income);
  };

  const confirmPayment = async () => {
    if (!selectedIncome) return;

    try {
      await financialStore.markIncomeAsPaid(selectedIncome.id!, paidDate);
      await loadPendingIncomes();
      setSelectedIncome(null);
      setPaidDate(new Date().toISOString().split('T')[0]);
      onRefresh?.();
      toast({
        title: "Sucesso",
        description: "Receita confirmada como paga",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao confirmar pagamento",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsCancelled = async (id: string) => {
    try {
      await financialStore.markIncomeAsCancelled(id);
      await loadPendingIncomes();
      onRefresh?.();
      toast({
        title: "Receita cancelada",
        description: "Receita marcada como cancelada",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao cancelar receita",
        variant: "destructive",
      });
    }
  };

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overdueIncomes = pendingIncomes.filter(income => 
    income.dueDate && income.dueDate < todayStr
  );

  const dueTodayIncomes = pendingIncomes.filter(income => 
    income.dueDate === todayStr
  );

  const dueSoonIncomes = pendingIncomes.filter(income => {
    if (!income.dueDate) return false;
    const daysUntil = financialCalculations.getDaysUntilDue(income.dueDate);
    return daysUntil > 0 && daysUntil <= 7;
  });

  const getSeverityBadge = (income: FinancialEntry) => {
    if (!income.dueDate) return <Badge variant="outline">Sem data</Badge>;
    
    const daysUntil = financialCalculations.getDaysUntilDue(income.dueDate);
    
    if (daysUntil < 0) {
      return <Badge variant="destructive">Atrasado ({Math.abs(daysUntil)} dias)</Badge>;
    }
    if (daysUntil === 0) {
      return <Badge variant="destructive">Vence hoje</Badge>;
    }
    if (daysUntil <= 3) {
      return <Badge variant="destructive">Vence em {daysUntil} dias</Badge>;
    }
    if (daysUntil <= 7) {
      return <Badge variant="secondary">Vence em {daysUntil} dias</Badge>;
    }
    return <Badge variant="outline">Vence em {daysUntil} dias</Badge>;
  };

  const IncomeCard = ({ income }: { income: FinancialEntry }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="font-medium">{income.description}</p>
            <p className="text-sm text-muted-foreground">{income.category}</p>
            <p className="text-lg font-bold text-success">R$ {income.amount.toLocaleString('pt-BR')}</p>
            {income.clientId && (
              <p className="text-xs text-muted-foreground">Cliente: {income.clientId}</p>
            )}
          </div>
          <div className="space-y-2 text-right">
            {getSeverityBadge(income)}
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleMarkAsPaid(income)}
                className="flex items-center gap-1"
              >
                <CheckCircle className="h-3 w-3" />
                Confirmar
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleMarkAsCancelled(income.id!)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const totalCriticalIncomes = overdueIncomes.length + dueTodayIncomes.length;
  const totalPendingAmount = pendingIncomes.reduce((sum, income) => sum + income.amount, 0);
  const overdueAmount = overdueIncomes.reduce((sum, income) => sum + income.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Controle de Receitas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
            <DollarSign className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              R$ {totalPendingAmount.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueIncomes.length}</div>
            {overdueAmount > 0 && (
              <p className="text-xs text-muted-foreground">R$ {overdueAmount.toLocaleString('pt-BR')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{dueTodayIncomes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos 7 Dias</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonIncomes.length}</div>
          </CardContent>
        </Card>
      </div>

      {overdueIncomes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Receitas Atrasadas
          </h3>
          {overdueIncomes.map(income => (
            <IncomeCard key={income.id} income={income} />
          ))}
        </div>
      )}

      {dueTodayIncomes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-warning flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Vencem Hoje
          </h3>
          {dueTodayIncomes.map(income => (
            <IncomeCard key={income.id} income={income} />
          ))}
        </div>
      )}

      {dueSoonIncomes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximos 7 Dias
          </h3>
          {dueSoonIncomes.map(income => (
            <IncomeCard key={income.id} income={income} />
          ))}
        </div>
      )}

      {pendingIncomes.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-lg font-medium">Nenhuma receita pendente!</p>
            <p className="text-muted-foreground">Todas as receitas foram confirmadas.</p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Payment Modal */}
      <Dialog open={!!selectedIncome} onOpenChange={() => setSelectedIncome(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedIncome?.description}</p>
              <p className="text-2xl font-bold text-success">
                R$ {selectedIncome?.amount.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Recebimento</label>
              <Input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={confirmPayment} className="flex-1">
                Confirmar Recebimento
              </Button>
              <Button variant="outline" onClick={() => setSelectedIncome(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}