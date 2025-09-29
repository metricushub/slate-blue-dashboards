import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, RefreshCw, CheckCircle } from "lucide-react";
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
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [linkCustomerId, setLinkCustomerId] = useState<string | null>(null);
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

      // List all accessible accounts via RPC (filters manager accounts server-side or we filter here)
      const { data: accountsData, error: accountsError } = await supabase.rpc('list_ads_accounts');
      if (accountsError) {
        console.error('RPC list_ads_accounts error:', accountsError);
      }
      const nonManagerAccounts = (accountsData || []).filter((a: any) => !a.is_manager);

      // Check last ingest
      const { data: ingests } = await supabase
        .from('google_ads_ingestions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

      setStatus({
        hasTokens: !!(tokens && tokens.length > 0),
        lastLogin: tokens?.[0]?.created_at || null,
        accountsCount: nonManagerAccounts.length,
        lastIngest: ingests?.[0]?.completed_at || null
      });

      setAccounts(nonManagerAccounts.map((acc: any) => ({
        id: acc.customer_id,
        name: acc.name || `Account ${acc.customer_id}`,
        type: 'REGULAR',
        currencyCode: 'BRL',
        manager: !!acc.is_manager
      })));

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
            setIsConnecting(false);
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
            setIsConnecting(false);
          }
          window.removeEventListener('message', messageListener);
        }
      };
      window.addEventListener('message', messageListener);

      // Also detect popup close without success
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          console.log('🔄 Popup fechado, verificando status...');
          setTimeout(() => { checkStatus(); }, 500);
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

  // Helper: try multiple function names (avoid adblock on 'ads')
  const invokeFunctionWithFallback = async <T=any>(names: string[], body: any): Promise<{ data: T | null; error: any | null }> => {
    for (const name of names) {
      try {
        const { data, error } = await supabase.functions.invoke(name, { body });
        if (!error) return { data, error: null };
      } catch (e) {
        // continue to next
        continue;
      }
    }
    return { data: null, error: new Error('Nenhuma Edge Function disponível: ' + names.join(', ')) };
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
      const { data, error } = await invokeFunctionWithFallback(
        ['ga-sync-accounts', 'google-ads-sync-accounts'],
        { user_id: user.id }
      );

      if (error) throw error;

      console.log('✅ Sincronização concluída:', data);
      toast({
        title: 'Contas Sincronizadas',
        description: `${data?.total || 0} contas encontradas e sincronizadas`,
      });

      // Refresh status
      await checkStatus();

    } catch (error: any) {
      console.error('Error syncing accounts:', error);
      const isAdblock = String(error?.message || '').toLowerCase().includes('failed to send') || String(error?.name||'').includes('FunctionsFetchError');
      toast({
        title: 'Erro na sincronização',
        description: isAdblock ? 'Parece que um bloqueador de anúncios impediu a chamada. Tente em janela anônima ou desative o bloqueador para este site.' : (error?.message || 'Erro ao sincronizar contas'),
        variant: 'destructive',
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
        title: 'Conta Manager',
        description: 'Não é possível carregar dados de contas Manager (MCC). Selecione uma conta filha.',
        variant: 'destructive',
      });
      return;
    }

    setLoadingIds((prev) => {
      const next = new Set(prev);
      next.add(customerId);
      return next;
    });
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

      const { data, error } = await invokeFunctionWithFallback(
        ['ga-ingest', 'google-ads-ingest'],
        {
          user_id: user.id,
          customer_id: customerId,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          allow_fallback_no_mcc: true,
        }
      );

      if (error) throw error;

      toast({
        title: 'Dados Carregados',
        description: `${data.records_processed || 0} registros processados para ${accountName}`,
      });

      // Refresh status
      await checkStatus();

    } catch (error: any) {
      console.error('Error loading data:', error);
      const isAdblock = String(error?.message || '').toLowerCase().includes('failed to send') || String(error?.name||'').includes('FunctionsFetchError');
      toast({
        title: 'Erro no carregamento',
        description: isAdblock ? 'Bloqueador de anúncios pode ter bloqueado a função. Tente janela anônima ou desative o bloqueador neste domínio.' : (error?.message || 'Erro ao carregar dados da conta'),
        variant: 'destructive',
      });
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
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

          {/* Important Notice */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-200">
                  ✅ Modo Fallback Ativado
                </h4>
                <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                  <p>A integração funcionará mesmo sem MCC correto. O sistema tentará carregar dados diretamente das contas acessíveis.</p>
                  <p className="mt-2"><strong>Status:</strong> Pronto para carregar dados com developer token Basic.</p>
                </div>
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
                  onClick={() => { setLinkCustomerId(null); setConnectionModalOpen(true); }}
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setLinkCustomerId(account.id); setConnectionModalOpen(true); }}
                      title="Abrir vinculação de cliente"
                    >
                      Vincular Cliente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadData(account.id, account.name)}
                      disabled={loadingIds.has(account.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loadingIds.has(account.id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Carregar dados"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
            <h4 className="font-medium text-sm mb-2">🎯 Integração Google Ads - Modo Fallback</h4>
            <div className="text-xs space-y-1">
              <div>✅ OAuth automático com popup</div>
              <div>✅ Sincronização automática após conexão</div>
              <div>✅ Listagem de contas acessíveis</div>
              <div>✅ Carregamento de dados SEM MCC (modo fallback)</div>
              <div>✅ API v21 com developer-token Basic</div>
              <div>🔥 <strong>FUNCIONA AGORA:</strong> Não precisa de MCC correto!</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Modal */}
      {connectionModalOpen && (
        <GoogleAdsConnectionModal
          open={connectionModalOpen}
          onOpenChange={setConnectionModalOpen}
          prefillCustomerId={linkCustomerId || undefined}
        />
      )}
    </div>
  );
}
