import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { User, DollarSign } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  isDragging?: boolean;
  onConverted?: (lead: Lead) => void;
}

export function LeadCard({ lead, onClick, isDragging, onConverted }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Novo':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Qualificação':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Proposta':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Fechado':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUtmDisplay = () => {
    if (!lead.utm_source && !lead.utm_medium) return null;
    
    const source = lead.utm_source || '—';
    const medium = lead.utm_medium || '—';
    return `${source}/${medium}`;
  };

  const getFullUtmTooltip = () => {
    const parts = [];
    if (lead.utm_source) parts.push(`Source: ${lead.utm_source}`);
    if (lead.utm_medium) parts.push(`Medium: ${lead.utm_medium}`);
    if (lead.utm_campaign) parts.push(`Campaign: ${lead.utm_campaign}`);
    if (lead.utm_content) parts.push(`Content: ${lead.utm_content}`);
    return parts.join(' | ') || undefined;
  };

  const getLeadAge = () => {
    try {
      return formatDistanceToNow(new Date(lead.created_at), { 
        addSuffix: false, 
        locale: ptBR 
      });
    } catch {
      return 'Data inválida';
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isDragging || isSortableDragging ? 'opacity-50 shadow-lg scale-105' : ''
      }`}
      onClick={() => onClick(lead)}
    >
      <CardContent className="p-4">
        {/* Nome e Owner */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
            <div className="flex items-center gap-1 mt-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {lead.owner || '—'}
              </span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs shrink-0 ml-2 ${getStageColor(lead.stage)}`}
          >
            {lead.stage}
          </Badge>
        </div>

        {/* Contato */}
        {(lead.email || lead.phone) && (
          <div className="text-xs text-muted-foreground mb-2 space-y-1">
            {lead.email && (
              <div className="truncate">{lead.email}</div>
            )}
            {lead.phone && (
              <div className="truncate">{lead.phone}</div>
            )}
          </div>
        )}

        {/* UTM */}
        {getUtmDisplay() && (
          <div 
            className="text-xs bg-muted px-2 py-1 rounded mb-2 truncate"
            title={getFullUtmTooltip()}
          >
            {getUtmDisplay()}
          </div>
        )}

        {/* Valor e Idade */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium">
              {lead.value ? 
                new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(lead.value) : 
                '—'
              }
            </span>
          </div>
          <span className="text-muted-foreground">
            {getLeadAge()}
          </span>
        </div>

        {/* Notas preview */}
        {lead.notes && (
          <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {lead.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}