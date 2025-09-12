import Dexie, { Table } from 'dexie';
import { Lead } from '@/types';

export interface LeadsStoreMeta {
  key: string;
  value: string;
}

export class LeadsDatabase extends Dexie {
  leads!: Table<Lead, string>;
  meta!: Table<LeadsStoreMeta, string>;

  constructor() {
    super('leads_v1');
    this.version(1).stores({
      leads: 'id, stage, created_at, owner, client_id',
      meta: 'key'
    });
  }
}

export const leadsDB = new LeadsDatabase();

export class LeadsStore {
  private static readonly LAST_LOCAL_UPDATE_KEY = 'lastLocalUpdate';

  // Operações básicas de CRUD
  static async createLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const newLead: Lead = {
      ...lead,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await leadsDB.leads.add(newLead);
    await this.updateLastLocalUpdate();
    return newLead;
  }

  static async updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>): Promise<Lead | null> {
    await leadsDB.leads.update(id, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
    
    await this.updateLastLocalUpdate();
    return this.getLead(id);
  }

  static async getLead(id: string): Promise<Lead | null> {
    const lead = await leadsDB.leads.get(id);
    return lead || null;
  }

  static async getAllLeads(): Promise<Lead[]> {
    return leadsDB.leads.orderBy('created_at').reverse().toArray();
  }

  static async getLeadsByStage(stage: string): Promise<Lead[]> {
    return leadsDB.leads.where('stage').equals(stage).toArray();
  }

  static async deleteLead(id: string): Promise<void> {
    await leadsDB.leads.delete(id);
    await this.updateLastLocalUpdate();
  }

  static async bulkUpsertLeads(leads: Lead[]): Promise<void> {
    const transaction = leadsDB.transaction('rw', leadsDB.leads, async () => {
      for (const lead of leads) {
        const existing = await leadsDB.leads.get(lead.id);
        if (existing) {
          // Se existe local, manter o local (pode ter sido editado)
          if (!existing.updated_at || (lead.updated_at && lead.updated_at > existing.updated_at)) {
            await leadsDB.leads.update(lead.id, lead);
          }
        } else {
          await leadsDB.leads.add(lead);
        }
      }
    });
    
    await transaction;
  }

  // Filtros e buscas
  static async searchLeads(query: string): Promise<Lead[]> {
    const allLeads = await this.getAllLeads();
    const searchTerm = query.toLowerCase();
    
    return allLeads.filter(lead => 
      lead.name.toLowerCase().includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm) ||
      lead.phone?.toLowerCase().includes(searchTerm) ||
      lead.utm_source?.toLowerCase().includes(searchTerm) ||
      lead.utm_medium?.toLowerCase().includes(searchTerm) ||
      lead.utm_campaign?.toLowerCase().includes(searchTerm) ||
      lead.owner?.toLowerCase().includes(searchTerm)
    );
  }

  static async getLeadsByFilters(filters: {
    stages?: string[];
    owner?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Lead[]> {
    let leads = await this.getAllLeads();

    if (filters.stages && filters.stages.length > 0) {
      leads = leads.filter(lead => filters.stages!.includes(lead.stage));
    }

    if (filters.owner) {
      leads = leads.filter(lead => lead.owner === filters.owner);
    }

    if (filters.dateFrom) {
      leads = leads.filter(lead => lead.created_at >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      leads = leads.filter(lead => lead.created_at <= filters.dateTo!);
    }

    return leads;
  }

  // Metadados
  static async updateLastLocalUpdate(): Promise<void> {
    await leadsDB.meta.put({
      key: this.LAST_LOCAL_UPDATE_KEY,
      value: new Date().toISOString()
    });
  }

  static async getLastLocalUpdate(): Promise<string | null> {
    const meta = await leadsDB.meta.get(this.LAST_LOCAL_UPDATE_KEY);
    return meta?.value || null;
  }

  // Estatísticas
  static async getLeadsStats(): Promise<{
    total: number;
    byStage: Record<string, number>;
    totalValue: number;
    valueByStage: Record<string, number>;
  }> {
    const leads = await this.getAllLeads();
    
    const byStage: Record<string, number> = {};
    const valueByStage: Record<string, number> = {};
    let totalValue = 0;

    leads.forEach(lead => {
      byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
      const value = lead.value || 0;
      valueByStage[lead.stage] = (valueByStage[lead.stage] || 0) + value;
      totalValue += value;
    });

    return {
      total: leads.length,
      byStage,
      totalValue,
      valueByStage,
    };
  }

  // Exportação CSV
  static async exportToCSV(leads?: Lead[]): Promise<string> {
    const exportLeads = leads || await this.getAllLeads();
    
    const headers = [
      'id', 'created_at', 'updated_at', 'name', 'email', 'phone',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 
      'value', 'owner', 'stage', 'notes', 'client_id'
    ];

    const csvContent = [
      headers.join(','),
      ...exportLeads.map(lead => 
        headers.map(header => {
          const value = lead[header as keyof Lead] || '';
          // Escape quotes and wrap in quotes if contains comma or quote
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    return csvContent;
  }
}