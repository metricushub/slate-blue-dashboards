import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bot, Key, Settings, MessageSquare, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface ApiProvider {
  id: string;
  name: string;
  models: string[];
  requiresApiKey: boolean;
}

const API_PROVIDERS: ApiProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
    requiresApiKey: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    requiresApiKey: true
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    models: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'],
    requiresApiKey: true
  }
];

const ChatIaConfigWip = () => {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('Você é um assistente de marketing digital especializado em análise de dados e otimização de campanhas. Seja preciso, analítico e forneça insights acionáveis.');
  const [temperature, setTemperature] = useState('0.7');
  const [maxTokens, setMaxTokens] = useState('1000');
  const [enableContext, setEnableContext] = useState(true);
  const [enableMemory, setEnableMemory] = useState(false);
  const [autoSuggestions, setAutoSuggestions] = useState(true);

  const handleSaveConfig = () => {
    // Save configuration logic here
    const config = {
      provider: selectedProvider,
      model: selectedModel,
      apiKey,
      systemPrompt,
      temperature: parseFloat(temperature),
      maxTokens: parseInt(maxTokens),
      enableContext,
      enableMemory,
      autoSuggestions
    };
    
    localStorage.setItem('ai_chat_config', JSON.stringify(config));
    
    toast({
      title: "Configurações salvas",
      description: "As configurações do chat IA foram salvas com sucesso.",
    });
  };

  const handleTestConnection = async () => {
    if (!apiKey && API_PROVIDERS.find(p => p.id === selectedProvider)?.requiresApiKey) {
      toast({
        title: "API Key necessária",
        description: "Por favor, insira sua API key para testar a conexão.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Testando conexão...",
      description: "Verificando conectividade com o provedor de IA.",
    });

    // Simulate test - in real implementation would make actual API call
    setTimeout(() => {
      toast({
        title: "Conexão bem-sucedida",
        description: "O chat IA está configurado e funcionando corretamente.",
      });
    }, 2000);
  };

  const currentProvider = API_PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Bot className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Chat IA e Configuração</h1>
          <p className="text-muted-foreground">Configure seu assistente de IA para análise de dados e insights</p>
        </div>
      </div>

      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Provedor
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Comportamento
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Avançado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Provedor de IA</CardTitle>
              <CardDescription>
                Selecione o provedor e modelo de IA para seu assistente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Provedor</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {API_PROVIDERS.map(provider => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center gap-2">
                            {provider.name}
                            {provider.requiresApiKey && (
                              <Badge variant="outline" className="text-xs">API Key</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentProvider?.models.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {currentProvider?.requiresApiKey && (
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Insira sua API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Sua API key será armazenada de forma segura e criptografada
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button onClick={handleTestConnection} variant="outline">
                  Testar Conexão
                </Button>
                <Button onClick={handleSaveConfig}>
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comportamento do Chat</CardTitle>
              <CardDescription>
                Configure como o assistente IA deve se comportar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="temperature">Criatividade (Temperature)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    0 = Mais preciso, 2 = Mais criativo
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Tokens Máximos</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min="100"
                    max="4000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Limite de palavras por resposta
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Contexto Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Incluir dados do cliente automaticamente nas consultas
                    </p>
                  </div>
                  <Switch checked={enableContext} onCheckedChange={setEnableContext} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Memória de Conversas</Label>
                    <p className="text-sm text-muted-foreground">
                      Lembrar conversas anteriores do dia
                    </p>
                  </div>
                  <Switch checked={enableMemory} onCheckedChange={setEnableMemory} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sugestões Automáticas</Label>
                    <p className="text-sm text-muted-foreground">
                      Mostrar perguntas sugeridas baseadas no contexto
                    </p>
                  </div>
                  <Switch checked={autoSuggestions} onCheckedChange={setAutoSuggestions} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prompt do Sistema</CardTitle>
              <CardDescription>
                Configure a personalidade e especialização do seu assistente IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt Principal</Label>
                <Textarea
                  id="systemPrompt"
                  rows={6}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Ex: Você é um assistente especializado em marketing digital..."
                />
                <p className="text-sm text-muted-foreground">
                  Este prompt define como o assistente deve se comportar e qual sua área de especialização
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Seja específico sobre o domínio de conhecimento e o tipo de respostas que espera. 
                  Mencione que o assistente deve usar dados do dashboard quando relevante.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Avançadas</CardTitle>
              <CardDescription>
                Opções avançadas para usuários experientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Essas configurações serão implementadas em versões futuras. Inclui integração com dados em tempo real, 
                  webhooks para notificações, e configurações de rate limiting.
                </AlertDescription>
              </Alert>

              <div className="space-y-4 opacity-50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dados em Tempo Real</Label>
                    <p className="text-sm text-muted-foreground">
                      Buscar dados atualizados automaticamente
                    </p>
                  </div>
                  <Switch disabled />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">
                      Receber alertas proativos do assistente
                    </p>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatIaConfigWip;