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
    setIsConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Call OAuth function to get auth URL
      const { data, error } = await supabase.functions.invoke('google-oauth', {
        body: {
          action: 'get_auth_url',
          user_id: user.id,
          company_id: null // For now, not linking to specific company
        }
      });

      if (error) throw error;

      // Redirect to Google OAuth
      if (data.auth_url) {
        window.open(data.auth_url, 'google-oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
        
        toast({
          title: "Redirecionando",
          description: "Você será redirecionado para o Google Ads para autenticação",
        });
      }

    } catch (error) {
      console.error('Error connecting to Google Ads:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar com Google Ads",
        variant: "destructive",
      });
    } finally {
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
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Conectar Google Ads
              </Button>
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