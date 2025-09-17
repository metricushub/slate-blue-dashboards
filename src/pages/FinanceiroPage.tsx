import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, Target, Users, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { financialStore, financialCalculations, FinancialEntry, FinancialGoal } from "@/shared/db/financialStore";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { NewEntryModal } from "@/components/financial/NewEntryModal";
import { NewGoalModal } from "@/components/financial/NewGoalModal";
import { FinancialTable } from "@/components/financial/FinancialTable";
import { AlertsTab } from "@/components/financial/AlertsTab";
import { IncomeAlertsTab } from "@/components/financial/IncomeAlertsTab";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export function FinanceiroPage() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [isNewEntryModalOpen, setIsNewEntryModalOpen] = useState(false);
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { toast } = useToast();

  // Simulated admin check - in production this would come from authentication
  const isAdmin = true; // For now, always true

  useEffect(() => {
    if (isAdmin) {
      loadFinancialData();
    }
  }, [selectedMonth, isAdmin]);

  const loadFinancialData = async () => {
    try {
      const monthEntries = await financialStore.getEntriesByMonth(selectedMonth);
      const currentGoals = await financialStore.getCurrentGoals();
      setEntries(monthEntries);
      setGoals(currentGoals);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive",
      });
    }
  };

  const handleCreateEntry = async (entryData: Omit<FinancialEntry, 'id' | 'created_at'>) => {
    try {
      await financialStore.createEntry(entryData);
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

  const handleCreateGoal = async (goalData: Omit<FinancialGoal, 'id' | 'created_at'>) => {
    try {
      await financialStore.createGoal({ ...goalData, month: selectedMonth });
      await loadFinancialData();
      setIsNewGoalModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Meta criada com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar meta",
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

  const totalIncome = financialCalculations.calculateTotalIncome(entries);
  const confirmedIncome = financialCalculations.calculateConfirmedIncome(entries);
  const pendingIncome = financialCalculations.calculatePendingIncome(entries);
  const totalExpenses = financialCalculations.calculateTotalExpenses(entries);
  const netProfit = financialCalculations.calculateNetProfit(entries);
  const categorySummary = financialCalculations.getCategorySummary(entries);

  const revenueGoal = goals.find(g => g.type === 'revenue');
  const clientsGoal = goals.find(g => g.type === 'clients');

  // Only use confirmed income for charts
  const confirmedEntries = entries.filter(entry => 
    entry.type === 'expense' || (entry.type === 'income' && entry.status === 'paid')
  );

  const chartData = confirmedEntries
    .reduce((acc: any[], entry) => {
      const date = entry.paidDate || entry.date; // Use paid date if available
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

  const pieData = categorySummary.map(item => ({
    name: item.category,
    value: item.amount,
    type: item.type
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
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
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
                       <span>R$ {confirmedIncome.toLocaleString('pt-BR')} / R$ {revenueGoal.target.toLocaleString('pt-BR')}</span>
                     </div>
                     <Progress value={(confirmedIncome / revenueGoal.target) * 100} className="h-2" />
                     <div className="text-center text-sm text-muted-foreground">
                       {((confirmedIncome / revenueGoal.target) * 100).toFixed(1)}% concluído
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
                      <span>{clientsGoal.current} / {clientsGoal.target} clientes</span>
                    </div>
                    <Progress value={(clientsGoal.current / clientsGoal.target) * 100} className="h-2" />
                    <div className="text-center text-sm text-muted-foreground">
                      {((clientsGoal.current / clientsGoal.target) * 100).toFixed(1)}% concluído
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="entries">Entradas</TabsTrigger>
            <TabsTrigger value="income-control">Receitas</TabsTrigger>
            <TabsTrigger value="alerts">Despesas</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
            <FinancialTable entries={entries} onRefresh={loadFinancialData} />
          </TabsContent>

          <TabsContent value="income-control">
            <IncomeAlertsTab onRefresh={loadFinancialData} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsTab onRefresh={loadFinancialData} />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total de Entradas:</span>
                      <span className="font-medium">{entries.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior Receita:</span>
                      <span className="font-medium text-success">
                        R$ {Math.max(...entries.filter(e => e.type === 'income').map(e => e.amount), 0).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maior Despesa:</span>
                      <span className="font-medium text-destructive">
                        R$ {Math.max(...entries.filter(e => e.type === 'expense').map(e => e.amount), 0).toLocaleString('pt-BR')}
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
                    {categorySummary.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{category.category}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={category.type === 'income' ? 'default' : 'destructive'}>
                            {category.type === 'income' ? 'Receita' : 'Despesa'}
                          </Badge>
                          <span className="font-medium">
                            R$ {category.amount.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
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