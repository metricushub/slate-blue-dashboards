import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, DollarSign, Calendar, Search, Filter, ArrowUpDown } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { supabaseFinancialStore as financialStore, type FinancialEntry } from '@/shared/db/supabaseFinancialStore';
import type { Client } from "@/types";
import { format, startOfYear, endOfYear } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from "recharts";

interface ClientFinancialSummary {
  client: Client;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  transactionCount: number;
  avgTransactionValue: number;
  lastPayment?: string;
  monthlyRevenue: Record<string, number>;
  isRecurring: boolean;
  growthRate: number;
}

interface ClientRevenueAnalysisProps {
  entries: FinancialEntry[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--destructive))',
  'hsl(var(--warning))',
  'hsl(var(--success))',
  'hsl(var(--secondary))',
  '#8b5cf6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#3b82f6'
];

export function ClientRevenueAnalysis({ entries }: ClientRevenueAnalysisProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [yearlyEntries, setYearlyEntries] = useState<FinancialEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"revenue" | "transactions" | "growth">("revenue");
  const [filterType, setFilterType] = useState<"all" | "recurring" | "top">("all");
  const { dataSource } = useDataSource();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, fullYearEntries] = await Promise.all([
        dataSource.getClients(),
        financialStore.getFinancialEntries(
          format(startOfYear(new Date()), 'yyyy-MM-dd'),
          format(endOfYear(new Date()), 'yyyy-MM-dd')
        )
      ]);
      setClients(clientsData);
      setYearlyEntries(fullYearEntries);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const getClientSummaries = (): ClientFinancialSummary[] => {
    const summaries: ClientFinancialSummary[] = [];
    
    clients.forEach(client => {
      const clientEntries = yearlyEntries.filter(entry => 
        entry.client_id === client.id && entry.type === 'income'
      );
      
      if (clientEntries.length === 0) return;

      const totalRevenue = clientEntries.reduce((sum, entry) => sum + entry.amount, 0);
      const paidRevenue = clientEntries
        .filter(entry => entry.status === 'paid')
        .reduce((sum, entry) => sum + entry.amount, 0);
      const pendingRevenue = clientEntries
        .filter(entry => entry.status === 'pending')
        .reduce((sum, entry) => sum + entry.amount, 0);

      // Análise mensal
      const monthlyRevenue: Record<string, number> = {};
      clientEntries.forEach(entry => {
        const month = format(new Date(entry.due_date || entry.created_at), 'yyyy-MM');
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + entry.amount;
      });

      // Detectar recorrência
      const monthsWithPayments = Object.keys(monthlyRevenue).length;
      const avgMonthlyValue = totalRevenue / Math.max(monthsWithPayments, 1);
      const isRecurring = monthsWithPayments >= 3 && 
                         Object.values(monthlyRevenue).some(value => 
                           Math.abs(value - avgMonthlyValue) / avgMonthlyValue < 0.3
                         );

      // Calcular taxa de crescimento
      const months = Object.keys(monthlyRevenue).sort();
      let growthRate = 0;
      if (months.length >= 2) {
        const firstMonth = monthlyRevenue[months[0]] || 0;
        const lastMonth = monthlyRevenue[months[months.length - 1]] || 0;
        if (firstMonth > 0) {
          growthRate = ((lastMonth - firstMonth) / firstMonth) * 100;
        }
      }

      const lastPaymentEntry = clientEntries
        .filter(entry => entry.status === 'paid' && entry.paid_at)
        .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())[0];

      summaries.push({
        client,
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        transactionCount: clientEntries.length,
        avgTransactionValue: totalRevenue / clientEntries.length,
        lastPayment: lastPaymentEntry?.paid_at,
        monthlyRevenue,
        isRecurring,
        growthRate
      });
    });

    return summaries;
  };

  const filterAndSortSummaries = () => {
    let filtered = getClientSummaries();

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(summary =>
        summary.client.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por tipo
    switch (filterType) {
      case "recurring":
        filtered = filtered.filter(summary => summary.isRecurring);
        break;
      case "top":
        filtered = filtered.filter(summary => summary.paidRevenue > 0).slice(0, 10);
        break;
    }

    // Ordenar
    switch (sortBy) {
      case "revenue":
        filtered.sort((a, b) => b.paidRevenue - a.paidRevenue);
        break;
      case "transactions":
        filtered.sort((a, b) => b.transactionCount - a.transactionCount);
        break;
      case "growth":
        filtered.sort((a, b) => b.growthRate - a.growthRate);
        break;
    }

    return filtered;
  };

  const clientSummaries = filterAndSortSummaries();
  const totalRevenue = clientSummaries.reduce((sum, summary) => sum + summary.paidRevenue, 0);
  const activeClients = clientSummaries.filter(summary => summary.paidRevenue > 0).length;
  const recurringClients = clientSummaries.filter(summary => summary.isRecurring).length;

  // Dados para gráfico de pizza
  const revenueDistribution = clientSummaries
    .slice(0, 8)
    .map(summary => ({
      name: summary.client.name,
      value: summary.paidRevenue,
      percentage: ((summary.paidRevenue / totalRevenue) * 100).toFixed(1)
    }));

  // Outros clientes agrupados
  const othersRevenue = clientSummaries
    .slice(8)
    .reduce((sum, summary) => sum + summary.paidRevenue, 0);
  
  if (othersRevenue > 0) {
    revenueDistribution.push({
      name: 'Outros',
      value: othersRevenue,
      percentage: ((othersRevenue / totalRevenue) * 100).toFixed(1)
    });
  }

  // Dados para gráfico de evolução mensal
  const monthlyData = clientSummaries
    .slice(0, 5)
    .reduce((acc: any[], summary) => {
      Object.entries(summary.monthlyRevenue).forEach(([month, revenue]) => {
        const existing = acc.find(item => item.month === month);
        if (existing) {
          existing[summary.client.name] = revenue;
          existing.total += revenue;
        } else {
          acc.push({
            month,
            [summary.client.name]: revenue,
            total: revenue
          });
        }
      });
      return acc;
    }, [])
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6); // Últimos 6 meses

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeClients}</div>
            <p className="text-xs text-muted-foreground">
              de {clients.length} clientes totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              R$ {totalRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {activeClients > 0 ? Math.round(totalRevenue / activeClients).toLocaleString('pt-BR') : '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Recorrentes</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurringClients}</div>
            <p className="text-xs text-muted-foreground">
              {activeClients > 0 ? ((recurringClients / activeClients) * 100).toFixed(1) : '0'}% dos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Cliente</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {clientSummaries[0]?.paidRevenue?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {clientSummaries[0]?.client.name || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ordenação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Ordenar por Receita</SelectItem>
                <SelectItem value="transactions">Ordenar por Transações</SelectItem>
                <SelectItem value="growth">Ordenar por Crescimento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Clientes</SelectItem>
                <SelectItem value="recurring">Apenas Recorrentes</SelectItem>
                <SelectItem value="top">Top 10</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Receita por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {revenueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Receita']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal - Top 5 Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']} />
                {clientSummaries.slice(0, 5).map((summary, index) => (
                  <Line 
                    key={summary.client.id}
                    type="monotone" 
                    dataKey={summary.client.name} 
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>
            Análise Detalhada por Cliente ({clientSummaries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clientSummaries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado com os filtros aplicados
              </div>
            ) : (
              clientSummaries.map((summary, index) => (
                <Card key={summary.client.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <span className="text-sm font-medium">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-lg">{summary.client.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {summary.transactionCount} transações
                          </Badge>
                          {summary.isRecurring && (
                            <Badge variant="default">Recorrente</Badge>
                          )}
                          {summary.growthRate > 0 && (
                            <Badge variant="secondary" className="text-success">
                              +{summary.growthRate.toFixed(1)}%
                            </Badge>
                          )}
                          {summary.growthRate < 0 && (
                            <Badge variant="secondary" className="text-destructive">
                              {summary.growthRate.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        {summary.lastPayment && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Último pagamento: {format(new Date(summary.lastPayment), 'dd/MM/yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-success">
                        R$ {summary.paidRevenue.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ticket médio: R$ {Math.round(summary.avgTransactionValue).toLocaleString('pt-BR')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {((summary.paidRevenue / totalRevenue) * 100).toFixed(1)}% da receita total
                      </p>
                      {summary.pendingRevenue > 0 && (
                        <Badge variant="outline" className="mt-1">
                          R$ {summary.pendingRevenue.toLocaleString('pt-BR')} pendente
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}