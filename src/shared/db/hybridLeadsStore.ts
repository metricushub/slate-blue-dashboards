import { Lead } from '@/types';
import { LeadsStore } from './leadsStore';
import { SupabaseLeadsStore, SupabaseLead } from './supabaseLeadsStore';

// Hybrid store that works with both local and Supabase data
export class HybridLeadsStore {
  private static useSupabase = true; // Flag to control which store to use

  // Convert between formats
  private static supabaseToLead(supabaseLead: SupabaseLead): Lead {
    return {
      id: supabaseLead.id,
      name: supabaseLead.name,
      email: supabaseLead.email || undefined,
      phone: supabaseLead.phone || undefined,
      stage: supabaseLead.stage,
      value: supabaseLead.value || undefined,
      utm_source: supabaseLead.utm_source || undefined,
      utm_medium: supabaseLead.utm_medium || undefined,
      utm_campaign: supabaseLead.utm_campaign || undefined,
      utm_content: supabaseLead.utm_content || undefined,
      owner: supabaseLead.owner || undefined,
      client_id: supabaseLead.client_id || undefined,
      notes: supabaseLead.notes || undefined,
      created_at: supabaseLead.created_at,
      updated_at: supabaseLead.updated_at,
    };
  }

  private static leadToSupabase(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Omit<SupabaseLead, 'id' | 'created_at' | 'updated_at' | 'user_id'> {
    return {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      stage: lead.stage,
      status: 'active',
      probability: 0,
      value: lead.value || 0,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      owner: lead.owner,
      client_id: lead.client_id,
      notes: lead.notes,
    };
  }

  // Main CRUD operations
  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    try {
      if (this.useSupabase) {
        const supabaseData = this.leadToSupabase(leadData);
        const supabaseLead = await SupabaseLeadsStore.createLead(supabaseData);
        return this.supabaseToLead(supabaseLead);
      } else {
        return await LeadsStore.createLead(leadData);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.createLead(leadData);
    }
  }

  static async updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>): Promise<Lead | null> {
    try {
      if (this.useSupabase) {
        const supabaseUpdates = this.leadToSupabase({ ...updates } as any);
        const supabaseLead = await SupabaseLeadsStore.updateLead(id, supabaseUpdates);
        return this.supabaseToLead(supabaseLead);
      } else {
        return await LeadsStore.updateLead(id, updates);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.updateLead(id, updates);
    }
  }

  static async getLead(id: string): Promise<Lead | null> {
    try {
      if (this.useSupabase) {
        const supabaseLead = await SupabaseLeadsStore.getLead(id);
        return supabaseLead ? this.supabaseToLead(supabaseLead) : null;
      } else {
        return await LeadsStore.getLead(id);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.getLead(id);
    }
  }

  static async getAllLeads(): Promise<Lead[]> {
    try {
      if (this.useSupabase) {
        const supabaseLeads = await SupabaseLeadsStore.getAllLeads();
        return supabaseLeads.map(lead => this.supabaseToLead(lead));
      } else {
        return await LeadsStore.getAllLeads();
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.getAllLeads();
    }
  }

  static async getLeadsByStage(stage: string): Promise<Lead[]> {
    try {
      if (this.useSupabase) {
        const supabaseLeads = await SupabaseLeadsStore.getLeadsByStage(stage);
        return supabaseLeads.map(lead => this.supabaseToLead(lead));
      } else {
        return await LeadsStore.getLeadsByStage(stage);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.getLeadsByStage(stage);
    }
  }

  static async deleteLead(id: string): Promise<void> {
    try {
      if (this.useSupabase) {
        await SupabaseLeadsStore.deleteLead(id);
      } else {
        await LeadsStore.deleteLead(id);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      await LeadsStore.deleteLead(id);
    }
  }

  static async searchLeads(query: string): Promise<Lead[]> {
    try {
      if (this.useSupabase) {
        const supabaseLeads = await SupabaseLeadsStore.searchLeads(query);
        return supabaseLeads.map(lead => this.supabaseToLead(lead));
      } else {
        return await LeadsStore.searchLeads(query);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.searchLeads(query);
    }
  }

  static async getLeadsByFilters(filters: {
    stages?: string[];
    owner?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Lead[]> {
    try {
      if (this.useSupabase) {
        const supabaseLeads = await SupabaseLeadsStore.getLeadsByFilters(filters);
        return supabaseLeads.map(lead => this.supabaseToLead(lead));
      } else {
        return await LeadsStore.getLeadsByFilters(filters);
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.getLeadsByFilters(filters);
    }
  }

  static async getLeadsStats(): Promise<{
    total: number;
    byStage: Record<string, number>;
    totalValue: number;
    valueByStage: Record<string, number>;
  }> {
    try {
      if (this.useSupabase) {
        const stats = await SupabaseLeadsStore.getLeadsStats();
        return {
          total: stats.total,
          byStage: stats.byStage,
          totalValue: stats.totalValue,
          valueByStage: stats.valueByStage,
        };
      } else {
        return await LeadsStore.getLeadsStats();
      }
    } catch (error) {
      console.warn('Supabase failed, falling back to local store:', error);
      this.useSupabase = false;
      return await LeadsStore.getLeadsStats();
    }
  }

  // Export functionality
  static async exportToCSV(leads?: Lead[]): Promise<string> {
    if (leads) {
      // Use provided leads
      return await LeadsStore.exportToCSV(leads);
    }

    // Get all leads and export
    const allLeads = await this.getAllLeads();
    return await LeadsStore.exportToCSV(allLeads);
  }

  // Supabase-specific features
  static async getLeadActivities(leadId: string) {
    if (this.useSupabase) {
      try {
        return await SupabaseLeadsStore.getLeadActivities(leadId);
      } catch (error) {
        console.warn('Failed to get activities:', error);
        return [];
      }
    }
    return [];
  }

  static async createActivity(leadId: string, type: any, title: string, description?: string) {
    if (this.useSupabase) {
      try {
        return await SupabaseLeadsStore.createActivity(leadId, type, title, undefined, undefined, description);
      } catch (error) {
        console.warn('Failed to create activity:', error);
      }
    }
  }

  static async getLeadSources() {
    if (this.useSupabase) {
      try {
        return await SupabaseLeadsStore.getLeadSources();
      } catch (error) {
        console.warn('Failed to get sources:', error);
        return [];
      }
    }
    return [];
  }

  static async getLeadStages() {
    if (this.useSupabase) {
      try {
        return await SupabaseLeadsStore.getLeadStages();
      } catch (error) {
        console.warn('Failed to get stages:', error);
        return [];
      }
    }
    return [];
  }

  static async convertLeadToClient(leadId: string, clientData: any) {
    if (this.useSupabase) {
      try {
        return await SupabaseLeadsStore.convertLeadToClient(leadId, clientData);
      } catch (error) {
        console.warn('Failed to convert lead:', error);
      }
    }
  }

  // Migration utilities
  static async migrateFromLocal(): Promise<void> {
    try {
      const localLeads = await LeadsStore.getAllLeads();
      
      for (const lead of localLeads) {
        const { id, created_at, updated_at, ...leadData } = lead;
        try {
          await SupabaseLeadsStore.createLead(this.leadToSupabase(leadData));
        } catch (error) {
          console.warn('Failed to migrate lead:', lead.name, error);
        }
      }
      
      console.log(`Migrated ${localLeads.length} leads to Supabase`);
    } catch (error) {
      console.error('Failed to migrate leads:', error);
    }
  }
}