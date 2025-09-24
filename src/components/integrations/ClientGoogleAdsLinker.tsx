import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface LinkedAccount {
  customer_id: string;
  descriptive_name?: string | null;
}

interface AvailableAccount {
  customer_id: string;
  account_name?: string | null;
  status?: string | null;
  is_manager?: boolean | null;
}

interface Props {
  clientId: string;
}

export function ClientGoogleAdsLinker({ clientId }: Props) {
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccount[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([]);
  const [tokenAccount, setTokenAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      
      // Load linked accounts for this client
      const { data: linkedData, error: linkedError } = await supabase
        .from("google_ads_connections")
        .select(`
          customer_id,
          accounts_map!inner(account_name)
        `)
        .eq("client_id", clientId);
        
      if (linkedError) throw linkedError;
      
      const linked = (linkedData || []).map(item => ({
        customer_id: item.customer_id,
        descriptive_name: (item as any).accounts_map?.account_name || null
      }));
      setLinkedAccounts(linked);

      // Load available accounts (not linked yet)
      const { data: allAccounts, error: accountsError } = await supabase
        .from("accounts_map")
        .select("customer_id, account_name, status, is_manager")
        .eq("status", "ENABLED")
        .not("is_manager", "is", true);
        
      if (accountsError) throw accountsError;

      // Filter out already linked accounts
      const linkedIds = linked.map(l => l.customer_id);
      const available = (allAccounts || []).filter(acc => !linkedIds.includes(acc.customer_id));
      setAvailableAccounts(available);

      // Get token account info
      const { data: tokenData } = await supabase
        .from("google_tokens")
        .select("customer_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();
      setTokenAccount(tokenData?.customer_id || null);

    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao carregar contas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const sortedAvailableAccounts = useMemo(() => {
    return availableAccounts.sort((a, b) => 
      (a.account_name || '').localeCompare(b.account_name || '')
    );
  }, [availableAccounts]);

  const linkAccount = async () => {
    if (!selectedAccount) {
      toast({ title: "Selecione uma conta", description: "Escolha uma conta para vincular ao cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("google_ads_connections")
        .upsert(
          { 
            user_id: user.data.user.id,
            client_id: clientId, 
            customer_id: selectedAccount 
          }, 
          { 
            onConflict: "user_id,customer_id",
            ignoreDuplicates: false
          }
        );
      if (error) throw error;
      
      toast({ title: "Conta vinculada", description: `Conta ${selectedAccount} vinculada com sucesso.` });
      setSelectedAccount(null);
      await load(); // Refresh data
    } catch (e: any) {
      toast({ title: "Erro ao vincular", description: e.message || "Falha ao vincular conta", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const unlinkAccount = async (customerId: string) => {
    setSaving(true);
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("google_ads_connections")
        .delete()
        .eq("user_id", user.data.user.id)
        .eq("customer_id", customerId)
        .eq("client_id", clientId);
      
      if (error) throw error;
      
      toast({ title: "Conta desvinculada", description: `Conta ${customerId} desvinculada com sucesso.` });
      await load(); // Refresh data
    } catch (e: any) {
      toast({ title: "Erro ao desvincular", description: e.message || "Falha ao desvincular conta", variant: "destructive" });
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
        {/* Token Account Info */}
        {tokenAccount && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Conta de Autenticação</label>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Badge variant="secondary">Conta do Token</Badge>
              <span className="text-sm">{tokenAccount}</span>
            </div>
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
                      {account.descriptive_name || `Account ${account.customer_id}`}
                    </span>
                    <span className="text-xs text-muted-foreground">({account.customer_id})</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => unlinkAccount(account.customer_id)}
                    disabled={saving}
                  >
                    Desvincular
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
                <SelectLabel>Contas Disponíveis</SelectLabel>
                {sortedAvailableAccounts.map((account) => (
                  <SelectItem key={account.customer_id} value={account.customer_id}>
                    {account.account_name || `Account ${account.customer_id}`}
                  </SelectItem>
                ))}
                {sortedAvailableAccounts.length === 0 && (
                  <SelectItem value="" disabled>
                    Nenhuma conta disponível
                  </SelectItem>
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={linkAccount} disabled={saving || loading || !selectedAccount}>
            {saving ? "Vinculando..." : "Vincular Conta"}
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            Atualizar Lista
          </Button>
        </div>

        <Separator />
        <p className="text-sm text-muted-foreground">
          Após vincular, o painel do cliente usará essa conta para métricas e diagnósticos.
        </p>
      </CardContent>
    </Card>
  );
}
