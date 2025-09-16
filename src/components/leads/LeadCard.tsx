import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { OnboardingService } from '@/lib/onboardingService';
import { User, DollarSign, Calendar, Thermometer, AlertTriangle, Star } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onClick: (lead: Lead) => void;
  isDragging?: boolean;
  onConverted?: (lead: Lead) => void;
  onMarkAsLost?: (lead: Lead) => void;
}

export function LeadCard({ lead, onClick, isDragging, onConverted, onMarkAsLost }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: lead.id,
    // Disable dragging for closed leads to prevent conflicts with form actions
    disabled: lead.stage === 'Fechado'
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'high':
        return <Star className="h-3 w-3 text-orange-600" />;
      case 'medium':
        return <Star className="h-3 w-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTemperatureColor = (temperature?: string) => {
    switch (temperature) {
      case 'hot':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'warm':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'cold':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-muted-foreground bg-muted border-border';
    }
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
      {...(lead.stage !== 'Fechado' ? listeners : {})}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isDragging || isSortableDragging ? 'opacity-50 shadow-lg scale-105' : ''
      }`}
      onClick={() => onClick(lead)}
    >
      <CardContent className="p-4">
        {/* Nome, Priority e Owner */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm truncate">{lead.name}</h4>
              {getPriorityIcon(lead.priority)}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground truncate">
                {lead.owner || '—'}
              </span>
            </div>
            {lead.company && (
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {lead.company}
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            <Badge 
              variant="outline" 
              className={`text-xs shrink-0 ${getStageColor(lead.stage)}`}
            >
              {lead.stage}
            </Badge>
            {lead.temperature && (
              <Badge 
                variant="outline"
                className={`text-xs shrink-0 ${getTemperatureColor(lead.temperature)}`}
              >
                <Thermometer className="h-2 w-2 mr-1" />
                {lead.temperature}
              </Badge>
            )}
          </div>
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

        {/* Lead Score e Follow-up */}
        {(lead.leadScore || lead.nextFollowUpDate) && (
          <div className="flex items-center justify-between text-xs mb-2">
            {lead.leadScore && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-600" />
                <span className="font-medium">{lead.leadScore}/100</span>
              </div>
            )}
            {lead.nextFollowUpDate && (
              <div className="flex items-center gap-1 text-orange-600">
                <Calendar className="h-3 w-3" />
                <span className="text-xs">
                  Follow-up: {new Date(lead.nextFollowUpDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
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

        {/* Motivo de perda ou formulário enviado */}
        {lead.stage === 'Fechado' && lead.lossReason && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-xs text-red-800 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Perdido: {lead.lossReason}
            </div>
          </div>
        )}
        
        {lead.stage === 'Fechado' && !lead.lossReason && lead.client_id && (() => {
          const sentDate = OnboardingService.getFormSentDate(lead.client_id);
          if (sentDate) {
            return (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-800 font-medium">
                  Formulário enviado em {sentDate}
                </div>
                <div className="flex gap-1 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConverted?.(lead);
                    }}
                  >
                    Reenviar
                  </Button>
                </div>
              </div>
            );
          }
          
          // Se não tem formulário enviado mas está fechado sem motivo de perda
          if (!lead.lossReason && onMarkAsLost) {
            return (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs text-yellow-800 font-medium mb-1">
                  Lead fechado - registrar resultado
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onConverted?.(lead);
                    }}
                  >
                    Ganho
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs flex-1 text-red-600 border-red-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsLost?.(lead);
                    }}
                  >
                    Perdido
                  </Button>
                </div>
              </div>
            );
          }
          
          return null;
        })()}
      </CardContent>
    </Card>
  );
}