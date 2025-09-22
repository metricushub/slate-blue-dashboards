import { useState, useEffect } from "react";
import { Calendar, AlertTriangle, Clock, CheckCircle, Plus, DollarSign, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabaseFinancialStore as financialStore, financialCalculations, type FinancialEntry } from '@/shared/db/supabaseFinancialStore';
import { useDataSource } from "@/hooks/useDataSource";
import type { Client } from "@/types";
import { format, addDays, subDays } from "date-fns";

interface IncomeAlertsTabProps {
  onRefresh?: () => void;
}

export function IncomeAlertsTab({ onRefresh }: IncomeAlertsTabProps) {
  const [pendingIncomes, setPendingIncomes] = useState<FinancialEntry[]>([]);
  const [allIncomes, setAllIncomes] = useState<FinancialEntry[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedIncome, setSelectedIncome] = useState<FinancialEntry | null>(null);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar dados do ano inteiro para análise completa
      const startOfYear = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
      const endOfYear = format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd');
      
      const [yearIncomes, clientsData] = await Promise.all([
        financialStore.getFinancialEntries(startOfYear, endOfYear),
        dataSource.getClients()
      ]);

      const incomeEntries = yearIncomes.filter(entry => entry.type === 'income');
      setAllIncomes(incomeEntries);
      
      const pending = incomeEntries.filter(entry => entry.status === 'pending');
      setPendingIncomes(pending);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading income data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de receitas",
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
      await financialStore.updateFinancialEntry(selectedIncome.id, {
        status: 'paid',
        paid_at: paidDate
      });
      await loadData();
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
      await financialStore.updateFinancialEntry(id, { status: 'cancelled' });
      await loadData();
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

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Sem cliente';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const filterIncomes = () => {
    let filtered = [...pendingIncomes];

    if (searchTerm) {
      filtered = filtered.filter(income =>
        income.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(income.client_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (clientFilter !== "all") {
      filtered = filtered.filter(income => 
        clientFilter === "none" ? !income.client_id : income.client_id === clientFilter
      );
    }

    if (periodFilter !== "all") {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      switch (periodFilter) {
        case "overdue":
          filtered = filtered.filter(income => 
            income.due_date && income.due_date < todayStr
          );
          break;
        case "today":
          filtered = filtered.filter(income => income.due_date === todayStr);
          break;
        case "next7":
          const next7Days = format(addDays(today, 7), 'yyyy-MM-dd');
          filtered = filtered.filter(income => 
            income.due_date && income.due_date > todayStr && income.due_date <= next7Days
          );
          break;
        case "next30":
          const next30Days = format(addDays(today, 30), 'yyyy-MM-dd');
          filtered = filtered.filter(income => 
            income.due_date && income.due_date > todayStr && income.due_date <= next30Days
          );
          break;
      }
    }

    return filtered;
  };

  const filteredIncomes = filterIncomes();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const overdueIncomes = pendingIncomes.filter(income => 
    income.due_date && income.due_date < todayStr
  );

  const dueTodayIncomes = pendingIncomes.filter(income => 
    income.due_date === todayStr
  );

  const dueSoonIncomes = pendingIncomes.filter(income => {
    if (!income.due_date) return false;
    const daysUntil = financialCalculations.getDaysUntilDue(income.due_date);
    return daysUntil > 0 && daysUntil <= 7;
  });

  const getSeverityBadge = (income: FinancialEntry) => {
    if (!income.due_date) return <Badge variant="outline">Sem data</Badge>;
    
    const daysUntil = financialCalculations.getDaysUntilDue(income.due_date);
    
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
            <p className="text-sm text-primary font-medium">
              Cliente: {getClientName(income.client_id)}
            </p>
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
        <Button onClick={loadData} variant="outline">
          Atualizar Dados
        </Button>
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
            <p className="text-xs text-muted-foreground">{pendingIncomes.length} entradas</p>
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

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar por descrição ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                <SelectItem value="none">Sem cliente</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="overdue">Atrasadas</SelectItem>
                <SelectItem value="today">Vencem hoje</SelectItem>
                <SelectItem value="next7">Próximos 7 dias</SelectItem>
                <SelectItem value="next30">Próximos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Receitas Filtradas */}
      <Card>
        <CardHeader>
          <CardTitle>
            Receitas Pendentes ({filteredIncomes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredIncomes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-lg font-medium">Nenhuma receita pendente encontrada!</p>
              <p className="text-muted-foreground">
                {pendingIncomes.length === 0 
                  ? "Todas as receitas foram confirmadas."
                  : "Tente ajustar os filtros para ver outras receitas."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncomes.map(income => (
                <IncomeCard key={income.id} income={income} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Payment Modal */}
      <Dialog open={!!selectedIncome} onOpenChange={() => setSelectedIncome(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Recebimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-medium">{selectedIncome?.description}</p>
              <p className="text-sm text-muted-foreground">
                Cliente: {getClientName(selectedIncome?.client_id || null)}
              </p>
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