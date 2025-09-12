import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Lead, LeadStage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { LeadCard } from './LeadCard';

interface LeadColumnProps {
  stage: LeadStage;
  leads: Lead[];
  stats: { count: number; value: number };
  onLeadClick: (lead: Lead) => void;
  onNewLead: () => void;
}

export function LeadColumn({ stage, leads, stats, onLeadClick, onNewLead }: LeadColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Novo':
        return 'border-blue-200 bg-blue-50/50';
      case 'Qualificação':
        return 'border-yellow-200 bg-yellow-50/50';
      case 'Proposta':
        return 'border-orange-200 bg-orange-50/50';
      case 'Fechado':
        return 'border-green-200 bg-green-50/50';
      default:
        return 'border-gray-200 bg-gray-50/50';
    }
  };

  const getHeaderBadgeColor = (stage: string) => {
    switch (stage) {
      case 'Novo':
        return 'bg-blue-100 text-blue-800';
      case 'Qualificação':
        return 'bg-yellow-100 text-yellow-800';
      case 'Proposta':
        return 'bg-orange-100 text-orange-800';
      case 'Fechado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <CardTitle className="text-lg font-semibold">{stage}</CardTitle>
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
              />
            ))
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}