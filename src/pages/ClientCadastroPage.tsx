import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { OnboardingFicha } from '@/components/onboarding/OnboardingFicha';
import { OnboardingClientHeader } from '@/components/onboarding/OnboardingClientHeader';
import { ClientNotFound } from '@/components/onboarding/ClientNotFound';
import { useDataSource } from '@/hooks/useDataSource';
import { Client } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, FileText } from 'lucide-react';

export default function ClientCadastroPage() {
  const params = useParams<{ clientId?: string; id?: string }>();
  const routeClientId = params.clientId || params.id;
  const resolvedClientId = routeClientId && 
    routeClientId !== 'undefined' && 
    routeClientId !== 'null' && 
    routeClientId.trim() !== '' ? routeClientId : undefined;

  const { dataSource } = useDataSource();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resolvedClientId) {
      loadClient();
    } else {
      setLoading(false);
      setError('ID do cliente não encontrado na URL');
    }
  }, [resolvedClientId]);

  const loadClient = async () => {
    if (!resolvedClientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load client data from multiple sources
      const dataSourceClients = await dataSource.getClients();
      let foundClient = dataSourceClients.find(c => c.id === resolvedClientId);
      
      // If not found in dataSource, try local storage (IndexedDB)
      if (!foundClient) {
        const { ClientsStore } = await import('@/shared/db/clientsStore');
        foundClient = await ClientsStore.getClient(resolvedClientId);
        
        // If found locally, try to sync with dataSource
        if (foundClient && dataSource.addClient) {
          try {
            await dataSource.addClient(foundClient);
          } catch (error) {
            console.warn('Could not sync client to dataSource:', error);
          }
        }
      }
      
      if (!foundClient) {
        setError(`Cliente com ID "${resolvedClientId}" não encontrado`);
        setClient(null);
      } else {
        setClient(foundClient);
        setError(null);
      }
      
    } catch (error) {
      console.error('Error loading client:', error);
      setError('Erro ao carregar dados do cliente');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do cliente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="h-full">
        <div className="border-b bg-card">
          <div className="flex items-center gap-4 p-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
        <div className="p-6">
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!resolvedClientId || error) {
    return <ClientNotFound clientId={resolvedClientId || 'desconhecido'} />;
  }

  if (!client) {
    return <ClientNotFound clientId={resolvedClientId} />;
  }

  return (
    <div className="h-full" key={resolvedClientId}>
      <OnboardingClientHeader client={client} />
      
      <div className="h-full">
        {/* Header da página */}
        <div className="border-b bg-card">
          <div className="flex items-center gap-4 p-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Cadastro do Cliente</h1>
              <p className="text-muted-foreground">
                Informações completas e dados cadastrais do cliente
              </p>
            </div>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6 h-full">
          <OnboardingFicha clientId={resolvedClientId as string} />
        </div>
      </div>
    </div>
  );
}