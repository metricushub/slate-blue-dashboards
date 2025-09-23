import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AccountRow {
  customer_id: string;
  account_name?: string | null;
  status?: string | null;
  currency_code?: string | null;
  time_zone?: string | null;
  is_manager?: boolean | null;
}

interface Props {
  clientId: string;
}

export function ClientGoogleAdsLinker({ clientId }: Props) {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const { toast } = useToast();

  const load = async () => {
    try {
      setLoading(true);
      // Load accounts using edge function (service role)
      const res = await fetch("https://zoahzxfjefjmkxylbfxf.functions.supabase.co/google-ads-accounts");
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Erro ao carregar contas");
      setAccounts(json.rows as AccountRow[]);

      // Load current link
      const { data } = await supabase
        .from("client_access")
        .select("google_ads_customer_id")
        .eq("client_id", clientId)
        .maybeSingle();
      setCurrent((data as any)?.google_ads_customer_id ?? null);
    } catch (e: any) {
      toast({ title: "Erro", description: e.message || "Falha ao carregar contas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId]);

  const options = useMemo(() => {
    const filtered = accounts.filter(a => (a.status || '').toUpperCase() === 'ENABLED');
    return filtered.sort((a, b) => (a.account_name || '').localeCompare(b.account_name || ''));
  }, [accounts]);

  const save = async () => {
    if (!current) {
      toast({ title: "Selecione uma conta", description: "Escolha uma conta para vincular ao cliente.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Upsert client_access
      const { error } = await supabase
        .from("client_access")
        .upsert({ client_id: clientId, google_ads_customer_id: current, has_google_ads_access: true }, { onConflict: "client_id" });
      if (error) throw error;
      toast({ title: "Conta vinculada", description: `Cliente vinculado à conta ${current}.` });
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message || "Falha ao vincular conta", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vincular conta ao cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Conta Google Ads</label>
          <Select value={current ?? undefined} onValueChange={setCurrent} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={loading ? "Carregando contas..." : "Selecione uma conta"} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Contas</SelectLabel>
                {options.map((a) => (
                  <SelectItem key={a.customer_id} value={a.customer_id}>
                    {(a.account_name || `Conta ${a.customer_id}`) + (a.status ? ` • ${a.status}` : "")}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || loading}>
            {saving ? "Salvando..." : "Vincular"}
          </Button>
          <Button variant="outline" onClick={load} disabled={loading}>
            Atualizar lista
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
