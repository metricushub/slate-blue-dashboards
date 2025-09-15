import Dexie, { Table } from 'dexie';

export interface OnboardingCard {
  id: string;
  title: string;
  clientId?: string;
  clientName?: string;
  responsavel: string;
  vencimento?: string;
  checklist: string[];
  notas: string;
  stage: 'dados-gerais' | 'financeiro' | 'implementacao' | 'briefing' | 'configuracao';
  subStage?: '2.1-cadastrar-financeiro'; // Only for financeiro stage
  created_at: string;
  updated_at: string;
}

export interface OnboardingDatabase extends Dexie {
  onboardingCards: Table<OnboardingCard>;
}

const db = new Dexie('OnboardingDatabase') as OnboardingDatabase;

db.version(1).stores({
  onboardingCards: '++id, clientId, stage, subStage, responsavel, vencimento, created_at'
});

// Operations
export const onboardingCardOperations = {
  async create(card: Omit<OnboardingCard, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingCard> {
    const now = new Date().toISOString();
    const newCard: OnboardingCard = {
      ...card,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    
    await db.onboardingCards.add(newCard);
    return newCard;
  },

  async update(id: string, updates: Partial<OnboardingCard>): Promise<void> {
    await db.onboardingCards.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  async getAll(): Promise<OnboardingCard[]> {
    return await db.onboardingCards.orderBy('created_at').reverse().toArray();
  },

  async getByClient(clientId: string): Promise<OnboardingCard[]> {
    return await db.onboardingCards
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('created_at');
  },

  async delete(id: string): Promise<void> {
    await db.onboardingCards.delete(id);
  },

  async moveCard(id: string, stage: OnboardingCard['stage'], subStage?: OnboardingCard['subStage']): Promise<void> {
    await db.onboardingCards.update(id, {
      stage,
      subStage: stage === 'financeiro' ? subStage : undefined,
      updated_at: new Date().toISOString(),
    });
  }
};

export default db;