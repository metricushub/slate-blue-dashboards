import { useState, useEffect } from "react";
import { AlertTriangle, Clock, DollarSign, TrendingDown, Plus, Search, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabaseFinancialStore as financialStore, financialCalculations, type FinancialEntry, type PendingExpense } from '@/shared/db/supabaseFinancialStore';
import { useDataSource } from "@/hooks/useDataSource";
import type { Client } from "@/types";
import { format, addDays, startOfMonth, endOfMonth } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface ExpenseManagementTabProps {
  onRefresh?: () => void;
}

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--primary))', 'hsl(var(--secondary))'];

export function ExpenseManagementTab({ onRefresh }: ExpenseManagementTabProps) {
  const [expenses, setExpenses] = useState<FinancialEntry[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<PendingExpense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("current_month");
  const [statusFilter, setStatusFilter] = useState("all");
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  useEffect(() => {
    loadExpenseData();
  }, [periodFilter]);

  const loadExpenseData = async () => {
    try {
      let startDate, endDate;
      
      switch (periodFilter) {
        case "current_month":
          startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
          break;
        case "last_3_months":
          startDate = format(addDays(new Date(), -90), 'yyyy-MM-dd');
          endDate = format(new Date(), 'yyyy-MM-dd');
          break;
        case "current_year":
          startDate = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
          endDate = format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd');
          break;
        default:
          startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
          endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      }

      const [allEntries, pendingExpensesList, clientsData] = await Promise.all([
        financialStore.getFinancialEntries(startDate, endDate),
        financialStore.getPendingExpenses(),
        dataSource.getClients()
      ]);

      const expenseEntries = allEntries.filter(entry => entry.type === 'expense');
      setExpenses(expenseEntries);
      setPendingExpenses(pendingExpensesList);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading expense data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados de despesas",
        variant: "destructive",
      });
    }
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return 'Geral';
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const filterExpenses = () => {
    let filtered = [...expenses];

    if (searchTerm) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(expense.client_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(expense => expense.status === statusFilter);
    }

    return filtered;
  };

  const filteredExpenses = filterExpenses();
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpenses = filteredExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpensesAmount = filteredExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);

  // Análise por categoria
  const expensesByCategory = filteredExpenses.reduce((acc: any, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amount;
    return acc;
  }, {});

  const categoryChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount as number,
  }));

  // Análise por cliente
  const expensesByClient = filteredExpenses.reduce((acc: any, expense) => {
    const clientName = getClientName(expense.client_id);
    if (!acc[clientName]) {
      acc[clientName] = 0;
    }
    acc[clientName] += expense.amount;
    return acc;
  }, {});

  const clientChartData = Object.entries(expensesByClient)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([client, amount]) => ({
      name: client,
      amount: amount as number,
    }));

  // Despesas críticas (atrasadas ou vencendo)
  const today = format(new Date(), 'yyyy-MM-dd');
  const criticalExpenses = pendingExpenses.filter(expense => 
    expense.due_date <= format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );

  const overdueExpenses = pendingExpenses.filter(expense => expense.due_date < today);
  const categories = [...new Set(expenses.map(e => e.category))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestão de Despesas</h2>
        <Button onClick={loadExpenseData} variant="outline">
          Atualizar Dados
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              R$ {totalExpenses.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {paidExpenses.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {((paidExpenses / totalExpenses) * 100 || 0).toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              R$ {pendingExpensesAmount.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">{pendingExpenses.length} a vencer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{criticalExpenses.length}</div>
            <p className="text-xs text-muted-foreground">
              {overdueExpenses.length} atrasadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">Mês Atual</SelectItem>
                <SelectItem value="last_3_months">Últimos 3 Meses</SelectItem>
                <SelectItem value="current_year">Ano Atual</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Despesas por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
                <Bar dataKey="amount" fill="hsl(var(--destructive))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Despesas Críticas */}
      {criticalExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Despesas Críticas (Próximos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalExpenses.map(expense => (
                <div key={expense.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">{expense.category}</p>
                    <p className="text-sm text-primary">
                      Vencimento: {format(new Date(expense.due_date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-destructive">
                      R$ {expense.amount.toLocaleString('pt-BR')}
                    </p>
                    <Badge variant={expense.due_date < today ? "destructive" : "secondary"}>
                      {expense.due_date < today ? "Atrasada" : "Vence em breve"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(expensesByCategory)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([category, amount], index) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                      <span className="text-sm font-medium">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{category}</p>
                      <p className="text-sm text-muted-foreground">
                        {filteredExpenses.filter(e => e.category === category).length} despesas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-destructive">
                      R$ {(amount as number).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(((amount as number) / totalExpenses) * 100).toFixed(1)}% do total
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}