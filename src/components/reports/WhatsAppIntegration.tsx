import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Settings,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart3,
  FileText,
  Image,
  Link,
  Zap
} from 'lucide-react';

interface WhatsAppIntegrationProps {
  clientId?: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  type: 'quick_insight' | 'full_report' | 'alert' | 'summary';
  message: string;
  includeImage: boolean;
  includeLink: boolean;
}

const templates: WhatsAppTemplate[] = [
  {
    id: '1',
    name: 'Insight Rápido',
    type: 'quick_insight',
    message: '📊 *Resumo do Dia*\n\n💰 Investimento: R$ {spend}\n🎯 Leads: {leads}\n💡 CPL: R$ {cpl}\n\nTudo funcionando bem! 👍',
    includeImage: false,
    includeLink: true
  },
  {
    id: '2',
    name: 'Relatório Completo',
    type: 'full_report',
    message: '📈 *Relatório {period}*\n\nOlá! Segue o relatório completo da performance:\n\n📊 Veja todos os detalhes no link abaixo:',
    includeImage: true,
    includeLink: true
  },
  {
    id: '3',
    name: 'Alerta de Performance',
    type: 'alert',
    message: '🚨 *Alerta Importante*\n\n{alert_message}\n\nRecomendação: {recommendation}',
    includeImage: false,
    includeLink: true
  },
  {
    id: '4',
    name: 'Resumo Semanal',
    type: 'summary',
    message: '📅 *Resumo da Semana*\n\n✅ Metas alcançadas: {goals}\n📈 Performance: +{growth}%\n💰 ROI: {roi}x\n\nParabéns pela performance! 🎉',
    includeImage: true,
    includeLink: false
  }
];

export function WhatsAppIntegration({ clientId }: WhatsAppIntegrationProps) {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(templates[0]);
  const [testMessage, setTestMessage] = useState('');
  const [testPhone, setTestPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSend, setAutoSend] = useState({
    dailyInsights: false,
    weeklyReports: false,
    alerts: true,
    achievements: false
  });

  const handleTestConnection = async () => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do webhook do Zapier",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          type: 'test_connection',
          timestamp: new Date().toISOString(),
          message: 'Teste de conexão do Metricus',
        }),
      });

      setIsConnected(true);
      toast({
        title: "Conexão testada",
        description: "O webhook foi chamado. Verifique se a mensagem chegou no WhatsApp.",
      });
    } catch (error) {
      console.error("Erro ao testar conexão:", error);
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar ao webhook. Verifique a URL.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testMessage.trim() || !testPhone.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a mensagem e o número de telefone",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify({
          type: 'test_message',
          phone: testPhone,
          message: testMessage,
          template: selectedTemplate.name,
          timestamp: new Date().toISOString(),
        }),
      });

      toast({
        title: "Mensagem enviada",
        description: `Mensagem de teste enviada para ${testPhone}`,
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro no envio",
        description: "Não foi possível enviar a mensagem de teste",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setTestMessage(template.message);
    }
  };

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'quick_insight': return Zap;
      case 'full_report': return FileText;
      case 'alert': return AlertCircle;
      case 'summary': return BarChart3;
      default: return MessageSquare;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      quick_insight: 'Insight Rápido',
      full_report: 'Relatório Completo',
      alert: 'Alerta',
      summary: 'Resumo'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Integração WhatsApp</h2>
          <p className="text-muted-foreground">
            Configure envios automáticos de insights e relatórios via WhatsApp
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="default" className="bg-success text-success-foreground">
              <CheckCircle className="mr-1 h-3 w-3" />
              Conectado
            </Badge>
          ) : (
            <Badge variant="outline">
              <AlertCircle className="mr-1 h-3 w-3" />
              Não conectado
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Configuration */}
        <div className="space-y-6">
          {/* Webhook Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Webhook
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook">URL do Webhook (Zapier)</Label>
                <Input
                  id="webhook"
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                />
                <p className="text-xs text-muted-foreground">
                  Configure um Zap no Zapier com trigger "Webhooks by Zapier" e ação "WhatsApp Business"
                </p>
              </div>
              
              <Button 
                onClick={handleTestConnection} 
                disabled={!webhookUrl || isLoading}
                className="w-full"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                {isLoading ? 'Testando...' : 'Testar Conexão'}
              </Button>
            </CardContent>
          </Card>

          {/* Auto Send Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Envios Automáticos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Insights Diários</Label>
                  <p className="text-sm text-muted-foreground">Resumo da performance do dia</p>
                </div>
                <Switch
                  checked={autoSend.dailyInsights}
                  onCheckedChange={(checked) => 
                    setAutoSend(prev => ({ ...prev, dailyInsights: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Relatórios Semanais</Label>
                  <p className="text-sm text-muted-foreground">Resumo completo da semana</p>
                </div>
                <Switch
                  checked={autoSend.weeklyReports}
                  onCheckedChange={(checked) => 
                    setAutoSend(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Alertas Importantes</Label>
                  <p className="text-sm text-muted-foreground">Notificações sobre anomalias</p>
                </div>
                <Switch
                  checked={autoSend.alerts}
                  onCheckedChange={(checked) => 
                    setAutoSend(prev => ({ ...prev, alerts: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Conquistas</Label>
                  <p className="text-sm text-muted-foreground">Quando metas são atingidas</p>
                </div>
                <Switch
                  checked={autoSend.achievements}
                  onCheckedChange={(checked) => 
                    setAutoSend(prev => ({ ...prev, achievements: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          <Card>
            <CardHeader>
              <CardTitle>Templates de Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {templates.map((template) => {
                const Icon = getTemplateIcon(template.type);
                return (
                  <div
                    key={template.id}
                    className={`p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      selectedTemplate.id === template.id ? 'bg-primary-light border-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-chart-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{getTypeLabel(template.type)}</p>
                      </div>
                      <div className="flex gap-1">
                        {template.includeImage && <Image className="h-3 w-3 text-muted-foreground" />}
                        {template.includeLink && <Link className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Test Panel */}
        <div className="space-y-6">
          {/* Test Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Testar Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Número de Telefone</Label>
                <Input
                  id="phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={8}
                  placeholder="Digite sua mensagem de teste..."
                />
              </div>

              <Button 
                onClick={handleSendTest} 
                disabled={!isConnected || isLoading}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? 'Enviando...' : 'Enviar Teste'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview WhatsApp</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 p-4 rounded-lg">
                <div className="bg-card p-3 rounded-lg shadow-sm max-w-[280px]">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">M</span>
                    </div>
                    <span>Metricus</span>
                    <span>•</span>
                    <span>agora</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm text-foreground">
                    {testMessage || selectedTemplate.message}
                  </div>
                  {selectedTemplate.includeImage && (
                    <div className="mt-2 w-full h-20 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                      📊 Gráfico anexado
                    </div>
                  )}
                  {selectedTemplate.includeLink && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      🔗 Link do relatório
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Uso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mensagens enviadas hoje</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total este mês</span>
                <span className="font-medium">87</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Taxa de entrega</span>
                <span className="font-medium text-success">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Última mensagem</span>
                <span className="font-medium">2 horas atrás</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}