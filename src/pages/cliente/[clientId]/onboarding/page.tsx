import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { NewOnboardingKanban } from '@/components/onboarding/NewOnboardingKanban';
import { NewClientFicha } from '@/components/client/NewClientFicha';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OnboardingCard, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { OnboardingCardModal } from '@/components/onboarding/OnboardingCardModal';
import { toast } from '@/hooks/use-toast';

export default function ClientOnboardingPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'kanban';
  const focusSection = searchParams.get('section');

  const [cards, setCards] = useState<OnboardingCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<OnboardingCard | null>(null);

  useEffect(() => {
    if (clientId) {
      loadCards();
    }
  }, [clientId]);

  const loadCards = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      const clientCards = await onboardingCardOperations.getByClient(clientId);
      setCards(clientCards);
    } catch (error) {
      console.error('Error loading cards:', error);
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
      await loadCards();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível mover o card.",
        variant: "destructive"
      });
    }
  };

  const handleCardClick = (card: OnboardingCard) => {
    setEditingCard(card);
    setShowCardModal(true);
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
  
  if (loading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="h-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
        <div className="border-b">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="ficha">Ficha</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="kanban" className="h-full mt-0 p-6">
          <NewOnboardingKanban 
            clientId={clientId}
            cards={cards}
            onCardMove={handleCardMove}
            onCardClick={handleCardClick}
            onCreateCard={handleCreateCard}
          />
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