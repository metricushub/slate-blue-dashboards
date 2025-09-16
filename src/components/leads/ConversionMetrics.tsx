import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LeadAnalytics } from '@/types/analytics';
import { TrendingUp, TrendingDown, ArrowRight, Clock, Target, AlertTriangle } from 'lucide-react';

interface ConversionMetricsProps {
  analytics: LeadAnalytics;
}

export function ConversionMetrics({ analytics }: ConversionMetricsProps) {
  const { conversionRates, averageTimeInStage, funnelMetrics, periodComparison } = analytics;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <ArrowRight className="h-4 w-4 text-muted-foreground" />;
  };
  
  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Conversão Geral</p>
                <p className="text-2xl font-bold">{conversionRates.overall}%</p>
              </div>
              <Target className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mt-4">
              <Progress value={conversionRates.overall} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads Totais</p>
                <p className="text-2xl font-bold">{periodComparison.current.totalLeads}</p>
                <div className={`flex items-center gap-1 text-sm ${getGrowthColor(periodComparison.growth.leads)}`}>
                  {getGrowthIcon(periodComparison.growth.leads)}
                  {Math.abs(periodComparison.growth.leads)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita</p>
                <p className="text-2xl font-bold">{formatCurrency(periodComparison.current.revenue)}</p>
                <div className={`flex items-center gap-1 text-sm ${getGrowthColor(periodComparison.growth.revenue)}`}>
                  {getGrowthIcon(periodComparison.growth.revenue)}
                  {Math.abs(periodComparison.growth.revenue)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelMetrics.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{stage.stage}</Badge>
                    <span className="font-medium">{stage.count} leads</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(stage.value)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{stage.conversionRate}%</span>
                    {stage.dropOffRate > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        -{stage.dropOffRate}% drop-off
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={stage.conversionRate} className="h-3" />
                {index < funnelMetrics.length - 1 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversões por Estágio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Taxa de Conversão por Estágio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Novo → Qualificação</p>
              <p className="text-3xl font-bold text-blue-600">{conversionRates.novoToQualificacao}%</p>
              <Progress value={conversionRates.novoToQualificacao} className="mt-2 h-2" />
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Qualificação → Proposta</p>
              <p className="text-3xl font-bold text-orange-600">{conversionRates.qualificacaoToProposta}%</p>
              <Progress value={conversionRates.qualificacaoToProposta} className="mt-2 h-2" />
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Proposta → Fechado</p>
              <p className="text-3xl font-bold text-green-600">{conversionRates.propostaToFechado}%</p>
              <Progress value={conversionRates.propostaToFechado} className="mt-2 h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tempo Médio por Estágio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Tempo Médio por Estágio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Novo</p>
              <p className="text-2xl font-bold">{averageTimeInStage.novo} dias</p>
              {averageTimeInStage.novo > 7 && (
                <Badge variant="outline" className="mt-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Acima da média
                </Badge>
              )}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Qualificação</p>
              <p className="text-2xl font-bold">{averageTimeInStage.qualificacao} dias</p>
              {averageTimeInStage.qualificacao > 14 && (
                <Badge variant="outline" className="mt-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Acima da média
                </Badge>
              )}
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Proposta</p>
              <p className="text-2xl font-bold">{averageTimeInStage.proposta} dias</p>
              {averageTimeInStage.proposta > 21 && (
                <Badge variant="outline" className="mt-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Acima da média
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}