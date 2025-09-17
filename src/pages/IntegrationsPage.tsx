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
  Settings,
  Clock,
  TrendingUp,
  Facebook,
  Chrome,
  Database,
  AlertTriangle
} from "lucide-react";
import { useDataSource } from "@/hooks/useDataSource";
import { toast } from "@/hooks/use-toast";
import { SheetsAdapter } from "@/shared/data-source/adapters/sheets";
import { Link } from "react-router-dom";

export function IntegrationsPage() {
  const { dataSource, sourceType, isLoading, refreshCache } = useDataSource();
  const [cacheStatus, setCacheStatus] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);

  // Get Google Sheets configuration
  const spreadsheetId = import.meta.env.VITE_SHEETS_SPREADSHEET_ID;
  const clientsTab = import.meta.env.VITE_SHEETS_TAB_CLIENTS || 'clients';
  const campaignsTab = import.meta.env.VITE_SHEETS_TAB_CAMPAIGNS || 'campaigns';
  const metricsTab = import.meta.env.VITE_SHEETS_TAB_DAILY || 'metrics';
  const refreshInterval = parseInt(import.meta.env.VITE_SHEETS_REFRESH_SEC || '900');

  const isConnected = sourceType === 'sheets' && spreadsheetId;
  const lastSync = cacheStatus.length > 0 ? cacheStatus[0]?.lastUpdate || 'Nunca' : 'Nunca';

  useEffect(() => {
    if (dataSource instanceof SheetsAdapter && typeof (dataSource as any).getCacheStatus === 'function') {
      setCacheStatus((dataSource as any).getCacheStatus());
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
        description: "ID da planilha não configurado",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    try {
      const clients = await dataSource.getClients();
      toast({
        title: "✅ Conexão bem-sucedida",
        description: `${clients.length} clientes encontrados na planilha.`,
      });
    } catch (error: any) {
      toast({
        title: "❌ Erro de conexão",
        description: error.message || "Não foi possível conectar à planilha.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const openSpreadsheet = () => {
    if (spreadsheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">
          Configure e gerencie integrações com ferramentas externas
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Google Sheets Card - Active */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <span>Google Sheets</span>
                <Badge className={isConnected ? "ml-2 bg-green-100 text-green-800" : "ml-2 bg-red-100 text-red-800"}>
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Info */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spreadsheet ID:</span>
                <code className="text-xs bg-muted px-1 rounded">
                  {spreadsheetId ? `${spreadsheetId.slice(0, 8)}...` : 'Não configurado'}
                </code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abas esperadas:</span>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{clientsTab}</Badge>
                  <Badge variant="outline" className="text-xs">{campaignsTab}</Badge>
                  <Badge variant="outline" className="text-xs">{metricsTab}</Badge>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Última leitura:</span>
                <span className="text-xs">{lastSync}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Linhas por aba:</span>
                <span className="text-xs">
                  {cacheStatus.length > 0 
                    ? cacheStatus.map(s => s.rowCount).join(' / ')
                    : 'Aguardando carregamento'
                  }
                </span>
              </div>
            </div>

            <Separator />
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                {testing ? 'Testando...' : 'Testar'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={openSpreadsheet}
                disabled={!spreadsheetId}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Abrir
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefreshCache}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Recarregando...' : 'Recarregar'}
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                Detalhes
              </Button>
            </div>

            {/* Status Message */}
            {isConnected ? (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>Conexão ativa e funcionando</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
                <AlertTriangle className="w-4 h-4" />
                <span>Configure o ID da planilha</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Google Ads Card - Under Construction */}
        <Card className="relative opacity-75">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Chrome className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span>Google Ads</span>
                <Badge className="ml-2 bg-orange-100 text-orange-800">Em construção</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Integração direta com a API do Google Ads para:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Autenticação OAuth 2.0</li>
                <li>Escolha de contas publicitárias</li>
                <li>Dados em tempo real</li>
                <li>Métricas detalhadas</li>
              </ul>
            </div>

            <Separator />
            
            <Button disabled className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Conectar (Em breve)
            </Button>

            <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">Suportará autenticação e escolha de contas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meta Ads Card - Under Construction */}
        <Card className="relative opacity-75">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Facebook className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span>Meta Ads</span>
                <Badge className="ml-2 bg-orange-100 text-orange-800">Em construção</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Integração com Meta Business para:</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>Campanhas Facebook & Instagram</li>
                <li>Acesso via Meta Graph API</li>
                <li>Métricas unificadas</li>
                <li>Gestão de Business Manager</li>
              </ul>
            </div>

            <Separator />
            
            <Button disabled className="w-full">
              <TrendingUp className="w-4 h-4 mr-2" />
              Conectar (Em breve)
            </Button>

            <div className="p-2 bg-blue-50 rounded text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="font-medium">Suportará autenticação e escolha de contas</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics Footer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="w-4 h-4" />
            Diagnóstico Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Fonte ativa:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Sheets sim" : "Sheets não"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Último refresh:</span>
              <span className="text-xs font-mono">{lastSync}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Cache local ativo:</span>
              <Badge variant="default">sim</Badge>
            </div>
            
            <Link 
              to="/diagnosticos" 
              className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Ver diagnósticos completos →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}