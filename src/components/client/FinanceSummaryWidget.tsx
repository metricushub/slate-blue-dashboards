import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';
import { DollarSign, Calendar, CreditCard } from 'lucide-react';
import { clientFinanceOperations, ClientFinance } from '@/shared/db/clientFinanceStore';
import { differenceInDays } from 'date-fns';

interface FinanceSummaryWidgetProps {
  clientId: string;
}

export function FinanceSummaryWidget({ clientId }: FinanceSummaryWidgetProps) {
  const [finance, setFinance] = useState<ClientFinance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceData();
  }, [clientId]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      const data = await clientFinanceOperations.getByClientId(clientId);
      setFinance(data || null);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDueDateInfo = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    
    const diffDays = differenceInDays(due, today);
    
    if (diffDays === 0) {
      return { label: 'Hoje', variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800' };
    } else if (diffDays < 0) {
      return { label: 'Atrasado', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
    } else if (diffDays <= 7) {
      return { label: `${diffDays} dias`, variant: 'secondary' as const, color: 'bg-blue-100 text-blue-800' };
    } else {
      return { label: `${diffDays} dias`, variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ativo':
        return { variant: 'default' as const, color: 'bg-green-100 text-green-800' };
      case 'Pendente':
        return { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' };
      case 'Encerrado':
        return { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' };
      default:
        return { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' };
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

  if (loading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3 p-3 bg-card/50 rounded-lg border">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  if (!finance) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-col sm:flex-row gap-3 p-3 bg-card/50 rounded-lg border opacity-50">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <DollarSign className="h-3 w-3" />
                  Financeiro
                </div>
                <div className="text-sm font-medium">—</div>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/cliente/${clientId}/financeiro`}>
                  Ver Financeiro
                </Link>
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Em configuração</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const dueDateInfo = getDueDateInfo(finance.nextDueDate);
  const statusInfo = getStatusBadgeVariant(finance.contractStatus);

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-card/50 rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <DollarSign className="h-3 w-3" />
          Resumo Financeiro
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={statusInfo.color}>
            {finance.contractStatus}
          </Badge>
          
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">
              {formatDate(finance.nextDueDate)}
            </span>
            <Badge className={dueDateInfo.color}>
              {dueDateInfo.label}
            </Badge>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
          <span className="font-medium">
            {formatCurrency(finance.amountMonthly)}/mês
          </span>
          
          <div className="flex items-center gap-1 text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            {finance.method}
          </div>
        </div>
      </div>
      
      <div className="flex-shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/cliente/${clientId}/financeiro`}>
            Ver Financeiro
          </Link>
        </Button>
      </div>
    </div>
  );
}