import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Link, X, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GoogleAccount {
  customer_id: string;
  account_name?: string;
}

interface Client {
  id: string;
  name: string;
}

interface Connection {
  customer_id: string;
  client_id: string;
  client_name: string;
}

interface GoogleAdsConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleAdsConnectionModal({ open, onOpenChange }: GoogleAdsConnectionModalProps) {
  const { toast } = useToast();
  
  const [googleAccounts, setGoogleAccounts] = useState<GoogleAccount[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar dados ao abrir o modal
  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadGoogleAccounts(),
        loadClients(),
        loadConnections()
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGoogleAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts_map')
      .select('customer_id, account_name')
      .order('account_name');
    
    if (error) throw error;
    setGoogleAccounts(data || []);
  };

  const loadClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, name')
      .order('name');
    
    if (error) throw error;
    setClients(data || []);
  };

  const loadConnections = async () => {
    const { data, error } = await supabase
      .from('google_ads_connections')
      .select(`
        customer_id,
        client_id,
        clients!inner(name)
      `);
    
    if (error) throw error;
    
    const formattedConnections = data?.map(conn => ({
      customer_id: conn.customer_id,
      client_id: conn.client_id,
      client_name: (conn.clients as any)?.name || 'Cliente não encontrado'
    })) || [];
    
    setConnections(formattedConnections);
  };

  const handleSaveConnection = async () => {
    if (!selectedCustomerId || !selectedClientId) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma conta Google Ads e um cliente interno.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('google_ads_connections')
        .upsert({
          customer_id: selectedCustomerId,
          client_id: selectedClientId,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Conexão salva",
        description: "A conta Google Ads foi vinculada ao cliente com sucesso.",
      });

      // Recarregar conexões e limpar formulário
      await loadConnections();
      setSelectedCustomerId("");
      setSelectedClientId("");
      
    } catch (error: any) {
      console.error("Erro ao salvar conexão:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a conexão.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnection = async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('google_ads_connections')
        .delete()
        .eq('customer_id', customerId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      toast({
        title: "Conexão removida",
        description: "A vinculação foi removida com sucesso.",
      });

      await loadConnections();
    } catch (error: any) {
      console.error("Erro ao remover conexão:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover a conexão.",
        variant: "destructive",
      });
    }
  };

  const getAvailableGoogleAccounts = () => {
    const connectedCustomerIds = connections.map(conn => conn.customer_id);
    return googleAccounts.filter(account => !connectedCustomerIds.includes(account.customer_id));
  };

  const getAccountName = (customerId: string) => {
    const account = googleAccounts.find(acc => acc.customer_id === customerId);
    return account?.account_name || customerId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Vincular Contas Google Ads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para nova vinculação */}
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="font-medium">Nova Vinculação</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-select">Conta Google Ads</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={setSelectedCustomerId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableGoogleAccounts().map((account) => (
                      <SelectItem key={account.customer_id} value={account.customer_id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {account.account_name || account.customer_id}
                          </span>
                          {account.account_name && (
                            <span className="text-sm text-muted-foreground">
                              ID: {account.customer_id}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client-select">Cliente Interno</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={setSelectedClientId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleSaveConnection}
              disabled={!selectedCustomerId || !selectedClientId || saving}
              className="w-full"
            >
              {saving ? "Salvando..." : "Vincular Conta"}
            </Button>
          </div>

          {/* Lista de conexões existentes */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Conexões Ativas ({connections.length})
            </h3>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando conexões...
              </div>
            ) : connections.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conta vinculada ainda
              </div>
            ) : (
              <div className="space-y-3">
                {connections.map((connection) => (
                  <div
                    key={connection.customer_id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {getAccountName(connection.customer_id)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">→</span>
                        <span className="font-medium">{connection.client_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Customer ID: {connection.customer_id}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConnection(connection.customer_id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground border-t pt-4">
            <p>
              <strong>Importante:</strong> As contas vinculadas serão automaticamente 
              associadas ao cliente interno correspondente durante a ingestão de dados. 
              Contas não vinculadas terão client_id = NULL.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}