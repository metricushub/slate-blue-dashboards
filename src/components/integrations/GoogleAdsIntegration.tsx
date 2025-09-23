import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

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

  // Connect to Google Ads
  const handleConnect = async () => {
    console.log('🔄 Iniciando conexão Google Ads...');
    setIsConnecting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      console.log('✅ Usuário autenticado:', user.email);

      // Build the direct function URL with start action
      const functionUrl = `https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-oauth`;
      const params = new URLSearchParams({
        action: 'start',
        user_id: user.id,
        return_to: window.location.href,
      });

      const startUrl = `${functionUrl}?${params.toString()}`;
      console.log('🔗 URL gerada:', startUrl);
      setFallbackUrl(startUrl);

      // Test connection to edge function first
      console.log('🧪 Testando conexão com edge function...');
      try {
        const testResponse = await fetch(startUrl, { method: 'HEAD' });
        console.log('📊 Status da edge function:', testResponse.status);
      } catch (testError) {
        console.error('❌ Erro testando edge function:', testError);
      }

      // Open popup directly to our function (which 302 redirects to Google)
      console.log('🪟 Abrindo popup...');
      const popup = window.open(startUrl, '_blank', 'width=500,height=600,scrollbars=yes,resizable=yes');
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

      toast({ title: 'Redirecionando', description: 'Abrindo Google para autenticação...' });

      // When the popup is closed, refresh status
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
          console.log('🔄 Popup fechado, atualizando status...');
          checkStatus();
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

  // Sync accounts
  const handleSyncAccounts = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-ads-sync', {
        body: {
          user_id: user.id,
          company_id: null
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${data.accounts_synced || 0} contas sincronizadas`,
      });

      // Refresh status
      await checkStatus();

    } catch (error) {
      console.error('Error syncing accounts:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao sincronizar contas",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Run test ingestion
  const handleTestIngest = async (customerId: string) => {
    setIsIngesting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('google-ads-ingest', {
        body: {
          user_id: user.id,
          customer_id: customerId,
          manual: true
        }
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Ingestão concluída: ${data.records_processed || 0} registros processados`,
      });

      // Refresh status
      await checkStatus();

    } catch (error) {
      console.error('Error running ingest:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao executar ingestão",
        variant: "destructive",
      });
    } finally {
      setIsIngesting(false);
    }
  };

  // Initialize status check on mount
  useState(() => {
    checkStatus();
  });

  return (
    <div className="space-y-6">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ Configurar Credenciais Google Ads</CardTitle>
          <CardDescription>
            Insira as credenciais corretas do seu projeto no Google Cloud Console
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Client ID (deve terminar com .apps.googleusercontent.com)
            </label>
            <input
              type="text"
              placeholder="67328513712-xxxxxxx.apps.googleusercontent.com"
              className="w-full p-3 border rounded-lg font-mono text-sm"
              id="client-id-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Encontre isso em: Google Cloud Console → Credentials → OAuth 2.0 Client IDs
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Client Secret (deve começar com GOCSPX-)
            </label>
            <input
              type="password"
              placeholder="GOCSPX-xxxxxxxxxxxxxxxx"
              className="w-full p-3 border rounded-lg font-mono text-sm"
              id="client-secret-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Show" ao lado do Client ID no Google Cloud Console
            </p>
          </div>
          <Button 
            onClick={async () => {
              const clientId = (document.getElementById('client-id-input') as HTMLInputElement)?.value.trim();
              const clientSecret = (document.getElementById('client-secret-input') as HTMLInputElement)?.value.trim();
              
              if (!clientId || !clientSecret) {
                toast({
                  title: 'Campos obrigatórios',
                  description: 'Por favor, preencha ambos os campos',
                  variant: 'destructive'
                });
                return;
              }
              
              if (!clientId.includes('.apps.googleusercontent.com')) {
                toast({
                  title: 'Client ID inválido',
                  description: 'Client ID deve terminar com .apps.googleusercontent.com',
                  variant: 'destructive'
                });
                return;
              }
              
              if (!clientSecret.startsWith('GOCSPX-')) {
                toast({
                  title: 'Client Secret inválido',
                  description: 'Client Secret deve começar com GOCSPX-',
                  variant: 'destructive'
                });
                return;
              }
              
              toast({
                title: '✅ Credenciais válidas!',
                description: 'Agora atualize os secrets GOOGLE_ADS_CLIENT_ID e GOOGLE_ADS_CLIENT_SECRET no Supabase dashboard.'
              });
            }}
            className="w-full"
          >
            Validar Credenciais
          </Button>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm">
              <strong>Próximo passo:</strong> Após validar, vá ao Supabase dashboard e atualize os secrets:
              <br />• <code>GOOGLE_ADS_CLIENT_ID</code>
              <br />• <code>GOOGLE_ADS_CLIENT_SECRET</code>
            </p>
          </div>
          
          {/* Debug Section */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-sm mb-2">🔧 Diagnóstico</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  console.log('🧪 Testando edge function diretamente...');
                  const testUrl = 'https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-oauth';
                  try {
                    const response = await fetch(testUrl, { method: 'GET' });
                    console.log('📊 Status:', response.status);
                    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
                    const text = await response.text();
                    console.log('📄 Response:', text);
                    toast({
                      title: 'Teste concluído',
                      description: `Status: ${response.status}. Veja o console para detalhes.`
                    });
                  } catch (error) {
                    console.error('❌ Erro no teste:', error);
                    toast({
                      title: 'Erro no teste',
                      description: error.message,
                      variant: 'destructive'
                    });
                  }
                }}
              >
                Testar Edge Function
              </Button>
              <p className="text-xs text-muted-foreground">
                Abra o console do navegador (F12) para ver os logs detalhados
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">G</span>
            </div>
            Google Ads Integration
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
          <div className="flex gap-2">
            {!status.hasTokens ? (
              <div className="flex flex-col gap-1">
                <Button onClick={handleConnect} disabled={isConnecting}>
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
                <Button variant="outline" onClick={checkStatus}>
                  Atualizar Status
                </Button>
              </>
            )}
          </div>

          {/* Accounts List */}
          {accounts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Contas Vinculadas</h4>
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
                    onClick={() => handleTestIngest(account.id)}
                    disabled={isIngesting}
                  >
                    {isIngesting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Testar Ingestão"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Integration Info */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Funcionalidades Implementadas</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>OAuth2 Flow - Login seguro com Google</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Account Mapping - Listagem de contas MCC/ads</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>GAQL Query - Ingestão de métricas (últimos 7 dias)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Token Security - Armazenamento seguro no servidor</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Ingest Automation - Será implementado em próxima iteração</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}