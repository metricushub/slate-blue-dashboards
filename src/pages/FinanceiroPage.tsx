import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabaseFinancialStore as financialStore, financialCalculations, type FinancialEntry, type FinancialGoal } from '@/shared/db/supabaseFinancialStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { NewEntryModal } from "@/components/financial/NewEntryModal";
import { NewGoalModal } from "@/components/financial/NewGoalModal";
import { FinancialTable } from "@/components/financial/FinancialTable";
import { AlertsTab } from "@/components/financial/AlertsTab";
import { IncomeAlertsTab } from "@/components/financial/IncomeAlertsTab";
import { DateRangePicker } from "@/components/financial/DateRangePicker";
import { ClientAnalytics } from "@/components/financial/ClientAnalytics";
import { ClientRevenueAnalysis } from "@/components/financial/ClientRevenueAnalysis";
import { ExpenseManagementTab } from "@/components/financial/ExpenseManagementTab";
import { AdvancedFilters } from "@/components/financial/AdvancedFilters";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useDataSource } from "@/hooks/useDataSource";
import type { Client } from "@/types";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export function FinanceiroPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<FinancialEntry[]>([]);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const { dataSource } = useDataSource();
  const { toast } = useToast();

  // Simulated admin check - in production this would come from authentication context
  const isAdmin = true; // For now, always true

  useEffect(() => {
    if (isAdmin) {
      loadFinancialData();
      loadClients();
    }
  }, [dateRange, isAdmin]);

  useEffect(() => {
    setFilteredEntries(entries);
  }, [entries]);

  const loadClients = async () => {
    try {
      const clientsData = await dataSource.getClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadFinancialData = async () => {
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const rangeEntries = await financialStore.getFinancialEntries(startDate, endDate);
      
      // For goals, use the current month format for now
      const currentMonth = format(new Date(), 'yyyy-MM');
      const currentGoals = await financialStore.getFinancialGoals(currentMonth);
      
      setEntries(rangeEntries);
      setGoals(currentGoals);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive",
      });
    }
  };

  const handleCreateEntry = async (entryData: Omit<FinancialEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      await financialStore.addFinancialEntry(entryData);
      await loadFinancialData();
      setIsNewEntryModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Entrada financeira criada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar entrada financeira",
        variant: "destructive",
      });
    }
  };

  const handleCreateGoal = async (goalData: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      
      // Check if goal already exists
      const existingGoals = await financialStore.getFinancialGoals(currentMonth);
      const existingGoal = existingGoals.find(g => g.type === goalData.type);
      
      await financialStore.addFinancialGoal({ ...goalData, month: currentMonth });
      await loadFinancialData();
      setIsNewGoalModalOpen(false);
      
      toast({
        title: "Sucesso",
        description: existingGoal 
          ? `Meta de ${goalData.type === 'revenue' ? 'faturamento' : 'clientes'} atualizada com sucesso`
          : `Meta de ${goalData.type === 'revenue' ? 'faturamento' : 'clientes'} criada com sucesso`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar/atualizar meta",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar a área financeira.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const totalIncome = financialCalculations.calculateTotalIncome(filteredEntries);
  const confirmedIncome = financialCalculations.calculateConfirmedIncome(filteredEntries);
  const pendingIncome = financialCalculations.calculatePendingIncome(filteredEntries);
  const totalExpenses = financialCalculations.calculateTotalExpenses(filteredEntries);
  const netProfit = financialCalculations.calculateNetProfit(filteredEntries);
  const categorySummary = financialCalculations.getCategorySummary(filteredEntries);

  const handleFiltersChange = (filters: any) => {
    let filtered = [...entries];

    if (filters.dateRange) {
      const startDate = format(filters.dateRange.from, 'yyyy-MM-dd');
      const endDate = format(filters.dateRange.to, 'yyyy-MM-dd');
      filtered = filtered.filter(entry => {
        const entryDate = entry.due_date || entry.created_at.split('T')[0];
        return entryDate >= startDate && entryDate <= endDate;
      });
    }

    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === filters.type);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(entry => entry.category === filters.category);
    }

    if (filters.client && filters.client !== 'all') {
      if (filters.client === 'none') {
        filtered = filtered.filter(entry => !entry.client_id);
      } else {
        filtered = filtered.filter(entry => entry.client_id === filters.client);
      }
    }

    if (filters.minAmount) {
      filtered = filtered.filter(entry => entry.amount >= filters.minAmount);
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(entry => entry.amount <= filters.maxAmount);
    }

    setFilteredEntries(filtered);
  };

  const categories = [...new Set(entries.map(entry => entry.category))];
  const clientsForFilter = clients.map(client => ({ id: client.id, name: client.name }));

  const revenueGoal = goals.find(g => g.type === 'revenue');
  const clientsGoal = goals.find(g => g.type === 'clients');

  // Only use confirmed income for charts
  const confirmedEntries = filteredEntries.filter(entry => 
    entry.type === 'expense' || (entry.type === 'income' && entry.status === 'paid')
  );

  const chartData = confirmedEntries
    .reduce((acc: any[], entry) => {
      const date = entry.due_date || entry.created_at.split('T')[0]; // Use due_date or creation date
      const existing = acc.find(item => item.date === date);
      if (existing) {
        if (entry.type === 'income') {
          existing.receita += entry.amount;
        } else {
          existing.despesa += entry.amount;
        }
      } else {
        acc.push({
          date,
          receita: entry.type === 'income' ? entry.amount : 0,
          despesa: entry.type === 'expense' ? entry.amount : 0,
        });
      }
      return acc;
    }, [])
    .sort((a, b) => a.date.localeCompare(b.date));

  const pieData = Object.entries(financialCalculations.getCategorySummary(filteredEntries)).map(([category, data]) => ({
    name: category,
    value: data.income + data.expense,
    type: data.income > data.expense ? 'income' : 'expense'
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie receitas, despesas e metas da agência</p>
          </div>
          
          <div className="flex items-center gap-4">
            <DateRangePicker
              onDateRangeChange={(range) => {
                setDateRange(range);
              }}
              initialRange={dateRange}
            />
            <Button onClick={() => setIsNewEntryModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrada
            </Button>
            <Button variant="outline" onClick={() => setIsNewGoalModalOpen(true)}>
              <Target className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>
        </div>

        {/* KPIs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Confirmada</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {confirmedIncome.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Efetivamente recebida</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">
                R$ {pendingIncome.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Aguardando confirmação</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {totalExpenses.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
                R$ {netProfit.toLocaleString('pt-BR')}
              </div>
              <Badge variant={netProfit >= 0 ? "default" : "destructive"} className="mt-2">
                {netProfit >= 0 ? 'Lucro' : 'Prejuízo'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        {(revenueGoal || clientsGoal) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {revenueGoal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Meta de Faturamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                     <div className="flex justify-between text-sm">
                       <span>Progresso</span>
                       <span>R$ {confirmedIncome.toLocaleString('pt-BR')} / R$ {revenueGoal.target_amount.toLocaleString('pt-BR')}</span>
                     </div>
                     <Progress value={(confirmedIncome / revenueGoal.target_amount) * 100} className="h-2" />
                     <div className="text-center text-sm text-muted-foreground">
                       {((confirmedIncome / revenueGoal.target_amount) * 100).toFixed(1)}% concluído
                     </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {clientsGoal && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Meta de Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>0 / {clientsGoal.target_amount} clientes</span>
                    </div>
                    <Progress value={0} className="h-2" />
                    <div className="text-center text-sm text-muted-foreground">
                      0% da meta alcançada
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Filtros Avançados */}
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          categories={categories}
          clients={clientsForFilter}
        />

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="entries">Entradas</TabsTrigger>
            <TabsTrigger value="income-control">Receitas</TabsTrigger>
            <TabsTrigger value="alerts">Despesas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="clients">Análise por Cliente</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fluxo de Caixa</CardTitle>
                  <CardDescription>Receitas vs Despesas ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']} />
                      <Area type="monotone" dataKey="receita" stackId="1" stroke="hsl(var(--success))" fill="hsl(var(--success))" />
                      <Area type="monotone" dataKey="despesa" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Categoria</CardTitle>
                  <CardDescription>Breakdown das categorias de receitas e despesas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="entries">
            <FinancialTable entries={filteredEntries} onRefresh={loadFinancialData} />
          </TabsContent>

          <TabsContent value="income-control">
            <IncomeAlertsTab onRefresh={loadFinancialData} />
          </TabsContent>

          <TabsContent value="alerts">
            <ExpenseManagementTab onRefresh={loadFinancialData} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Entradas:</span>
                      <span className="font-medium">{filteredEntries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior Receita:</span>
                      <span className="font-medium text-success">
                        R$ {Math.max(...filteredEntries.filter(e => e.type === 'income').map(e => e.amount), 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior Despesa:</span>
                      <span className="font-medium text-destructive">
                        R$ {Math.max(...filteredEntries.filter(e => e.type === 'expense').map(e => e.amount), 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clientes Ativos:</span>
                      <span className="font-medium">
                        {new Set(filteredEntries.filter(e => e.client_id && e.type === 'income').map(e => e.client_id)).size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categorias Principais</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(financialCalculations.getCategorySummary(filteredEntries)).slice(0, 5).map(([category, data], index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={data.income > data.expense ? 'default' : 'destructive'}>
                            {data.income > data.expense ? 'Receita' : 'Despesa'}
                          </Badge>
                          <span className="font-medium">
                            R$ {(data.income + data.expense).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <ClientRevenueAnalysis entries={entries} />
          </TabsContent>

          <TabsContent value="settings">
            <CategoryManager onRefresh={loadFinancialData} />
          </TabsContent>
        </Tabs>

        <NewEntryModal
          isOpen={isNewEntryModalOpen}
          onClose={() => setIsNewEntryModalOpen(false)}
          onSubmit={handleCreateEntry}
        />

        <NewGoalModal
          isOpen={isNewGoalModalOpen}
          onClose={() => setIsNewGoalModalOpen(false)}
          onSubmit={handleCreateGoal}
        />
      </div>
    </div>
  );
}