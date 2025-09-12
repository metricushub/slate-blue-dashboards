import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Database,
  Settings,
  Clock
} from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { toast } from "@/hooks/use-toast";
import { SheetsAdapter } from "@/shared/data-source/adapters/sheets";

export function IntegrationsPage() {
  const { dataSource, sourceType, isLoading, refreshCache } = useDataSource();
  const [cacheStatus, setCacheStatus] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Get Google Sheets configuration
  const spreadsheetId = import.meta.env.VITE_SHEETS_SPREADSHEET_ID;
  const clientsTab = import.meta.env.VITE_SHEETS_TAB_CLIENTS || 'clients';
  const campaignsTab = import.meta.env.VITE_SHEETS_TAB_CAMPAIGNS || 'campaigns';
  const metricsTab = import.meta.env.VITE_SHEETS_TAB_DAILY || 'metrics';
  const refreshInterval = parseInt(import.meta.env.VITE_SHEETS_REFRESH_SEC || '900');

  useEffect(() => {
    if (dataSource instanceof SheetsAdapter) {
      setCacheStatus(dataSource.getCacheStatus());
    }
  }, [dataSource]);

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await refreshCache();
      
      // Update cache status
      if (dataSource instanceof SheetsAdapter) {
        setCacheStatus(dataSource.getCacheStatus());
      }
      
      toast({
        title: "Cache atualizado",
        description: "Os dados foram recarregados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados. Verifique a configuração.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!spreadsheetId) {
      toast({
        title: "Configuração incompleta",
        description: "ID da planilha não configurado no .env",
        variant: "destructive",
      });
      return;
    }

    try {
      const clients = await dataSource.getClients();
      toast({
        title: "Conexão bem-sucedida",
        description: `${clients.length} clientes encontrados na planilha.`,
      });
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: error.message || "Não foi possível conectar à planilha.",
        variant: "destructive",
      });
    }
  };

  const openSpreadsheet = () => {
    if (spreadsheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-muted-foreground">
          Gerencie as conexões com suas fontes de dados
        </p>
      </div>

      {/* Current Data Source */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-primary-light rounded-lg">
              <Database className="w-5 h-5 text-primary" />
            </div>
            Fonte de Dados Ativa
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">
                {sourceType === 'sheets' ? 'Google Sheets' : 'Dados Mock'}
              </p>
              <p className="text-sm text-muted-foreground">
                {sourceType === 'sheets' 
                  ? 'Leitura automática via Google Visualization API'
                  : 'Dados de demonstração para desenvolvimento'
                }
              </p>
            </div>
            <Badge variant={sourceType === 'sheets' ? 'default' : 'secondary'}>
              {sourceType === 'sheets' ? 'Produção' : 'Desenvolvimento'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets Integration */}
      {sourceType === 'sheets' && (
        <Card className="rounded-2xl border border-border bg-card">
          <CardHeader className="p-6">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-success-light rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-success" />
              </div>
              Google Sheets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Configuração</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">ID da Planilha</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono">
                      {spreadsheetId || 'Não configurado'}
                    </code>
                    {spreadsheetId && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={openSpreadsheet}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Intervalo de Refresh</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {Math.floor(refreshInterval / 60)} minutos
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Abas Configuradas</label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{clientsTab}</Badge>
                  <Badge variant="outline">{campaignsTab}</Badge>
                  <Badge variant="outline">{metricsTab}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Status do Cache</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshCache}
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Recarregar Agora
                </Button>
              </div>

              {cacheStatus.length > 0 ? (
                <div className="space-y-3">
                  {cacheStatus.map((status) => (
                    <div key={status.sheet} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-medium">Aba: {status.sheet}</p>
                          <p className="text-sm text-muted-foreground">
                            {status.rowCount} linhas • Última atualização: {status.lastUpdate}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 border border-warning rounded-lg bg-warning-light">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium">Cache vazio</p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Recarregar Agora" para carregar os dados
                    </p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleTestConnection}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Testar Conexão
              </Button>
              
              {spreadsheetId && (
                <Button variant="outline" onClick={openSpreadsheet}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Planilha
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Future Integrations */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
            Integrações Futuras
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-border rounded-lg opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">G</span>
                </div>
                <span className="font-medium">Google Ads</span>
                <Badge variant="secondary">Em breve</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Conecte-se diretamente à API do Google Ads para dados em tempo real
              </p>
            </div>

            <div className="p-4 border border-border rounded-lg opacity-50">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">f</span>
                </div>
                <span className="font-medium">Meta Ads</span>
                <Badge variant="secondary">Em breve</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Integração com Meta Business para campanhas do Facebook e Instagram
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="rounded-2xl border border-border bg-card">
        <CardHeader className="p-6">
          <CardTitle>Como configurar o Google Sheets</CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">1</div>
              <div>
                <p className="font-medium">Crie uma nova planilha no Google Sheets</p>
                <p className="text-sm text-muted-foreground">
                  Configure as abas: <code className="bg-muted px-1 rounded">clients</code>, <code className="bg-muted px-1 rounded">campaigns</code>, <code className="bg-muted px-1 rounded">metrics</code>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">2</div>
              <div>
                <p className="font-medium">Configure as permissões</p>
                <p className="text-sm text-muted-foreground">
                  Compartilhe a planilha como "Qualquer pessoa com o link pode visualizar"
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">3</div>
              <div>
                <p className="font-medium">Configure as variáveis de ambiente</p>
                <p className="text-sm text-muted-foreground">
                  Adicione as variáveis no arquivo .env do projeto
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Exemplo de configuração .env:</p>
            <pre className="text-xs text-muted-foreground">
{`VITE_DATASOURCE=sheets
VITE_SHEETS_SPREADSHEET_ID=1234567890abcdef
VITE_SHEETS_TAB_CLIENTS=clients
VITE_SHEETS_TAB_CAMPAIGNS=campaigns
VITE_SHEETS_TAB_DAILY=metrics
VITE_SHEETS_REFRESH_SEC=900`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}