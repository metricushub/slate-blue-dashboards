import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, RefreshCw, Trash2, Search } from 'lucide-react';
import { useMccResolver } from '@/hooks/useMccResolver';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccountBinding {
  customer_id: string;
  resolved_login_customer_id: string;
  last_verified_at: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export function MccManagerModal() {
  const [open, setOpen] = useState(false);
  const [targetCustomerId, setTargetCustomerId] = useState('');
  const [accountBindings, setAccountBindings] = useState<AccountBinding[]>([]);
  const [loadingBindings, setLoadingBindings] = useState(false);
  const { resolveMcc, clearMccCache, loading } = useMccResolver();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAccountBindings();
    }
  }, [open]);

  const loadAccountBindings = async () => {
    setLoadingBindings(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('account_bindings')
        .select('*')
        .eq('user_id', user.user.id)
        .order('last_verified_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar vinculações:', error);
        return;
      }

      setAccountBindings(data || []);
    } catch (error) {
      console.error('Erro ao carregar vinculações:', error);
    } finally {
      setLoadingBindings(false);
    }
  };

  const handleResolveMcc = async () => {
    if (!targetCustomerId.trim()) {
      toast({
        title: "Customer ID necessário",
        description: "Por favor, insira um Customer ID válido",
        variant: "destructive"
      });
      return;
    }

    const result = await resolveMcc(targetCustomerId);
    
    if (result.success) {
      setTargetCustomerId('');
      loadAccountBindings(); // Refresh the list
    }
  };

  const handleClearCache = async (customerId: string) => {
    const success = await clearMccCache(customerId);
    if (success) {
      loadAccountBindings(); // Refresh the list
    }
  };

  const formatCustomerId = (customerId: string) => {
    // Format as XXX-XXX-XXXX
    if (customerId.length === 10) {
      return `${customerId.slice(0, 3)}-${customerId.slice(3, 6)}-${customerId.slice(6)}`;
    }
    return customerId;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Gerenciar MCCs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciamento de MCCs (Manager Customer Center)</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolver MCC para nova conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-id">Customer ID da conta filha</Label>
                <div className="flex gap-2">
                  <Input
                    id="customer-id"
                    placeholder="Ex: 1234567890 ou 123-456-7890"
                    value={targetCustomerId}
                    onChange={(e) => setTargetCustomerId(e.target.value)}
                    disabled={loading}
                  />
                  <Button 
                    onClick={handleResolveMcc}
                    disabled={loading || !targetCustomerId.trim()}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" />
                    {loading ? 'Resolvendo...' : 'Resolver'}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Digite o Customer ID da conta que deseja vincular. O sistema testará todos os seus MCCs 
                para encontrar qual gerencia esta conta.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Vinculações existentes</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadAccountBindings}
                disabled={loadingBindings}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBindings ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {loadingBindings ? (
                <div className="text-center py-4">Carregando vinculações...</div>
              ) : accountBindings.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhuma vinculação encontrada. Resolva MCCs para suas contas acima.
                </div>
              ) : (
                <div className="space-y-3">
                  {accountBindings.map((binding) => (
                    <div key={binding.customer_id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Conta: {formatCustomerId(binding.customer_id)}
                          </span>
                          {binding.resolved_login_customer_id ? (
                            <Badge variant="default">
                              MCC: {formatCustomerId(binding.resolved_login_customer_id)}
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              Sem MCC
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Última verificação: {formatDate(binding.last_verified_at)}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearCache(binding.customer_id)}
                        disabled={loading}
                        className="gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Limpar Cache
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Como funciona:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>O sistema testa todos os seus MCCs para encontrar qual gerencia a conta especificada</li>
              <li>MCCs resolvidos são armazenados em cache por 24 horas para melhor performance</li>
              <li>Todas as chamadas da API do Google Ads usarão automaticamente o MCC correto</li>
              <li>Use "Limpar Cache" para forçar uma nova resolução de MCC</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}