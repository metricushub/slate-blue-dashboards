import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Chrome, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle, 
  Settings,
  TrendingUp,
  Loader2,
  AlertTriangle
} from "lucide-react";

interface GoogleAdsStatus {
  hasTokens: boolean;
  lastLogin: string | null;
  accountsCount: number;
  lastIngest: string | null;
}

export function GoogleAdsIntegrationCard() {
  const [status, setStatus] = useState<GoogleAdsStatus>({
    hasTokens: false,
    lastLogin: null,
    accountsCount: 0,
    lastIngest: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check current status
  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check tokens
      const { data: tokens } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Check accounts
      const { data: accountsData } = await supabase
        .from('accounts_map')
        .select('*')
        .order('created_at', { ascending: false });

      // Check last ingest
      const { data: ingests } = await supabase
        .from('google_ads_ingestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

      setStatus({
        hasTokens: tokens && tokens.length > 0,
        lastLogin: tokens?.[0]?.created_at || null,
        accountsCount: accountsData?.length || 0,
        lastIngest: ingests?.[0]?.completed_at || null
      });

    } catch (error) {
      console.error('Error checking Google Ads status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to Google Ads
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Ensure we pass the current user_id to the OAuth state so tokens are linked correctly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Faça login',
          description: 'Você precisa estar autenticado para conectar ao Google Ads.',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      const functionsHost = "https://zoahzxfjefjmkxylbfxf.functions.supabase.co";
      const connectUrl = `${functionsHost}/google-oauth/start?next=/integracoes&user_id=${encodeURIComponent(user.id)}`;
      
      // Set up message listener before opening popup
      const onMessage = (event: MessageEvent) => {
        if (event.data?.source === 'metricus:google_oauth') {
          if (event.data.ok) {
            // Success!
            clearInterval(checkClosed);
            window.removeEventListener('message', onMessage);
            
            if (popup && !popup.closed) {
              popup.close();
            }
            
            setIsConnecting(false);
            checkStatus(); // Refresh status
            
            toast({
              title: 'Conectado com sucesso!',
              description: 'Sua conta Google Ads foi conectada.',
            });
          } else {
            // Error
            clearInterval(checkClosed);
            window.removeEventListener('message', onMessage);
            
            if (popup && !popup.closed) {
              popup.close();
            }
            
            setIsConnecting(false);
            
            toast({
              title: 'Erro na conexão',
              description: event.data.error || 'Falha ao conectar com Google Ads.',
              variant: 'destructive',
            });
          }
        }
      };
      
      window.addEventListener('message', onMessage);
      
      const popup = window.open(connectUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
      if (!popup) {
        window.removeEventListener('message', onMessage);
        toast({
          title: 'Popup bloqueado',
          description: 'Por favor, permita popups para este site e tente novamente.',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      // Poll for popup closure as backup
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', onMessage);
          setIsConnecting(false);
          // Don't show success toast here as it might be an error closure
          checkStatus(); // Still refresh status
        }
      }, 1000);

      // Set timeout for the popup
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', onMessage);
          setIsConnecting(false);
          toast({
            title: 'Tempo esgotado',
            description: 'A conexão demorou muito para ser concluída.',
            variant: 'destructive',
          });
        }
      }, 60000); // 1 minute timeout

    } catch (error: any) {
      console.error("Error connecting:", error);
      setIsConnecting(false);
      toast({
        title: 'Erro',
        description: 'Erro ao conectar com Google Ads. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Sync accounts
  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    try {
      const functionsHost = "https://zoahzxfjefjmkxylbfxf.functions.supabase.co";
      const response = await fetch(`${functionsHost}/google-ads-sync-accounts`);
      const data = await response.json();
      
      if (data.ok) {
        toast({
          title: "Sincronização concluída",
          description: `${data.total || 0} contas sincronizadas`,
        });
        await checkStatus();
      } else {
        throw new Error(data.error || 'Erro na sincronização');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao sincronizar contas",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Test ingest with first available account
  const handleTestIngest = async () => {
    setIsIngesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Erro',
          description: 'Usuário não autenticado',
          variant: 'destructive',
        });
        return;
      }

      // Get the first customer_id from google_tokens
      const { data: tokens } = await supabase
        .from('google_tokens')
        .select('customer_id')
        .eq('user_id', user.id)
        .not('customer_id', 'is', null)
        .limit(1);

      if (!tokens || tokens.length === 0 || !tokens[0].customer_id) {
        toast({
          title: 'Erro',
          description: 'Nenhuma conta Google Ads encontrada. Sincronize primeiro.',
          variant: 'destructive',
        });
        return;
      }

      const customerId = tokens[0].customer_id;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days
      const endDate = new Date();

      toast({
        title: 'Iniciando teste de ingestão',
        description: `Testando com conta ${customerId}...`,
      });

      console.log('Calling ingest function with:', {
        user_id: user.id,
        customer_id: customerId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      });

      const response = await fetch('https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-ads-ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          customer_id: customerId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
      }

      if (data?.ok) {
        toast({
          title: 'Teste de ingestão concluído!',
          description: `${data.records_processed || 0} registros processados`,
        });
        await checkStatus(); // Refresh status
      } else {
        toast({
          title: 'Erro no teste de ingestão', 
          description: data?.error || 'Erro desconhecido na ingestão',
          variant: 'destructive',
        });
        return;
      }

    } catch (error: any) {
      console.error('Error testing ingest:', error);
      toast({
        title: 'Erro no teste de ingestão',
        description: error?.message || 'Falha ao testar ingestão de dados',
        variant: 'destructive',
      });
    } finally {
      setIsIngesting(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const isConnected = status.hasTokens;
  const lastSync = status.lastLogin 
    ? new Date(status.lastLogin).toLocaleDateString('pt-BR')
    : 'Nunca';

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Chrome className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span>Google Ads</span>
            <Badge className={isConnected ? "ml-2 bg-green-100 text-green-800" : "ml-2 bg-red-100 text-red-800"}>
              {isLoading ? 'Verificando...' : (isConnected ? 'Conectado' : 'Desconectado')}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Info */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status OAuth:</span>
            <span className="text-xs">
              {isLoading ? 'Carregando...' : (isConnected ? 'Tokens válidos' : 'Não conectado')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Contas vinculadas:</span>
            <span className="text-xs">{status.accountsCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última conexão:</span>
            <span className="text-xs">{lastSync}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última ingestão:</span>
            <span className="text-xs">
              {status.lastIngest 
                ? new Date(status.lastIngest).toLocaleDateString('pt-BR')
                : 'Nunca'
              }
            </span>
          </div>
        </div>

        <Separator />
        
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {!isConnected ? (
            <>
              <Button 
                variant="default"
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting || isLoading}
                className="col-span-2"
              >
                {isConnecting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <ExternalLink className="w-4 h-4 mr-1" />
                )}
                {isConnecting ? 'Conectando...' : 'Conectar Google Ads'}
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Settings className="w-4 h-4 mr-1" />
                Configurar
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline"
                size="sm"
                onClick={handleSyncAccounts}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={checkStatus}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="col-span-2"
                onClick={handleTestIngest}
                disabled={isIngesting}
              >
                {isIngesting ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-1" />
                )}
                {isIngesting ? 'Testando...' : 'Testar Ingestão'}
              </Button>
            </>
          )}
        </div>

        {/* Status Message */}
        {isConnected ? (
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>Integração ativa e funcionando</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm text-yellow-700">
            <AlertTriangle className="w-4 h-4" />
            <span>Conecte sua conta Google Ads para começar</span>
          </div>
        )}

        {/* Features */}
        <div className="text-xs text-muted-foreground">
          <p><strong>Recursos:</strong> OAuth 2.0, Sync automático, Métricas em tempo real</p>
        </div>
      </CardContent>
    </Card>
  );
}