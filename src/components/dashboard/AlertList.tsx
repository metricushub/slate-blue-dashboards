import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, X, Bell } from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { Alert as AlertType } from "@/types";
import { cn } from "@/lib/utils";

interface AlertListProps {
  clientId: string;
}

export function AlertList({ clientId }: AlertListProps) {
  const { dataSource } = useDataSource();
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const alertData = await dataSource.getAlerts(clientId);
        setAlerts(alertData.filter(alert => !alert.dismissed));
      } catch (error) {
        console.error("Error loading alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [clientId, dataSource]);

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getAlertIcon = (type: AlertType['type']) => {
    const icons = {
      info: <Info className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      error: <AlertTriangle className="h-4 w-4" />,
    };

    return icons[type];
  };

  const getAlertVariant = (type: AlertType['type']) => {
    const variants = {
      info: "border-blue-200 bg-blue-50 text-blue-800",
      warning: "border-warning/20 bg-warning-light text-warning-foreground",
      error: "border-destructive/20 bg-destructive-light text-destructive-foreground",
    };

    return variants[type];
  };

  const formatAlertDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min atrás`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    }
    
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alertas ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum alerta ativo</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tudo funcionando perfeitamente!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} className={cn("relative pr-10", getAlertVariant(alert.type))}>
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1">
                      {alert.title}
                    </div>
                    <AlertDescription className="text-xs">
                      {alert.message}
                    </AlertDescription>
                    <div className="text-xs opacity-70 mt-2">
                      {formatAlertDate(alert.createdAt)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10"
                  onClick={() => dismissAlert(alert.id)}
                  title="Dispensar alerta"
                >
                  <X className="h-3 w-3" />
                </Button>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}