import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { supabaseFinancialStore as financialStore, type FinancialEntry } from '@/shared/db/supabaseFinancialStore';
import type { Client } from "@/types";
import { format, startOfYear, endOfYear } from "date-fns";

interface ClientAnalyticsProps {
  entries: FinancialEntry[];
}

interface ClientFinancialSummary {
  client: Client;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  transactionCount: number;
  avgTransactionValue: number;
  lastPayment?: string;
  monthlyRevenue: Record<string, number>;
}

export function ClientAnalytics({ entries }: ClientAnalyticsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [yearlyEntries, setYearlyEntries] = useState<FinancialEntry[]>([]);
  const { dataSource } = useDataSource();

  useEffect(() => {
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
    loadData();
  }, [dataSource]);

  const getClientSummary = (): ClientFinancialSummary[] => {
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

      const monthlyRevenue: Record<string, number> = {};
      clientEntries.forEach(entry => {
        const month = format(new Date(entry.due_date || entry.created_at), 'yyyy-MM');
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + entry.amount;
      });

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
        monthlyRevenue
      });
    });

    return summaries.sort((a, b) => b.paidRevenue - a.paidRevenue);
  };

  const clientSummaries = getClientSummary();
  const topClients = clientSummaries.slice(0, 5);
  const totalRevenue = clientSummaries.reduce((sum, summary) => sum + summary.paidRevenue, 0);
  const activeClients = clientSummaries.filter(summary => summary.paidRevenue > 0).length;

  // Detectar clientes com mensalidades (pagamentos recorrentes)
  const getRecurringClients = () => {
    return clientSummaries.filter(summary => {
      const monthsWithPayments = Object.keys(summary.monthlyRevenue).length;
      const avgMonthlyValue = summary.totalRevenue / Math.max(monthsWithPayments, 1);
      // Considera recorrente se tem pagamentos em múltiplos meses e valores similares
      return monthsWithPayments >= 3 && 
             Object.values(summary.monthlyRevenue).some(value => 
               Math.abs(value - avgMonthlyValue) / avgMonthlyValue < 0.3
             );
    });
  };

  const recurringClients = getRecurringClients();

  return (
    <div className="space-y-6">
      {/* KPIs Gerais */}
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
            <CardTitle className="text-sm font-medium">Receita por Cliente</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {activeClients > 0 ? Math.round(totalRevenue / activeClients).toLocaleString('pt-BR') : '0'}
            </div>
            <p className="text-xs text-muted-foreground">Média anual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensalidades</CardTitle>
            <Calendar className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recurringClients.length}</div>
            <p className="text-xs text-muted-foreground">Clientes recorrentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior Cliente</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {topClients[0]?.paidRevenue?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">{topClients[0]?.client.name || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 5 Clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Clientes por Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClients.map((summary, index) => (
              <div key={summary.client.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-medium">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium">{summary.client.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {summary.transactionCount} transações
                      {summary.lastPayment && (
                        <span className="ml-2">
                          • Último: {format(new Date(summary.lastPayment), 'dd/MM/yyyy')}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {summary.paidRevenue.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">
                    Ticket médio: R$ {Math.round(summary.avgTransactionValue).toLocaleString('pt-BR')}
                  </p>
                  {summary.pendingRevenue > 0 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      R$ {summary.pendingRevenue.toLocaleString('pt-BR')} pendente
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clientes com Mensalidades */}
      {recurringClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clientes com Mensalidades Recorrentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recurringClients.map((summary) => {
                const monthsActive = Object.keys(summary.monthlyRevenue).length;
                const avgMonthly = summary.totalRevenue / monthsActive;
                
                return (
                  <div key={summary.client.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{summary.client.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {monthsActive} meses ativos • Média mensal: R$ {Math.round(avgMonthly).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="default">
                        R$ {summary.paidRevenue.toLocaleString('pt-BR')} /ano
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((summary.paidRevenue / totalRevenue) * 100).toFixed(1)}% da receita
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}