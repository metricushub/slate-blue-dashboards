import { useState, useEffect } from 'react';
import { useDataSource } from '@/hooks/useDataSource';
import { Client } from '@/types';
import { toast } from '@/hooks/use-toast';

interface UseOnboardingClientProps {
  routeClientId?: string;
  selectedClientId?: string;
}

interface UseOnboardingClientReturn {
  clientId: string | null;
  client: Client | null;
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  ready: boolean;
  setSelectedClient: (clientId: string) => void;
  retry: () => void;
}

export function useOnboardingClient({ 
  routeClientId, 
  selectedClientId 
}: UseOnboardingClientProps): UseOnboardingClientReturn {
  const { dataSource } = useDataSource();
  const [client, setClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Fonte única do clientId - prioriza routeClientId, filtra valores inválidos
  const clientId = routeClientId && 
    routeClientId !== 'undefined' && 
    routeClientId !== 'null' && 
    routeClientId.trim() !== '' 
    ? routeClientId 
    : selectedClientId || null;

  const [watchdogTimeout, setWatchdogTimeout] = useState<NodeJS.Timeout | null>(null);

  const loadData = async () => {
    if (watchdogTimeout) {
      clearTimeout(watchdogTimeout);
    }

    setIsLoading(true);
    setError(null);
    setReady(false);

    // Watchdog de 10s
    const timeout = setTimeout(() => {
      console.warn('OnboardingClient: Watchdog triggered - forcing end of loading');
      setIsLoading(false);
      setError('Não conseguimos carregar agora');
      setReady(false);
    }, 10000);
    setWatchdogTimeout(timeout);

    try {
      // Sempre carrega a lista de clientes
      const allClients = await dataSource.getClients();
      setClients(allClients);

      if (clientId) {
        // Se há clientId, tenta encontrar o cliente específico
        const foundClient = allClients.find(c => c.id === clientId);
        if (foundClient) {
          setClient(foundClient);
          setReady(true);
        } else {
          setError(`Cliente com ID "${clientId}" não encontrado`);
          setReady(false);
        }
      } else {
        // Se não há clientId, deixa pronto para seleção
        setClient(null);
        setReady(true);
      }
    } catch (err) {
      console.error('Error loading client data:', err);
      setError('Erro ao carregar dados do cliente');
      setReady(false);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente.",
        variant: "destructive"
      });
    } finally {
      if (watchdogTimeout) {
        clearTimeout(watchdogTimeout);
      }
      setIsLoading(false);
    }
  };

  const setSelectedClient = (newClientId: string) => {
    const selectedClient = clients.find(c => c.id === newClientId);
    if (selectedClient) {
      setClient(selectedClient);
      setError(null);
      setReady(true);
    }
  };

  const retry = () => {
    loadData();
  };

  useEffect(() => {
    loadData();
    
    return () => {
      if (watchdogTimeout) {
        clearTimeout(watchdogTimeout);
      }
    };
  }, [clientId]);

  return {
    clientId,
    client,
    clients,
    isLoading,
    error,
    ready,
    setSelectedClient,
    retry,
  };
}