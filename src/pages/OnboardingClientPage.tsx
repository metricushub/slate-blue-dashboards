import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { NewOnboardingKanban } from '@/components/onboarding/NewOnboardingKanban';
import { OnboardingFicha } from '@/components/onboarding/OnboardingFicha';
import { OnboardingClientHeader } from '@/components/onboarding/OnboardingClientHeader';
import { ClientNotFound } from '@/components/onboarding/ClientNotFound';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingCard, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { OnboardingCardModal } from '@/components/onboarding/OnboardingCardModal';
import { useDataSource } from '@/hooks/useDataSource';
import { Client } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingClientPage() {
  const params = useParams<{ clientId?: string; id?: string }>();
  const routeClientId = params.clientId || params.id;
  const resolvedClientId = routeClientId && 
    routeClientId !== 'undefined' && 
    routeClientId !== 'null' && 
    routeClientId.trim() !== '' ? routeClientId : undefined;

  // Diagnostic logging
  console.info('onboarding: clientId via rota =', resolvedClientId);
  const { dataSource } = useDataSource();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kanban';
  const focusSection = searchParams.get('section');

  const [cards, setCards] = useState<OnboardingCard[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<OnboardingCard | null>(null);

  useEffect(() => {
    if (resolvedClientId) {
      loadData();
    } else {
      setLoading(false);
      setError('ID do cliente não encontrado na URL');
    }
  }, [resolvedClientId]);

  const loadData = async () => {
    if (!resolvedClientId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load client data from multiple sources
      const [clientCards, dataSourceClients] = await Promise.all([
        onboardingCardOperations.getByClient(resolvedClientId),
        dataSource.getClients()
      ]);
      
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
        // Try to recover from diagnostic data as last resort
        const { ClientsStore } = await import('@/shared/db/clientsStore');
        const diagnostic = ClientsStore.getDiagnostic('onboardingPreCreate:last');
        if (diagnostic?.clientId === resolvedClientId) {
          console.warn('Client not found but diagnostic exists, showing error with recovery option');
        }
        
        setError(`Cliente com ID "${resolvedClientId}" não encontrado`);
        setClient(null);
        setCards([]);
      } else {
        setCards(clientCards);
        setClient(foundClient);
        setError(null);
        
        // Boot initial board if first access
        const isFirstAccess = searchParams.get('first') === 'true';
        if (isFirstAccess && clientCards.length === 0) {
          await bootInitialBoard(resolvedClientId, foundClient);
          // Reload cards after creating initial board
          const updatedCards = await onboardingCardOperations.getByClient(resolvedClientId);
          setCards(updatedCards);
        }
      }
      
      // Save diagnostic
      const { ClientsStore } = await import('@/shared/db/clientsStore');
      await ClientsStore.saveDiagnostic('onboardingAccess:last', {
        clientId: resolvedClientId,
        found: !!foundClient,
        cardsCount: clientCards.length,
        source: foundClient ? (dataSourceClients.find(c => c.id === resolvedClientId) ? 'dataSource' : 'localStorage') : null
      });
      
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Erro ao carregar dados do onboarding');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do onboarding.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const bootInitialBoard = async (clientId: string, client: Client) => {
    try {
      // Create initial onboarding card
      await onboardingCardOperations.create({
        title: "Bem-vindo ao Onboarding",
        clientId: clientId,
        responsavel: client.owner,
        vencimento: '',
        checklist: [],
        notas: "Card inicial criado automaticamente no primeiro acesso",
        stage: 'dados-gerais',
        position: 1
      });
      
      console.info('Initial onboarding board created for client:', clientId);
    } catch (error) {
      console.error('Error creating initial board:', error);
    }
  };

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    if (value === 'kanban') {
      params.delete('section');
    }
    setSearchParams(params);
  };

  const handleCardMove = async (cardId: string, newStage: string) => {
    try {
      await onboardingCardOperations.moveCard(cardId, newStage as any);
      await loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o card.",
        variant: "destructive"
      });
    }
  };

  const handleCardClick = async (cardData: any) => {
    // Handle card updates from the drawer
    try {
      await onboardingCardOperations.update(cardData.id, cardData);
      await loadData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o card.",
        variant: "destructive"
      });
    }
  };

  const handleCreateCard = () => {
    setEditingCard(null);
    setShowCardModal(true);
  };

  const handleSaveCard = async (cardData: any) => {
    try {
      if (editingCard) {
        await onboardingCardOperations.update(editingCard.id, cardData);
      } else {
        await onboardingCardOperations.create({ ...cardData, clientId: resolvedClientId });
      }
      await loadData();
      setShowCardModal(false);
      setEditingCard(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o card.",
        variant: "destructive"
      });
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
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="ficha">Ficha</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="kanban" className="h-full mt-0 p-6">
          <NewOnboardingKanban 
            clientId={resolvedClientId as string}
            cards={cards}
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
            onCreateCard={handleCreateCard}
            onCardsReload={loadData}
          />
        </TabsContent>
        
        <TabsContent value="ficha" className="h-full mt-0 p-6">
          <OnboardingFicha clientId={resolvedClientId as string} focusSection={focusSection} />
        </TabsContent>
      </Tabs>

      <OnboardingCardModal
        open={showCardModal}
        onOpenChange={setShowCardModal}
        onSave={handleSaveCard}
        initialData={editingCard || undefined}
        clientId={resolvedClientId as string}
      />
    </div>
  );
}