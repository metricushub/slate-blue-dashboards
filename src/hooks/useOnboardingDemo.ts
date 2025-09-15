import { useEffect } from 'react';
import { onboardingCardOperations } from '@/shared/db/onboardingStore';
import { ONBOARDING_TEMPLATES, createCardFromTemplate } from '@/shared/data/onboardingTemplates';

// Hook para inicializar dados de demonstração do onboarding
export function useOnboardingDemo() {
  useEffect(() => {
    const initializeDemoData = async () => {
      try {
        // Verificar se já existem cards
        const existingCards = await onboardingCardOperations.getAll();
        
        // Se não existir nenhum card, criar cards de exemplo
        if (existingCards.length === 0) {
          const mockClients = [
            { id: '1', name: 'Empresa A' },
            { id: '2', name: 'Empresa B' },
            { id: '3', name: 'Empresa C' }
          ];
          
          const responsaveis = ['João Silva', 'Maria Santos', 'Pedro Costa'];
          
          // Criar um card de exemplo para cada etapa usando templates
          for (let i = 0; i < ONBOARDING_TEMPLATES.length; i++) {
            const template = ONBOARDING_TEMPLATES[i];
            const client = mockClients[i % mockClients.length];
            const responsavel = responsaveis[i % responsaveis.length];
            
            const cardData = createCardFromTemplate(
              template,
              client.id,
              client.name,
              responsavel
            );
            
            // Definir uma data de vencimento (próximos 7 dias)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + (i + 1) * 2);
            cardData.vencimento = dueDate.toISOString().split('T')[0];
            
            await onboardingCardOperations.create(cardData);
          }
          
          console.log('Dados de demonstração do onboarding inicializados');
        }
      } catch (error) {
        console.warn('Erro ao inicializar dados de demonstração:', error);
      }
    };
    
    initializeDemoData();
  }, []);
}