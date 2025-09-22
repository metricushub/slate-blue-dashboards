import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { LeadCard } from './LeadCard';

interface LeadColumnProps {
  stage: string;
  leads: Lead[];
  stats: { count: number; value: number };
  onLeadClick: (lead: Lead) => void;
  onNewLead: () => void;
  onLeadConverted?: (lead: Lead) => void;
  onMarkAsLost?: (lead: Lead) => void;
}

export function LeadColumn({ stage, leads, stats, onLeadClick, onNewLead, onLeadConverted, onMarkAsLost }: LeadColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'novo':
        return 'border-blue-200 bg-blue-50/50';
      case 'qualificacao':
        return 'border-yellow-200 bg-yellow-50/50';
      case 'proposta':
        return 'border-orange-200 bg-orange-50/50';
      case 'negociacao':
        return 'border-red-200 bg-red-50/50';
      case 'fechado':
        return 'border-green-200 bg-green-50/50';
      case 'perdido':
        return 'border-gray-200 bg-gray-50/50';
      default:
        return 'border-gray-200 bg-gray-50/50';
    }
  };

  const getHeaderBadgeColor = (stage: string) => {
    switch (stage) {
      case 'novo':
        return 'bg-blue-100 text-blue-800';
      case 'qualificacao':
        return 'bg-yellow-100 text-yellow-800';
      case 'proposta':
        return 'bg-orange-100 text-orange-800';
      case 'negociacao':
        return 'bg-red-100 text-red-800';
      case 'fechado':
        return 'bg-green-100 text-green-800';
      case 'perdido':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageDisplayName = (stage: string) => {
    switch (stage) {
      case 'novo':
        return 'Novo';
      case 'qualificacao':
        return 'Qualificação';
      case 'proposta':
        return 'Proposta';
      case 'negociacao':
        return 'Negociação';
      case 'fechado':
        return 'Fechado';
      case 'perdido':
        return 'Perdido';
      default:
        return stage;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      className={`h-[600px] transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary shadow-lg' : ''
      } ${getStageColor(stage)}`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{getStageDisplayName(stage)}</CardTitle>
          <Badge variant="secondary" className={getHeaderBadgeColor(stage)}>
            {stats.count}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {new Intl.NumberFormat('pt-BR', { 
              style: 'currency', 
              currency: 'BRL',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(stats.value)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewLead}
            className="h-6 px-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-y-auto max-h-[480px] space-y-3">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="mb-2 text-sm">Nenhum lead neste estágio</div>
              <Button
                variant="outline"
                size="sm"
                onClick={onNewLead}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Criar primeiro lead
              </Button>
            </div>
          ) : (
            leads.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={onLeadClick}
                onConverted={stage === 'fechado' ? onLeadConverted : undefined}
                onMarkAsLost={stage === 'perdido' ? onMarkAsLost : undefined}
              />
            ))
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}