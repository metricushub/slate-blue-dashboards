import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";

interface GoogleAdsAccount {
  customer_id: string;
  name: string;
  is_manager: boolean;
  is_linked: boolean;
  client_id?: string;
}

interface Props {
  clientId: string;
}

export function ClientGoogleAdsLinker({ clientId }: Props) {
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      
      // Usar a nova função RPC para listar contas
      const { data, error } = await supabase.rpc('list_ads_accounts');
      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      console.log('GoogleAds accounts from RPC:', data);
      setAccounts(data || []);
      
    } catch (error: any) {
      console.error('Erro ao carregar contas:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao carregar contas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [clientId]);

  // Separar contas vinculadas e disponíveis
  const linkedAccounts = useMemo(() => {
    return accounts.filter(acc => acc.is_linked && acc.client_id === clientId);
  }, [accounts, clientId]);

  const availableAccounts = useMemo(() => {
    return accounts
      .filter(acc => !acc.is_linked)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [accounts]);

  const linkAccount = async () => {
    if (!selectedAccount) {
      toast({ 
        title: "Selecione uma conta", 
        description: "Escolha uma conta para vincular ao cliente.", 
        variant: "destructive" 
      });
      return;
    }
    
    setSaving(true);
    try {
      // Usar a nova função RPC para vincular conta
      const { error } = await supabase.rpc('link_ads_account', {
        p_customer_id: selectedAccount,
        p_client_id: clientId,
      });

      if (error) {
        console.error('Link error:', error);
        throw error;
      }

      toast({
        title: "Conta vinculada",
        description: `Conta ${selectedAccount} vinculada com sucesso.`,
      });

      setSelectedAccount(null);
      await load();
    } catch (error: any) {
      console.error('Erro ao vincular conta:', error);
      toast({
        title: "Erro ao vincular",
        description: error.message || "Falha ao vincular conta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const unlinkAccount = async (customerId: string) => {
    setSaving(true);
    try {
      // Usar a nova função RPC para desvincular conta
      const { error } = await supabase.rpc('unlink_ads_account', {
        p_customer_id: customerId,
      });

      if (error) {
        console.error('Unlink error:', error);
        throw error;
      }

      toast({
        title: "Conta desvinculada",
        description: `Conta ${customerId} desvinculada com sucesso.`,
      });

      await load();
    } catch (error: any) {
      console.error('Erro ao desvincular conta:', error);
      toast({
        title: "Erro ao desvincular",
        description: error.message || "Falha ao desvincular conta",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vincular conta ao cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            Total contas: {accounts.length} | 
            Vinculadas: {linkedAccounts.length} | 
            Disponíveis: {availableAccounts.length}
          </div>
        )}

        {/* Linked Accounts */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Contas Vinculadas</label>
          {linkedAccounts.length === 0 ? (
            <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg border">
              💡 Nenhuma conta vinculada ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {linkedAccounts.map((account) => (
                <div key={account.customer_id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">Vinculada</Badge>
                    <span className="text-sm font-medium">
                      {account.name}
                    </span>
                    <span className="text-xs text-muted-foreground">({account.customer_id})</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => unlinkAccount(account.customer_id)}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desvincular"}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Accounts for Linking */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Vincular Nova Conta</label>
          <Select value={selectedAccount ?? undefined} onValueChange={setSelectedAccount} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? "Carregando contas..." : "Selecione uma conta para vincular"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Contas Disponíveis ({availableAccounts.length})</SelectLabel>
                {availableAccounts.map((account) => (
                  <SelectItem key={account.customer_id} value={account.customer_id}>
                    {account.name}
                  </SelectItem>
                ))}
                {availableAccounts.length === 0 && (
                  <SelectItem value="" disabled>
                    {loading ? "Carregando..." : "Nenhuma conta disponível"}
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={linkAccount} 
            disabled={saving || loading || !selectedAccount || availableAccounts.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Vinculando...
              </>
            ) : (
              "Vincular Conta"
            )}
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar Lista
              </>
            )}
          </Button>
        </div>

        <Separator />
        <div className="text-sm text-muted-foreground">
          <p>
            Após vincular, o painel do cliente usará essa conta para métricas e diagnósticos.
          </p>
          {availableAccounts.length === 0 && !loading && (
            <p className="text-orange-600 mt-2">
              ⚠️ Para ter contas disponíveis, primeiro sincronize suas contas na página de Integrações.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}