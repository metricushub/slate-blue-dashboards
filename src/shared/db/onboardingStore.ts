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

export interface OnboardingFicha {
  id: string;
  clientId: string;
  'dados-gerais': {
    razaoSocial?: string;
    cnpj?: string;
    contatoComercial?: string;
    contatoTecnico?: string;
    responsavel?: string;
    prazo?: string;
    observacoes?: string;
  };
  financeiro: {
    dadosBancarios?: string;
    cicloCobranca?: string;
    limiteInvestimento?: string;
    responsavel?: string;
    prazo?: string;
    observacoes?: string;
    '2.1-cadastrar-financeiro'?: {
      responsavel?: string;
      prazo?: string;
      observacoes?: string;
    };
  };
  implementacao: {
    responsavel?: string;
    prazo?: string;
    observacoes?: string;
  };
  briefing: {
    responsavel?: string;
    prazo?: string;
    observacoes?: string;
  };
  configuracao: {
    responsavel?: string;
    prazo?: string;
    observacoes?: string;
  };
  attachments: {
    id: string;
    url: string;
    name: string;
  }[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingStage {
  id: string;
  title: string;
  hasSubStage?: boolean;
  order: number;
}

export interface OnboardingSubStage {
  id: string;
  stageId: string;
  title: string;
  order: number;
}

export interface OnboardingTemplate {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  stages: {
    stageId: string;
    cards: {
      title: string;
      description?: string;
      responsavel?: string;
      vencimentoOffset?: string; // e.g., "+2d", "+1w", "+3w"
      tags?: string[];
    }[];
  }[];
  created_at: string;
  updated_at: string;
}

export interface OnboardingDatabase extends Dexie {
  onboardingCards: Table<OnboardingCard>;
  onboardingStages: Table<OnboardingStage>;
  onboardingSubStages: Table<OnboardingSubStage>;
  onboardingFichas: Table<OnboardingFicha>;
  onboardingTemplates: Table<OnboardingTemplate>;
}

const db = new Dexie('OnboardingDatabase') as OnboardingDatabase;

db.version(1).stores({
  onboardingCards: '++id, clientId, stage, subStage, responsavel, vencimento, created_at',
  onboardingStages: '++id, order',
  onboardingSubStages: '++id, stageId, order',
  onboardingFichas: '++id, clientId, created_at',
  onboardingTemplates: '++id, name, isDefault, created_at'
});

// Initialize default stages and substages
db.on('ready', async () => {
  const stageCount = await db.onboardingStages.count();
  if (stageCount === 0) {
    await db.onboardingStages.bulkAdd([
      { id: 'dados-gerais', title: 'Dados Gerais', order: 1 },
      { id: 'financeiro', title: 'Financeiro', hasSubStage: true, order: 2 },
      { id: 'implementacao', title: 'Implementação Cliente', order: 3 },
      { id: 'briefing', title: 'Briefing & 1º Contato/Reuniões', order: 4 },
      { id: 'configuracao', title: 'Reunião de Configuração — Informações Necessárias', order: 5 },
    ]);
    
    await db.onboardingSubStages.bulkAdd([
      { id: '2.1-cadastrar-financeiro', stageId: 'financeiro', title: '2.1 Cadastrar no Financeiro', order: 1 }
    ]);
  }
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

// Stage operations
export const onboardingStageOperations = {
  async getAllStages(): Promise<OnboardingStage[]> {
    return await db.onboardingStages.orderBy('order').toArray();
  },

  async updateStage(stageId: string, data: Partial<OnboardingStage>): Promise<void> {
    await db.onboardingStages.update(stageId, data);
  },

  async getSubStagesByStage(stageId: string): Promise<OnboardingSubStage[]> {
    return await db.onboardingSubStages.where('stageId').equals(stageId).toArray()
      .then(subStages => subStages.sort((a, b) => a.order - b.order));
  },

  async updateSubStage(subStageId: string, data: Partial<OnboardingSubStage>): Promise<void> {
    await db.onboardingSubStages.update(subStageId, data);
  },

  async deleteSubStage(subStageId: string): Promise<void> {
    // First move all cards from this substage to main stage
    const cardsInSubStage = await db.onboardingCards.where('subStage').equals(subStageId).toArray();
    for (const card of cardsInSubStage) {
      await db.onboardingCards.update(card.id, { subStage: undefined });
    }
    
    await db.onboardingSubStages.delete(subStageId);
  }
};

// Ficha operations
export const onboardingFichaOperations = {
  async create(ficha: Omit<OnboardingFicha, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingFicha> {
    const now = new Date().toISOString();
    const newFicha: OnboardingFicha = {
      ...ficha,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    
    await db.onboardingFichas.add(newFicha);
    return newFicha;
  },

  async getByClient(clientId: string): Promise<OnboardingFicha | undefined> {
    return await db.onboardingFichas
      .where('clientId')
      .equals(clientId)
      .first();
  },

  async updateSection(fichaId: string, sectionId: string, data: any): Promise<void> {
    const current = await db.onboardingFichas.get(fichaId);
    if (!current) return;

    const updated = {
      ...current,
      [sectionId]: { ...current[sectionId], ...data },
      updated_at: new Date().toISOString(),
    };

    await db.onboardingFichas.put(updated);
  },

  async addAttachment(fichaId: string, attachment: { id: string; url: string; name: string }): Promise<void> {
    const current = await db.onboardingFichas.get(fichaId);
    if (!current) return;

    const updated = {
      ...current,
      attachments: [...current.attachments, attachment],
      updated_at: new Date().toISOString(),
    };

    await db.onboardingFichas.put(updated);
  },

  async removeAttachment(fichaId: string, attachmentId: string): Promise<void> {
    const current = await db.onboardingFichas.get(fichaId);
    if (!current) return;

    const updated = {
      ...current,
      attachments: current.attachments.filter(att => att.id !== attachmentId),
      updated_at: new Date().toISOString(),
    };

    await db.onboardingFichas.put(updated);
  }
};

// Template operations
export const onboardingTemplateOperations = {
  async create(template: Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingTemplate> {
    const now = new Date().toISOString();
    const newTemplate: OnboardingTemplate = {
      ...template,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    
    await db.onboardingTemplates.add(newTemplate);
    return newTemplate;
  },

  async getAll(): Promise<OnboardingTemplate[]> {
    return await db.onboardingTemplates.orderBy('created_at').reverse().toArray();
  },

  async getDefault(): Promise<OnboardingTemplate | undefined> {
    return await db.onboardingTemplates.where('isDefault').equals(1).first();
  },

  async update(id: string, updates: Partial<OnboardingTemplate>): Promise<void> {
    await db.onboardingTemplates.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.onboardingTemplates.delete(id);
  },

  async setDefault(id: string): Promise<void> {
    // Remove default from all templates
    const allTemplates = await db.onboardingTemplates.toArray();
    await Promise.all(allTemplates.map(t => 
      db.onboardingTemplates.update(t.id, { isDefault: false })
    ));
    
    // Set new default
    await db.onboardingTemplates.update(id, { isDefault: true });
  },

  async applyTemplate(templateId: string, clientId: string, anchorDate?: Date, variables?: Record<string, string>): Promise<{ created: number; skipped: number; summary: string[] }> {
    const template = await db.onboardingTemplates.get(templateId);
    if (!template) throw new Error('Template not found');

    const existingCards = await db.onboardingCards.where('clientId').equals(clientId).toArray();
    const anchor = anchorDate || new Date();
    let created = 0;
    let skipped = 0;
    const summary: string[] = [];

    for (const stage of template.stages) {
      for (const cardTemplate of stage.cards) {
        // Check for duplicates in the same stage
        const isDuplicate = existingCards.some(card => 
          card.stage === stage.stageId && card.title === this.replaceVariables(cardTemplate.title, variables)
        );

        if (isDuplicate) {
          skipped++;
          summary.push(`Pulado: "${cardTemplate.title}" (duplicado em ${stage.stageId})`);
          continue;
        }

        // Calculate due date from offset
        let vencimento: string | undefined;
        if (cardTemplate.vencimentoOffset) {
          vencimento = this.calculateDateFromOffset(anchor, cardTemplate.vencimentoOffset);
        }

        // Create card
        const newCard: Omit<OnboardingCard, 'id' | 'created_at' | 'updated_at'> = {
          title: this.replaceVariables(cardTemplate.title, variables),
          notas: cardTemplate.description ? this.replaceVariables(cardTemplate.description, variables) : '',
          responsavel: cardTemplate.responsavel || '',
          vencimento,
          checklist: [],
          clientId,
          stage: stage.stageId as OnboardingCard['stage'],
        };

        await onboardingCardOperations.create(newCard);
        created++;
        summary.push(`Criado: "${newCard.title}" em ${stage.stageId}`);
      }
    }

    // Save build report
    const buildReport = {
      templateId,
      clientId,
      created,
      skipped,
      summary,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('buildReport:last', JSON.stringify(buildReport));

    return { created, skipped, summary };
  },

  replaceVariables(text: string, variables?: Record<string, string>): string {
    if (!variables) return text;
    
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    
    return result;
  },

  calculateDateFromOffset(baseDate: Date, offset: string): string {
    const match = offset.match(/^([+-])(\d+)([dwm])$/);
    if (!match) return baseDate.toISOString().split('T')[0];

    const [, sign, amount, unit] = match;
    const multiplier = sign === '+' ? 1 : -1;
    const days = parseInt(amount) * multiplier;

    const result = new Date(baseDate);
    
    switch (unit) {
      case 'd':
        result.setDate(result.getDate() + days);
        break;
      case 'w':
        result.setDate(result.getDate() + (days * 7));
        break;
      case 'm':
        result.setMonth(result.getMonth() + days);
        break;
    }

    return result.toISOString().split('T')[0];
  }
};

export default db;