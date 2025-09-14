import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Info, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HomeDataSummary } from '@/shared/hooks/useHomeData';
import { useDataSource } from '@/hooks/useDataSource';

interface AlertsCenterProps {
  alerts: HomeDataSummary['alerts'];
  clientNames: Record<string, string>;
}

export const AlertsCenter = ({ alerts, clientNames }: AlertsCenterProps) => {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const navigate = useNavigate();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warn': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'info': return <Info className="h-4 w-4 text-info" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warn': return 'warning';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const filteredAlerts = selectedClient === 'all' 
    ? alerts.urgent 
    : alerts.byClient[selectedClient] || [];

  const uniqueClients = Object.keys(alerts.byClient);

  if (alerts.total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Centro de Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum alerta ativo</p>
            <p className="text-sm">Todos os sistemas estão funcionando normalmente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Centro de Alertas
            <Badge variant="secondary">{alerts.total}</Badge>
          </CardTitle>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {uniqueClients.map(clientId => (
                <SelectItem key={clientId} value={clientId}>
                  {clientNames[clientId] || 'Cliente sem nome'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Severity Summary */}
        <div className="flex gap-4 mb-4">
          {Object.entries(alerts.bySeverity).map(([severity, count]) => (
            <div key={severity} className="flex items-center gap-2">
              {getSeverityIcon(severity)}
              <span className="text-sm font-medium">{count}</span>
              <span className="text-sm text-muted-foreground capitalize">{severity}</span>
            </div>
          ))}
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.slice(0, 10).map((alert) => (
            <div
              key={alert.id}
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              {getSeverityIcon(alert.severity)}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm">{alert.name}</h4>
                <p className="text-sm text-muted-foreground">{alert.expression}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={getSeverityColor(alert.severity) as any}
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {clientNames[alert.client_id] || 'Cliente'}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/cliente/${alert.client_id}/overview`)}
                className="flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                Ver
              </Button>
            </div>
          ))}
        </div>

        {filteredAlerts.length > 10 && (
          <div className="text-center mt-4">
            <Button variant="outline" size="sm">
              Ver todos os {filteredAlerts.length} alertas
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};