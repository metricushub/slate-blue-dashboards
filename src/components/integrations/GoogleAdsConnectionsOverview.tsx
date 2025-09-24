import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, Users, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ConnectionWithClient {
  customer_id: string;
  client_id: string;
  account_name: string;
  client_name: string;
}

export function GoogleAdsConnectionsOverview() {
  const [connections, setConnections] = useState<ConnectionWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadConnections = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all connections with client and account details
      const { data, error } = await supabase
        .from("google_ads_connections")
        .select(`
          customer_id,
          client_id,
          clients!inner(name),
          accounts_map!inner(account_name)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const formatted = (data || []).map(item => ({
        customer_id: item.customer_id,
        client_id: item.client_id,
        account_name: (item as any).accounts_map?.account_name || `Account ${item.customer_id}`,
        client_name: (item as any).clients?.name || "Cliente desconhecido"
      }));

      setConnections(formatted);
    } catch (e: any) {
      toast({ 
        title: "Erro", 
        description: e.message || "Falha ao carregar vinculações", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const removeConnection = async (customerId: string, clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("google_ads_connections")
        .delete()
        .eq("user_id", user.id)
        .eq("customer_id", customerId)
        .eq("client_id", clientId);

      if (error) throw error;

      toast({ 
        title: "Vinculação removida", 
        description: `Conta ${customerId} desvinculada com sucesso.`
      });
      
      await loadConnections(); // Refresh
    } catch (e: any) {
      toast({ 
        title: "Erro", 
        description: e.message || "Falha ao remover vinculação", 
        variant: "destructive" 
      });
    }
  };

  useEffect(() => { loadConnections(); }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Contas Vinculadas aos Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Carregando vinculações...</div>
        ) : connections.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <div className="text-sm text-muted-foreground">
              💡 Nenhuma conta Google Ads vinculada a clientes ainda.
            </div>
            <div className="text-xs text-muted-foreground">
              Para vincular, acesse a página de configuração de cada cliente.
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {connections.map((conn) => (
              <div key={`${conn.customer_id}-${conn.client_id}`} 
                   className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="bg-green-600">
                    Ativa
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">
                      {conn.account_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cliente: {conn.client_name} • ID: {conn.customer_id}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/cliente/${conn.client_id}/config-dados/google-ads`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => removeConnection(conn.customer_id, conn.client_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator />

        <div className="text-xs text-muted-foreground">
          <strong>💡 Como vincular:</strong> Acesse cada cliente individualmente e use 
          "Configurações → Dados → Google Ads" para vincular uma conta específica.
        </div>
      </CardContent>
    </Card>
  );
}