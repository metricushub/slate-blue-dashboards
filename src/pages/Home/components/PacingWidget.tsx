import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, Settings } from 'lucide-react';

interface PacingData {
  spending: {
    current: number;
    target: number;
    percentage: number;
  };
  leads: {
    current: number;
    target: number;
    percentage: number;
  };
}

interface PacingWidgetProps {
  data?: PacingData;
  hasIntegration: boolean;
  onSetupIntegration: () => void;
}

export const PacingWidget = ({ data, hasIntegration, onSetupIntegration }: PacingWidgetProps) => {
  if (!hasIntegration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pacing do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Configure as integrações para visualizar o pacing geral do mês
            </p>
            <Button variant="outline" onClick={onSetupIntegration}>
              Configurar Integrações
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pacing do Mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Carregando dados de pacing...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isSpendingOnTrack = data.spending.percentage >= 80 && data.spending.percentage <= 120;
  const isLeadsOnTrack = data.leads.percentage >= 80 && data.leads.percentage <= 120;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Pacing do Mês
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Spending Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Investimento</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                R$ {data.spending.current.toLocaleString('pt-BR')} / R$ {data.spending.target.toLocaleString('pt-BR')}
              </span>
              {!isSpendingOnTrack && <AlertTriangle className="h-4 w-4 text-warning" />}
            </div>
          </div>
          <Progress 
            value={Math.min(data.spending.percentage, 100)} 
            className={`h-2 ${!isSpendingOnTrack ? 'bg-warning/20' : ''}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {data.spending.percentage.toFixed(1)}% da meta mensal
          </p>
        </div>

        {/* Leads Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Leads</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {data.leads.current} / {data.leads.target}
              </span>
              {!isLeadsOnTrack && <AlertTriangle className="h-4 w-4 text-warning" />}
            </div>
          </div>
          <Progress 
            value={Math.min(data.leads.percentage, 100)} 
            className={`h-2 ${!isLeadsOnTrack ? 'bg-warning/20' : ''}`}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {data.leads.percentage.toFixed(1)}% da meta mensal
          </p>
        </div>

        {/* Status Summary */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span>Status Geral:</span>
            <span className={`font-medium ${
              isSpendingOnTrack && isLeadsOnTrack 
                ? 'text-success' 
                : 'text-warning'
            }`}>
              {isSpendingOnTrack && isLeadsOnTrack ? 'No trilho' : 'Atenção necessária'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};