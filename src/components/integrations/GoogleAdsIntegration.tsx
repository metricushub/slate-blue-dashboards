import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";
import { GoogleAdsConnectionModal } from "./GoogleAdsConnectionModal";
import { MccManagerModal } from "./MccManagerModal";

interface GoogleAdsAccount {
  id: string;
  name: string;
  type: string;
  currencyCode: string;
  manager: boolean;
}

interface GoogleAdsStatus {
  hasTokens: boolean;
  lastLogin: string | null;
  accountsCount: number;
  lastIngest: string | null;
}

export function GoogleAdsIntegration() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [status, setStatus] = useState<GoogleAdsStatus>({
    hasTokens: false,
    lastLogin: null,
    accountsCount: 0,
    lastIngest: null
  });
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const { toast } = useToast();
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Check current status
  const checkStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check tokens
      const { data: tokens } = await supabase
        .from('google_tokens')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Check accounts (only non-manager accounts)  
      const { data: accountsData } = await supabase
        .from('accounts_map')
        .select('*')
        .eq('is_manager', false)
        .order('account_name', { ascending: true });

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

      if (accountsData) {
        setAccounts(accountsData.map(acc => ({
          id: acc.customer_id,
          name: acc.account_name || `Account ${acc.customer_id}`,
          type: acc.account_type || 'REGULAR',
          currencyCode: acc.currency_code || 'BRL',
          manager: acc.is_manager || false
        })));
      }

    } catch (error) {
      console.error('Error checking Google Ads status:', error);
    }
  };

  // Connect to Google Ads with 1-click flow
  const handleConnect = async () => {
    console.log('🔄 Iniciando conexão Google Ads...');
    setIsConnecting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('✅ Usuário autenticado:', user.email);

      // Build the OAuth start URL with user_id and next URL
      const startUrl = `https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-oauth/start?user_id=${user.id}&next=${encodeURIComponent(window.location.href)}`;
      console.log('🔗 URL OAuth:', startUrl);
      setFallbackUrl(startUrl);

      // Open popup for OAuth
      console.log('🪟 Abrindo popup OAuth...');
      const popup = window.open(startUrl, 'google_ads_oauth', 'width=500,height=600,scrollbars=yes,resizable=yes');
      if (!popup) {
        console.error('❌ Popup bloqueado');
        toast({
          title: 'Pop-up bloqueado',
          description: 'Permita pop-ups ou use o link "Abrir manualmente" abaixo.',
          variant: 'destructive',
        });
        setIsConnecting(false);
        return;
      }

      toast({ title: 'Conectando', description: 'Autenticando com Google Ads...' });

      // Listen for messages from the OAuth popup
      const messageListener = (event: MessageEvent) => {
        if (event.data?.source === 'metricus:google_oauth') {
          if (event.data.ok) {
            console.log('✅ OAuth concluído com sucesso');
            toast({ title: 'Sucesso', description: 'Conectado ao Google Ads!' });
            // Auto-sync accounts after successful connection
            setTimeout(() => {
              handleSyncAccounts();
            }, 1000);
          } else {
            console.error('❌ OAuth falhou:', event.data.error);
            toast({
              title: 'Erro na autenticação',
              description: event.data.error || 'Falha na autenticação',
              variant: 'destructive',
            });
          }
          window.removeEventListener('message', messageListener);
        }
      };
      
      window.addEventListener('message', messageListener);

      // Check if popup is closed without success
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          console.log('🔄 Popup fechado, verificando status...');
          setTimeout(() => {
            checkStatus();
          }, 500);
          window.removeEventListener('message', messageListener);
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Erro na conexão:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao conectar com Google Ads',
        variant: 'destructive',
      });
      setIsConnecting(false);
    }
  };

  // Sync accounts using the correct function
  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('📥 Sincronizando contas Google Ads...');
      const { data, error } = await supabase.functions.invoke('google-ads-sync-accounts', {
        body: {
          user_id: user.id
        }
      });

      if (error) throw error;

      console.log('✅ Sincronização concluída:', data);
      toast({
        title: "Contas Sincronizadas",
        description: `${data.total || 0} contas encontradas e sincronizadas`,
      });

      // Refresh status
      await checkStatus();

    } catch (error) {
      console.error('Error syncing accounts:', error);
      toast({
        title: "Erro na sincronização",
        description: error.message || "Erro ao sincronizar contas",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Load data (ingest) for selected account
  const handleLoadData = async (customerId: string, accountName: string) => {
    // Check if it's a manager account (not allowed)
    const account = accounts.find(acc => acc.id === customerId);
    if (account?.manager) {
      toast({
        title: "Conta Manager",
        description: "Não é possível carregar dados de contas Manager (MCC). Selecione uma conta filha.",
        variant: "destructive",
      });
      return;
    }

    setIsIngesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log(`📊 Carregando dados da conta ${accountName} (${customerId})...`);
      
      // Use últimos 7 dias como padrão
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const { data, error } = await supabase.functions.invoke('google-ads-ingest', {
        body: {
          user_id: user.id,
          customer_id: customerId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0]
        }
      });

      if (error) throw error;

      toast({
        title: "Dados Carregados",
        description: `${data.records_processed || 0} registros processados para ${accountName}`,
      });

      // Refresh status
      await checkStatus();

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro no carregamento",
        description: error.message || "Erro ao carregar dados da conta",
        variant: "destructive",
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Initialize status check on mount
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="space-y-6" key={`google-ads-${Date.now()}`}>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            🚀 NOVO FLUXO 1-CLIQUE: Google Ads Integration ✅ ATUALIZADO
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Google Ads para importar métricas automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant={status.hasTokens ? "default" : "secondary"}>
                {status.hasTokens ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Último Login</div>
              <div className="text-sm font-medium">
                {status.lastLogin ? new Date(status.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Contas</div>
              <div className="text-sm font-medium">{status.accountsCount}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Última Ingestão</div>
              <div className="text-sm font-medium">
                {status.lastIngest ? new Date(status.lastIngest).toLocaleDateString('pt-BR') : 'Nunca'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!status.hasTokens ? (
              <div className="flex flex-col gap-1">
                <Button onClick={handleConnect} disabled={isConnecting} className="bg-blue-600 hover:bg-blue-700">
                  {isConnecting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  Conectar Google Ads
                </Button>
                {fallbackUrl && (
                  <a
                    href={fallbackUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline text-primary"
                  >
                    Se não abrir, clique aqui para abrir manualmente
                  </a>
                )}
              </div>
            ) : (
              <>
                <Button variant="outline" onClick={handleSyncAccounts} disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar Contas
                </Button>
                <Button
                  onClick={() => setConnectionModalOpen(true)}
                  disabled={accounts.length === 0}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Vincular Contas aos Clientes
                </Button>
                <MccManagerModal />
                <Button variant="outline" onClick={checkStatus}>
                  Atualizar Status
                </Button>
              </>
            )}
          </div>

          {/* Accounts List */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Contas Google Ads (Não-Manager)</h4>
              <div className="text-sm text-muted-foreground">
                Apenas contas não-manager são listadas para carregamento de dados
              </div>
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{account.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {account.id} • {account.type} • {account.currencyCode}
                      {account.manager && (
                        <Badge variant="secondary" className="ml-2">Manager</Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLoadData(account.id, account.name)}
                    disabled={isIngesting}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isIngesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Carregar Dados"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
            <h4 className="font-medium text-sm mb-2">🎯 Fluxo 1-Clique Implementado</h4>
            <div className="text-xs space-y-1">
              <div>✅ OAuth automático com popup</div>
              <div>✅ Sincronização automática após conexão</div>
              <div>✅ Listagem de contas não-manager</div>
              <div>✅ Carregamento de dados com MCC correto (2478435835)</div>
              <div>✅ API v21 com developer-token e headers obrigatórios</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Modal */}
      {connectionModalOpen && (
        <GoogleAdsConnectionModal
          open={connectionModalOpen}
          onOpenChange={setConnectionModalOpen}
        />
      )}
    </div>
  );
}