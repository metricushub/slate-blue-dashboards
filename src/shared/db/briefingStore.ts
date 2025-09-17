import Dexie from 'dexie';
import { BriefingTemplate, BriefingResponse, DEFAULT_BRIEFING_TEMPLATE } from '@/types/briefing';

// Estender o banco de dados existente
interface BriefingDatabase extends Dexie {
  briefingTemplates: Dexie.Table<BriefingTemplate, string>;
  briefingResponses: Dexie.Table<BriefingResponse, string>;
}

const briefingDb = new Dexie('BriefingDatabase') as BriefingDatabase;

briefingDb.version(1).stores({
  briefingTemplates: 'id, name, isDefault, createdAt, updatedAt',
  briefingResponses: 'id, clientId, templateId, createdAt, updatedAt'
});

// Inicializar com template padrão
const initializeDefaultTemplate = async () => {
  try {
    const existingTemplates = await briefingDb.briefingTemplates.count();
    
    if (existingTemplates === 0) {
      const now = new Date().toISOString();
      await briefingDb.briefingTemplates.add({
        ...DEFAULT_BRIEFING_TEMPLATE,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      });
    }
  } catch (error) {
    console.error('Erro ao inicializar template padrão:', error);
  }
};

// Chamar inicialização
initializeDefaultTemplate();

// Template Operations
export const briefingTemplateOperations = {
  async create(template: Omit<BriefingTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<BriefingTemplate> {
    const now = new Date().toISOString();
    const newTemplate: BriefingTemplate = {
      ...template,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    // Se for definido como padrão, remover padrão dos outros
    if (template.isDefault) {
      await briefingDb.briefingTemplates
        .where('isDefault')
        .equals(1)
        .modify({ isDefault: false });
    }

    await briefingDb.briefingTemplates.add(newTemplate);
    return newTemplate;
  },

  async getAll(): Promise<BriefingTemplate[]> {
    return await briefingDb.briefingTemplates.orderBy('name').toArray();
  },

  async getById(id: string): Promise<BriefingTemplate | undefined> {
    return await briefingDb.briefingTemplates.get(id);
  },

  async getDefault(): Promise<BriefingTemplate | undefined> {
    return await briefingDb.briefingTemplates.where('isDefault').equals(1).first();
  },

  async update(id: string, updates: Partial<BriefingTemplate>): Promise<void> {
    const now = new Date().toISOString();
    
    // Se for definido como padrão, remover padrão dos outros
    if (updates.isDefault) {
      await briefingDb.briefingTemplates
        .where('isDefault')
        .equals(1)
        .modify({ isDefault: false });
    }

    await briefingDb.briefingTemplates.update(id, {
      ...updates,
      updatedAt: now
    });
  },

  async delete(id: string): Promise<void> {
    // Verificar se não é o único template
    const count = await briefingDb.briefingTemplates.count();
    if (count <= 1) {
      throw new Error('Não é possível excluir o último template');
    }

    // Se for o template padrão, definir outro como padrão
    const template = await briefingDb.briefingTemplates.get(id);
    if (template?.isDefault) {
      const firstOther = await briefingDb.briefingTemplates
        .where('id')
        .notEqual(id)
        .first();
      
      if (firstOther) {
        await briefingDb.briefingTemplates.update(firstOther.id, { isDefault: true });
      }
    }

    await briefingDb.briefingTemplates.delete(id);
  },

  async duplicate(templateId: string): Promise<BriefingTemplate> {
    const original = await briefingDb.briefingTemplates.get(templateId);
    if (!original) {
      throw new Error('Template não encontrado');
    }

    return await this.create({
      ...original,
      name: `${original.name} (Cópia)`,
      isDefault: false
    });
  },

  async setDefault(templateId: string): Promise<void> {
    // Remover padrão de todos
    await briefingDb.briefingTemplates
      .where('isDefault')
      .equals(1)
      .modify({ isDefault: false });

    // Definir novo padrão
    await briefingDb.briefingTemplates.update(templateId, { isDefault: true });
  }
};

// Response Operations
export const briefingResponseOperations = {
  async create(response: Omit<BriefingResponse, 'id' | 'createdAt' | 'updatedAt'>): Promise<BriefingResponse> {
    const now = new Date().toISOString();
    const newResponse: BriefingResponse = {
      ...response,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };

    await briefingDb.briefingResponses.add(newResponse);
    return newResponse;
  },

  async getByClient(clientId: string): Promise<BriefingResponse[]> {
    return await briefingDb.briefingResponses
      .where('clientId')
      .equals(clientId)
      .reverse()
      .sortBy('updatedAt');
  },

  async getByClientAndTemplate(clientId: string, templateId: string): Promise<BriefingResponse | undefined> {
    return await briefingDb.briefingResponses
      .where('[clientId+templateId]')
      .equals([clientId, templateId])
      .first();
  },

  async update(id: string, updates: Partial<BriefingResponse>): Promise<void> {
    const now = new Date().toISOString();
    await briefingDb.briefingResponses.update(id, {
      ...updates,
      updatedAt: now
    });
  },

  async delete(id: string): Promise<void> {
    await briefingDb.briefingResponses.delete(id);
  },

  async saveResponse(clientId: string, templateId: string, responses: Record<string, any>): Promise<BriefingResponse> {
    const existing = await this.getByClientAndTemplate(clientId, templateId);
    
    if (existing) {
      await this.update(existing.id, { responses });
      return { ...existing, responses, updatedAt: new Date().toISOString() };
    } else {
      return await this.create({
        clientId,
        templateId,
        responses
      });
    }
  }
};

export default briefingDb;