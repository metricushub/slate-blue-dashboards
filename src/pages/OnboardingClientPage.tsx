import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { NewOnboardingKanban } from '@/components/onboarding/NewOnboardingKanban';
import { NewClientFicha } from '@/components/client/NewClientFicha';
import { ClientHeader } from '@/components/onboarding/ClientHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingCard, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { OnboardingCardModal } from '@/components/onboarding/OnboardingCardModal';
import { useDataSource } from '@/hooks/useDataSource';
import { Client } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function OnboardingClientPage() {
  const { clientId: routeClientId } = useParams<{ clientId: string }>();
  const resolvedClientId = routeClientId && routeClientId !== 'undefined' && routeClientId !== 'null' ? routeClientId : undefined;
  const { dataSource } = useDataSource();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kanban';
  const focusSection = searchParams.get('section');

  const [cards, setCards] = useState<OnboardingCard[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<OnboardingCard | null>(null);

  useEffect(() => {
    if (resolvedClientId) {
      loadData();
    }
  }, [resolvedClientId]);

  const loadData = async () => {
    if (!resolvedClientId) return;
    
    try {
      setLoading(true);
      
      // Load client data and cards in parallel
      const [clientCards, clients] = await Promise.all([
        onboardingCardOperations.getByClient(resolvedClientId),
        dataSource.getClients()
      ]);
      
      const foundClient = clients.find(c => c.id === resolvedClientId);
      
      setCards(clientCards);
      setClient(foundClient || null);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do onboarding.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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
    return <div className="p-6">Carregando...</div>;
  }

  if (!resolvedClientId) {
    return <div className="p-6 text-destructive">Cliente não identificado. Abra o Onboarding a partir de um cliente válido em Clientes.</div>;
  }

  return (
    <div className="h-full">
      {client && <ClientHeader client={client} />}
      
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
          <NewClientFicha clientId={resolvedClientId as string} focusSection={focusSection} />
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