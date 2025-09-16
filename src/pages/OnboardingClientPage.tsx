import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { NewOnboardingKanban } from '@/components/onboarding/NewOnboardingKanban';
import { NewClientFicha } from '@/components/client/NewClientFicha';
import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ClientSelector } from '@/components/onboarding/ClientSelector';
import { ErrorState } from '@/components/onboarding/ErrorState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingCard, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { OnboardingCardModal } from '@/components/onboarding/OnboardingCardModal';
import { useOnboardingClient } from '@/hooks/useOnboardingClient';
import { toast } from '@/hooks/use-toast';

export default function OnboardingClientPage() {
  const params = useParams<{ clientId?: string; id?: string }>();
  const routeClientId = params.clientId || params.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kanban';
  const focusSection = searchParams.get('section');

  // Log para diagnóstico
  console.log(`onboarding: clientId=${routeClientId} (fonte: rota)`);

  // Use custom hook para gerenciar cliente
  const {
    clientId,
    client,
    clients,
    isLoading,
    error,
    ready,
    setSelectedClient,
    retry
  } = useOnboardingClient({ routeClientId });

  const [cards, setCards] = useState<OnboardingCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<OnboardingCard | null>(null);

  // Load cards when clientId changes
  useEffect(() => {
    if (clientId && ready) {
      loadCards();
    }
  }, [clientId, ready]);

  const loadCards = async () => {
    if (!clientId) return;
    
    setCardsLoading(true);
    setCardsError(null);

    const timeout = setTimeout(() => {
      console.warn('OnboardingCards: Watchdog triggered - forcing end of loading');
      setCardsLoading(false);
      setCardsError('Não conseguimos carregar os cards agora');
    }, 10000);
    
    try {
      const clientCards = await onboardingCardOperations.getByClient(clientId);
      setCards(clientCards);
    } catch (error) {
      console.error('Error loading cards:', error);
      setCardsError('Erro ao carregar cards do onboarding');
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cards do onboarding.",
        variant: "destructive"
      });
    } finally {
      clearTimeout(timeout);
      setCardsLoading(false);
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
      await loadCards();
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
      await loadCards();
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
        await onboardingCardOperations.create({ ...cardData, clientId });
      }
      await loadCards();
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

  const handleClientSelect = (selectedClientId: string) => {
    setSelectedClient(selectedClientId);
    // Pode navegar para a URL com o cliente selecionado se necessário
    // window.history.replaceState({}, '', `/cliente/${selectedClientId}/onboarding`);
  };

  const retryAll = () => {
    retry();
    if (clientId) {
      loadCards();
    }
  };
  
  // Loading state
  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Carregando cliente...</div>;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} onRetry={retryAll} isRetrying={isLoading} />;
  }

  // Client selection state - NUNCA mostra seletor na rota do cliente
  if (!clientId || !ready) {
    // Se estamos na rota do cliente, sempre mostrar erro ou loading
    if (routeClientId && routeClientId !== 'undefined' && routeClientId !== 'null') {
      return <ErrorState error="Cliente não encontrado" onRetry={retryAll} isRetrying={isLoading} />;
    }
    // Se routeClientId está undefined/null, mostrar erro genérico
    return <ErrorState error="Parâmetro de cliente inválido" onRetry={retryAll} isRetrying={isLoading} />;
  }

  // Cards error state
  if (cardsError) {
    return <ErrorState error={cardsError} onRetry={loadCards} isRetrying={cardsLoading} />;
  }

  // Main content with key for clean remount
  return (
    <div className="h-full" key={clientId}>
      {client && <OnboardingHeader client={client} showBackButton={!!routeClientId} />}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="ficha">Ficha</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="kanban" className="h-full mt-0 p-6">
          {cardsLoading ? (
            <div className="flex items-center justify-center p-8">Carregando cards...</div>
          ) : (
            <NewOnboardingKanban 
              clientId={clientId}
              cards={cards}
              onCardMove={handleCardMove}
              onCardClick={handleCardClick}
              onCreateCard={handleCreateCard}
              onCardsReload={loadCards}
            />
          )}
        </TabsContent>
        
        <TabsContent value="ficha" className="h-full mt-0 p-6">
          <NewClientFicha clientId={clientId} focusSection={focusSection} />
        </TabsContent>
      </Tabs>

      <OnboardingCardModal
        open={showCardModal}
        onOpenChange={setShowCardModal}
        onSave={handleSaveCard}
        initialData={editingCard || undefined}
        clientId={clientId}
      />
    </div>
  );
}