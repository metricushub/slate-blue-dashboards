import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Wand2, Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { HomeDataSummary } from '@/shared/hooks/useHomeData';

interface ActivityFeedProps {
  activity: HomeDataSummary['activity'];
}

export const ActivityFeed = ({ activity }: ActivityFeedProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'optimization': return <Wand2 className="h-4 w-4 text-primary" />;
      case 'lead': return <Users className="h-4 w-4 text-info" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task': return 'success';
      case 'optimization': return 'primary';
      case 'lead': return 'info';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Atividade Recente
          <Badge variant="secondary">{activity.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma atividade recente</p>
            <p className="text-sm">Ações e atualizações aparecerão aqui</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="shrink-0 mt-0.5">
                  {getActivityIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <p className="font-medium text-sm line-clamp-2">
                      {item.title} 
                    </p>
                    <Badge 
                      variant={getActivityColor(item.type) as any}
                      className="text-xs shrink-0"
                    >
                      {item.type === 'task' ? 'Tarefa' : 
                       item.type === 'optimization' ? 'Otimização' : 'Lead'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {item.action}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {item.clientName && (
                      <>
                        <span>{item.clientName}</span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {formatDistanceToNow(new Date(item.timestamp), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};