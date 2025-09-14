import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wand2, ExternalLink, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeDataSummary } from '@/shared/hooks/useHomeData';

interface OptimizationsStripProps {
  optimizations: HomeDataSummary['optimizations'];
  clientNames: Record<string, string>;
}

export const OptimizationsStrip = ({ optimizations, clientNames }: OptimizationsStripProps) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Planejada': return 'secondary';
      case 'Em teste': return 'outline';
      case 'Concluída': return 'destructive';
      default: return 'secondary';
    }
  };

  const renderOptimizationItem = (optimization: any, status: string) => (
    <div
      key={optimization.id}
      className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{optimization.title}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/cliente/${optimization.client_id}/otimizacoes`)}
          className="shrink-0"
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
        <span>{clientNames[optimization.client_id] || 'Cliente'}</span>
        {optimization.target_metric && (
          <>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {optimization.target_metric}
            </div>
          </>
        )}
      </div>

      {optimization.start_date && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {format(new Date(optimization.start_date), 'dd/MM/yy', { locale: ptBR })}
        </div>
      )}
    </div>
  );

  const totalOptimizations = 
    optimizations.planned.length + 
    optimizations.testing.length + 
    optimizations.review.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Otimizações
            <Badge variant="secondary">{totalOptimizations}</Badge>
          </CardTitle>
          <Button variant="outline" size="sm">
            Ver Central
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {totalOptimizations === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma otimização em andamento</p>
            <p className="text-sm">Planeje novas otimizações para melhorar performance</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Planned Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">Planejada</Badge>
                <span className="text-sm text-muted-foreground">
                  {optimizations.planned.length}
                </span>
              </div>
              <div className="space-y-2">
                {optimizations.planned.slice(0, 3).map(opt => 
                  renderOptimizationItem(opt, 'Planejada')
                )}
                {optimizations.planned.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{optimizations.planned.length - 3} mais
                  </p>
                )}
              </div>
            </div>

            {/* Testing Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">Em teste</Badge>
                <span className="text-sm text-muted-foreground">
                  {optimizations.testing.length}
                </span>
              </div>
              <div className="space-y-2">
                {optimizations.testing.slice(0, 3).map(opt => 
                  renderOptimizationItem(opt, 'Em teste')
                )}
                {optimizations.testing.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{optimizations.testing.length - 3} mais
                  </p>
                )}
              </div>
            </div>

            {/* Review Column */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="destructive">Revisão</Badge>
                <span className="text-sm text-muted-foreground">
                  {optimizations.review.length}
                </span>
              </div>
              <div className="space-y-2">
                {optimizations.review.slice(0, 3).map(opt => 
                  renderOptimizationItem(opt, 'Revisão')
                )}
                {optimizations.review.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    +{optimizations.review.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};