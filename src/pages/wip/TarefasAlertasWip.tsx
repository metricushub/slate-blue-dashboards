import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Calendar, ExternalLink, AlertTriangle } from 'lucide-react';
import { clientFinanceOperations, ClientFinance } from '@/shared/db/clientFinanceStore';
import { ClientsStore } from '@/shared/db/clientsStore';
import { Client } from '@/types';
import { differenceInDays } from 'date-fns';

interface VencimentoAlert {
  clientId: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Hoje' | 'Atrasado' | 'Esta semana';
  contractStatus: string;
}

export default function TarefasAlertasWip() {
  const [vencimentos, setVencimentos] = useState<VencimentoAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVencimentos();
  }, []);

  const loadVencimentos = async () => {
    try {
      setLoading(true);
      const financeData = await clientFinanceOperations.getAll();
      const clients = await ClientsStore.getAllClients();
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const alerts: VencimentoAlert[] = [];
      
      for (const finance of financeData) {
        const client = clients.find(c => c.id === finance.id);
        if (!client) continue;
        
        const dueDate = new Date(finance.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffDays = differenceInDays(dueDate, today);
        
        let status: 'Hoje' | 'Atrasado' | 'Esta semana' | null = null;
        
        if (diffDays === 0) {
          status = 'Hoje';
        } else if (diffDays < 0) {
          status = 'Atrasado';
        } else if (diffDays <= 7) {
          status = 'Esta semana';
        }
        
        if (status) {
          alerts.push({
            clientId: finance.id,
            clientName: client.name,
            amount: finance.amountMonthly,
            dueDate: finance.nextDueDate,
            status,
            contractStatus: finance.contractStatus
          });
        }
      }
      
      // Ordenar por data ascendente
      alerts.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      setVencimentos(alerts);
    } catch (error) {
      console.error('Erro ao carregar vencimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Hoje':
        return 'bg-yellow-100 text-yellow-800';
      case 'Atrasado':
        return 'bg-red-100 text-red-800';
      case 'Esta semana':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContractStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-100 text-green-800';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Encerrado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const groupedVencimentos = {
    hoje: vencimentos.filter(v => v.status === 'Hoje'),
    atrasados: vencimentos.filter(v => v.status === 'Atrasado'),
    estaSemana: vencimentos.filter(v => v.status === 'Esta semana')
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas e Alertas</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie tarefas e monitore vencimentos financeiros
        </p>
      </div>

      {/* Seção de Vencimentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Vencimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando vencimentos...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Hoje */}
              {groupedVencimentos.hoje.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Hoje ({groupedVencimentos.hoje.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedVencimentos.hoje.map((venc) => (
                      <div key={venc.clientId} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{venc.clientName}</span>
                            <Badge className={getContractStatusBadge(venc.contractStatus)}>
                              {venc.contractStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatCurrency(venc.amount)}</span>
                            <span>{formatDate(venc.dueDate)}</span>
                            <Badge className={getStatusBadge(venc.status)}>
                              {venc.status}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/cliente/${venc.clientId}/financeiro`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Financeiro
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Atrasados */}
              {groupedVencimentos.atrasados.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    Atrasados ({groupedVencimentos.atrasados.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedVencimentos.atrasados.map((venc) => (
                      <div key={venc.clientId} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{venc.clientName}</span>
                            <Badge className={getContractStatusBadge(venc.contractStatus)}>
                              {venc.contractStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatCurrency(venc.amount)}</span>
                            <span>{formatDate(venc.dueDate)}</span>
                            <Badge className={getStatusBadge(venc.status)}>
                              {venc.status}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/cliente/${venc.clientId}/financeiro`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Financeiro
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Esta Semana */}
              {groupedVencimentos.estaSemana.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    Esta Semana ({groupedVencimentos.estaSemana.length})
                  </h3>
                  <div className="space-y-2">
                    {groupedVencimentos.estaSemana.map((venc) => (
                      <div key={venc.clientId} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{venc.clientName}</span>
                            <Badge className={getContractStatusBadge(venc.contractStatus)}>
                              {venc.contractStatus}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{formatCurrency(venc.amount)}</span>
                            <span>{formatDate(venc.dueDate)}</span>
                            <Badge className={getStatusBadge(venc.status)}>
                              {venc.status}
                            </Badge>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/cliente/${venc.clientId}/financeiro`}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir Financeiro
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {vencimentos.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum vencimento por aqui.</p>
                  <p className="text-sm">Os alertas de vencimento aparecerão quando houver datas próximas.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder para futuras seções */}
      <Card>
        <CardHeader>
          <CardTitle>Outras Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Sistema de tarefas gerais será implementado em breve.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}