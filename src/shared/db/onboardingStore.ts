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

// Legacy template interface - keeping for backward compatibility
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

// New V2 template structure with blocks
export interface OnboardingTemplateV2 {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  blocks: {
    id: string;
    name: string;
    color: string;
    icon: string;
    order: number;
    cards: {
      id: string;
      title: string;
      description?: string;
      responsavel?: string;
      prazoOffset?: string; // "+2d", "+1w", "+3w"
      tags?: string[];
      order: number;
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
  onboardingTemplatesV2: Table<OnboardingTemplateV2>;
}

const db = new Dexie('OnboardingDatabase') as OnboardingDatabase;

db.version(1).stores({
  onboardingCards: '++id, clientId, stage, subStage, responsavel, vencimento, created_at',
  onboardingStages: '++id, order',
  onboardingSubStages: '++id, stageId, order',
  onboardingFichas: '++id, clientId, created_at',
  onboardingTemplates: '++id, name, isDefault, created_at'
});

db.version(2).stores({
  onboardingCards: '++id, clientId, stage, subStage, responsavel, vencimento, created_at',
  onboardingStages: '++id, order',
  onboardingSubStages: '++id, stageId, order',
  onboardingFichas: '++id, clientId, created_at',
  onboardingTemplates: '++id, name, isDefault, created_at',
  onboardingTemplatesV2: '++id, name, isDefault, created_at'
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

// Template V2 operations (New flexible template system)
export const onboardingTemplateV2Operations = {
  async create(template: Omit<OnboardingTemplateV2, 'id' | 'created_at' | 'updated_at'>): Promise<OnboardingTemplateV2> {
    const now = new Date().toISOString();
    const newTemplate: OnboardingTemplateV2 = {
      ...template,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    
    await db.onboardingTemplatesV2.add(newTemplate);
    return newTemplate;
  },

  async getAll(): Promise<OnboardingTemplateV2[]> {
    return await db.onboardingTemplatesV2.orderBy('created_at').reverse().toArray();
  },

  async getById(id: string): Promise<OnboardingTemplateV2 | undefined> {
    return await db.onboardingTemplatesV2.get(id);
  },

  async getDefault(): Promise<OnboardingTemplateV2 | undefined> {
    return await db.onboardingTemplatesV2.where('isDefault').equals(1).first();
  },

  async update(id: string, updates: Partial<OnboardingTemplateV2>): Promise<void> {
    await db.onboardingTemplatesV2.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  },

  async delete(id: string): Promise<void> {
    await db.onboardingTemplatesV2.delete(id);
  },

  async setDefault(id: string): Promise<void> {
    // First, remove default from all templates
    const allTemplates = await db.onboardingTemplatesV2.toArray();
    for (const template of allTemplates) {
      if (template.isDefault) {
        await db.onboardingTemplatesV2.update(template.id, { isDefault: false });
      }
    }
    
    // Set the new default
    await db.onboardingTemplatesV2.update(id, { isDefault: true });
  },

  async duplicate(templateId: string): Promise<OnboardingTemplateV2> {
    const template = await db.onboardingTemplatesV2.get(templateId);
    if (!template) throw new Error('Template not found');

    const duplicated = {
      ...template,
      name: `${template.name} (Cópia)`,
      isDefault: false,
      blocks: template.blocks.map(block => ({
        ...block,
        id: crypto.randomUUID(),
        cards: block.cards.map(card => ({
          ...card,
          id: crypto.randomUUID()
        }))
      }))
    };

    return await this.create(duplicated);
  },

  // Convert current kanban cards to template
  async createFromKanban(name: string, description: string, cards: OnboardingCard[]): Promise<OnboardingTemplateV2> {
    // Group cards by stage and create blocks
    const stageGroups = cards.reduce((acc, card) => {
      if (!acc[card.stage]) {
        acc[card.stage] = [];
      }
      acc[card.stage].push(card);
      return acc;
    }, {} as Record<string, OnboardingCard[]>);

    // Map stages to blocks
    const stageToBlock = {
      'dados-gerais': { name: 'Pré-cadastro', color: 'bg-blue-50 border-blue-200', icon: 'FileText' },
      'implementacao': { name: 'Formulário & Docs', color: 'bg-yellow-50 border-yellow-200', icon: 'FileText' },
      'financeiro': { name: 'Financeiro', color: 'bg-orange-50 border-orange-200', icon: 'CreditCard' },
      'configuracao': { name: 'Acessos & Setup', color: 'bg-purple-50 border-purple-200', icon: 'Settings' },
      'briefing': { name: 'Briefing & Estratégia', color: 'bg-indigo-50 border-indigo-200', icon: 'MessageSquare' },
      'go-live': { name: 'Go-Live', color: 'bg-green-50 border-green-200', icon: 'Rocket' }
    };

    const blocks = Object.entries(stageGroups).map(([stage, stageCards], index) => {
      const blockInfo = stageToBlock[stage as keyof typeof stageToBlock] || { 
        name: stage, 
        color: 'bg-gray-50 border-gray-200', 
        icon: 'CheckSquare' 
      };

      return {
        id: crypto.randomUUID(),
        name: blockInfo.name,
        color: blockInfo.color,
        icon: blockInfo.icon,
        order: index + 1,
        cards: stageCards.map((card, cardIndex) => ({
          id: crypto.randomUUID(),
          title: card.title,
          description: card.notas,
          responsavel: card.responsavel,
          prazoOffset: this.convertDateToOffset(card.vencimento),
          tags: card.checklist.length > 0 ? card.checklist : undefined,
          order: cardIndex + 1
        }))
      };
    });

    const template = {
      name,
      description,
      isDefault: false,
      blocks
    };

    return await this.create(template);
  },

  // Apply template to client with merge options
  async applyToClient(
    templateId: string, 
    clientId: string, 
    options: {
      anchorDate: string;
      createMissingBlocks: boolean;
      mergeWithExisting: boolean;
      avoidDuplicateCards: boolean;
      selectedBlockIds?: string[];
      variables?: Record<string, string>;
    }
  ) {
    console.log('applyToClient called with:', { templateId, clientId, options });
    
    if (!clientId) {
      throw new Error('Client ID is required');
    }
    
    const template = await this.getById(templateId);
    if (!template) {
      console.log('Template not found:', templateId);
      throw new Error('Template not found');
    }

    console.log('Template found:', template);

    const { anchorDate, selectedBlockIds, variables = {} } = options;
    const baseDate = new Date(anchorDate);
    
    let blocksToProcess = template.blocks;
    if (selectedBlockIds && selectedBlockIds.length > 0) {
      blocksToProcess = template.blocks.filter(block => selectedBlockIds.includes(block.id));
    }

    console.log('Blocks to process:', blocksToProcess);

    const created: OnboardingCard[] = [];
    const skipped: string[] = [];

    // Get existing cards to check for duplicates
    const existingCards = await onboardingCardOperations.getByClient(clientId);
    console.log('Existing cards:', existingCards.length);

    for (const block of blocksToProcess) {
      console.log('Processing block:', block.name, 'with', block.cards.length, 'cards');
      
      for (const templateCard of block.cards) {
        console.log('Processing card:', templateCard.title);
        
        // Check for duplicate titles if avoiding duplicates
        if (options.avoidDuplicateCards) {
          const titleWithVars = this.replaceVariables(templateCard.title, variables);
          const isDuplicate = existingCards.some(card => 
            card.title.toLowerCase() === titleWithVars.toLowerCase() &&
            this.mapBlockToStage(block.name) === card.stage
          );
          
          if (isDuplicate) {
            skipped.push(`${block.name}: ${titleWithVars} (duplicado)`);
            console.log('Skipping duplicate card:', titleWithVars);
            continue;
          }
        }

        // Calculate due date from offset
        let dueDate: string | undefined;
        if (templateCard.prazoOffset) {
          dueDate = onboardingTemplateOperations.calculateDateFromOffset(baseDate, templateCard.prazoOffset);
        }

        const mappedStage = this.mapBlockToStage(block.name);
        console.log('Mapped stage for block', block.name, ':', mappedStage);

        // Create the card
        const newCard = await onboardingCardOperations.create({
          title: this.replaceVariables(templateCard.title, variables),
          clientId,
          responsavel: templateCard.responsavel || '',
          vencimento: dueDate,
          checklist: templateCard.tags || [],
          notas: this.replaceVariables(templateCard.description || '', variables),
          stage: mappedStage as OnboardingCard['stage']
        });

        console.log('Created card:', newCard);
        created.push(newCard);
      }
    }

    console.log('Final result:', { created: created.length, skipped: skipped.length });
    return { created, skipped };
  },

  convertDateToOffset(dateStr: string | undefined): string | undefined {
    if (!dateStr) return undefined;
    
    const cardDate = new Date(dateStr);
    const today = new Date();
    const diffTime = cardDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '+0d';
    if (diffDays > 0) return `+${diffDays}d`;
    return `${diffDays}d`;
  },

  replaceVariables(text: string, variables: Record<string, string>): string {
    let result = text;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });
    return result;
  },

  mapBlockToStage(blockName: string): string {
    console.log('Mapping block name:', blockName);
    
    const blockToStage: Record<string, string> = {
      'Pré-cadastro': 'dados-gerais',
      'Formulário & Docs': 'implementacao',
      'Financeiro': 'financeiro', 
      'Acessos & Setup': 'configuracao',
      'Briefing & Estratégia': 'briefing',
      'Go-Live': 'go-live'
    };
    
    const mappedStage = blockToStage[blockName] || 'dados-gerais';
    console.log('Mapped to stage:', mappedStage);
    return mappedStage;
  }
};

export default db;