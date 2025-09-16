import { onboardingCardOperations } from '@/shared/db/onboardingStore';

export interface FormSentMetadata {
  clientId: string;
  formSentAt: string;
  formLinkLast: string;
  leadId?: string;
}

export class OnboardingService {
  /**
   * Ensures client has an onboarding board and creates "Formulário enviado" card
   */
  static async ensureBoardAndFormCard(clientId: string, clientName: string, responsavel: string): Promise<void> {
    try {
      // Check if "Formulário enviado" card already exists
      const existingCards = await onboardingCardOperations.getByClient(clientId);
      const formCard = existingCards.find(card => card.title === 'Formulário enviado');
      
      if (formCard) {
        // Update existing card
        await onboardingCardOperations.update(formCard.id, {
          notas: `Formulário reenviado em ${new Date().toLocaleString('pt-BR')}`,
          updated_at: new Date().toISOString()
        });
      } else {
        // Create new card in "dados-gerais" stage (Pré-cadastro)
        const newCard = {
          clientId,
          clientName,
          title: 'Formulário enviado',
          stage: 'dados-gerais' as const,
          responsavel: responsavel || 'Sistema',
          vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          checklist: ['Aguardando preenchimento do formulário'],
          notas: `Formulário enviado em ${new Date().toLocaleString('pt-BR')}`,
        };
        
        await onboardingCardOperations.create(newCard);
      }
    } catch (error) {
      console.error('Error ensuring onboarding board and form card:', error);
      throw error;
    }
  }

  /**
   * Stores form sent metadata in localStorage
   */
  static storeFormMetadata(metadata: FormSentMetadata): void {
    localStorage.setItem(`formSent:${metadata.clientId}`, JSON.stringify(metadata));
  }

  /**
   * Retrieves form sent metadata from localStorage
   */
  static getFormMetadata(clientId: string): FormSentMetadata | null {
    try {
      const data = localStorage.getItem(`formSent:${clientId}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Checks if form was sent for a client
   */
  static isFormSent(clientId: string): boolean {
    return !!this.getFormMetadata(clientId);
  }

  /**
   * Gets formatted date for form sent display
   */
  static getFormSentDate(clientId: string): string | null {
    const metadata = this.getFormMetadata(clientId);
    if (!metadata) return null;

    const date = new Date(metadata.formSentAt);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}