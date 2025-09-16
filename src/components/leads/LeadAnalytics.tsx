import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConversionMetrics } from './ConversionMetrics';
import { Lead } from '@/types';
import { LeadAnalyticsService } from '@/lib/leadAnalytics';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  PieChart,
  Clock,
  Target
} from 'lucide-react';

interface LeadAnalyticsProps {
  leads: Lead[];
  previousPeriodLeads?: Lead[];
}

export function LeadAnalytics({ leads, previousPeriodLeads = [] }: LeadAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const analytics = LeadAnalyticsService.generateAnalytics(leads, previousPeriodLeads);
  const { lossReasons } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Analytics do Funil de Vendas</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="conversion" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Conversão
          </TabsTrigger>
          <TabsTrigger value="loss-analysis" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Análise de Perdas
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Tempo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <ConversionMetrics analytics={analytics} />
        </TabsContent>

        <TabsContent value="conversion" className="mt-6">
          <ConversionMetrics analytics={analytics} />
        </TabsContent>

        <TabsContent value="loss-analysis" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Motivos de Perda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Principais Motivos de Perda
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lossReasons.length > 0 ? (
                  <div className="space-y-4">
                    {lossReasons.slice(0, 6).map((reason, index) => (
                      <div key={reason.reason} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-sm font-medium text-red-700">
                            {index + 1}
                          </div>
                          <span className="font-medium text-sm">{reason.reason}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{reason.count}</p>
                          <p className="text-xs text-muted-foreground">{reason.percentage}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhuma perda registrada ainda</p>
                    <p className="text-sm">Registre motivos de perda para análise</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações Recomendadas */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Recomendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.conversionRates.novoToQualificacao < 50 && (
                    <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">
                        Baixa qualificação de leads novos ({analytics.conversionRates.novoToQualificacao}%)
                      </h4>
                      <p className="text-sm text-orange-700">
                        Revise o processo de qualificação e critérios de leads
                      </p>
                    </div>
                  )}
                  
                  {analytics.conversionRates.propostaToFechado < 30 && (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">
                        Taxa de fechamento baixa ({analytics.conversionRates.propostaToFechado}%)
                      </h4>
                      <p className="text-sm text-red-700">
                        Analise objeções e melhore processo de negociação
                      </p>
                    </div>
                  )}
                  
                  {analytics.averageTimeInStage.proposta > 21 && (
                    <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Propostas demoram muito para fechar ({analytics.averageTimeInStage.proposta} dias)
                      </h4>
                      <p className="text-sm text-yellow-700">
                        Estabeleça prazos claros e faça follow-up ativo
                      </p>
                    </div>
                  )}
                  
                  {lossReasons.length === 0 && (
                    <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">
                        Registre motivos de perda
                      </h4>
                      <p className="text-sm text-blue-700">
                        Comece a registrar por que leads são perdidos para identificar padrões
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timing" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise de Tempo no Funil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-medium mb-2">Tempo Total no Funil</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {analytics.averageTimeInStage.novo + 
                     analytics.averageTimeInStage.qualificacao + 
                     analytics.averageTimeInStage.proposta} dias
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Média completa</p>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-medium mb-2">Estágio Mais Lento</h3>
                  <p className="text-3xl font-bold text-orange-600">
                    {Math.max(
                      analytics.averageTimeInStage.novo,
                      analytics.averageTimeInStage.qualificacao,
                      analytics.averageTimeInStage.proposta
                    )} dias
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analytics.averageTimeInStage.proposta >= analytics.averageTimeInStage.qualificacao &&
                     analytics.averageTimeInStage.proposta >= analytics.averageTimeInStage.novo
                      ? 'Proposta'
                      : analytics.averageTimeInStage.qualificacao >= analytics.averageTimeInStage.novo
                      ? 'Qualificação'
                      : 'Novo'
                    }
                  </p>
                </div>
                
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-medium mb-2">Meta Ideal</h3>
                  <p className="text-3xl font-bold text-green-600">30 dias</p>
                  <p className="text-sm text-muted-foreground mt-1">Ciclo completo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}