import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Kanban, ExternalLink, Clock, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HomeDataSummary } from '@/shared/hooks/useHomeData';

interface CrmSnapshotProps {
  leads: HomeDataSummary['leads'];
}

export const CrmSnapshot = ({ leads }: CrmSnapshotProps) => {
  const navigate = useNavigate();

  const stageColors = {
    'Novo': 'secondary',
    'Qualificação': 'outline',
    'Proposta': 'default',
    'Fechado': 'destructive'
  } as const;

  const stageIcons = {
    'Novo': Users,
    'Qualificação': Clock,
    'Proposta': TrendingUp,
    'Fechado': Kanban
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Kanban className="h-5 w-5" />
            Snapshot CRM
            <Badge variant="secondary">{leads.total}</Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Ver Kanban
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {leads.total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Kanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum lead no CRM</p>
            <p className="text-sm">Importe ou adicione leads para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stage Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(leads.byStage).map(([stage, count]) => {
                const Icon = stageIcons[stage as keyof typeof stageIcons] || Users;
                const color = stageColors[stage as keyof typeof stageColors] || 'secondary';
                
                return (
                  <div key={stage} className="text-center">
                     <div className="flex items-center justify-center mb-2">
                       <div className="p-2 rounded-lg bg-muted">
                         <Icon className="h-4 w-4 text-muted-foreground" />
                       </div>
                     </div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-sm text-muted-foreground">{stage}</p>
                  </div>
                );
              })}
            </div>

            {/* Stuck Leads Alert */}
            {leads.stuck.length > 0 && (
              <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <h4 className="font-medium text-sm">Leads Parados</h4>
                  <Badge variant="destructive">{leads.stuck.length}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Leads sem movimento há mais de 30 dias necessitam atenção
                </p>
                <div className="space-y-2">
                  {leads.stuck.slice(0, 3).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-2 bg-background rounded border">
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.stage} • {lead.owner || 'Sem responsável'}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {lead.stage}
                      </Badge>
                    </div>
                  ))}
                </div>
                {leads.stuck.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    +{leads.stuck.length - 3} leads parados
                  </p>
                )}
              </div>
            )}

            {/* Recent Leads */}
            {leads.recent.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Leads Recentes
                </h4>
                <div className="space-y-2">
                  {leads.recent.slice(0, 5).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {lead.utm_source && `${lead.utm_source} • `}
                          {lead.owner || 'Sem responsável'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={stageColors[lead.stage as keyof typeof stageColors] || 'secondary'}
                          className="text-xs"
                        >
                          {lead.stage}
                        </Badge>
                        {lead.value && (
                          <p className="text-xs text-muted-foreground mt-1">
                            R$ {lead.value.toLocaleString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};