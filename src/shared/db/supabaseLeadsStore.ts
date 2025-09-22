import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/types";

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: 'stage_change' | 'note_added' | 'call' | 'email' | 'meeting' | 'loss_reason' | 'follow_up';
  title: string;
  description?: string;
  previous_value?: string;
  new_value?: string;
  scheduled_at?: string;
  completed_at?: string;
  user_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface LeadSource {
  id: string;
  name: string;
  description?: string;
  cost_per_lead: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface LeadStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  order_index: number;
  is_active: boolean;
  is_closed_won: boolean;
  is_closed_lost: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseLead extends Omit<Lead, 'client_id'> {
  company?: string;
  status: string;
  probability: number;
  source?: string;
  assigned_to?: string;
  client_id?: string;
  last_contact_at?: string;
  next_follow_up_at?: string;
  lost_reason?: string;
  lost_at?: string;
  converted_at?: string;
  user_id: string;
}

export class SupabaseLeadsStore {
  // Lead operations
  static async createLead(leadData: Omit<SupabaseLead, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<SupabaseLead> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Log activity
    await this.createActivity(data.id, 'stage_change', 'Lead criado', undefined, 'novo', data.stage);
    
    return data as SupabaseLead;
  }

  static async updateLead(id: string, updates: Partial<Omit<SupabaseLead, 'id' | 'created_at' | 'user_id'>>): Promise<SupabaseLead> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get current lead to track changes
    const { data: currentLead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Log stage change if stage was updated
    if (updates.stage && currentLead && currentLead.stage !== updates.stage) {
      await this.createActivity(
        id, 
        'stage_change', 
        `Stage alterado de ${currentLead.stage} para ${updates.stage}`,
        currentLead.stage,
        updates.stage
      );
    }

    return data as SupabaseLead;
  }

  static async getLead(id: string): Promise<SupabaseLead | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return data as SupabaseLead;
  }

  static async getAllLeads(): Promise<SupabaseLead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupabaseLead[];
  }

  static async getLeadsByStage(stage: string): Promise<SupabaseLead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .eq('stage', stage)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupabaseLead[];
  }

  static async deleteLead(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async searchLeads(query: string): Promise<SupabaseLead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupabaseLead[];
  }

  static async getLeadsByFilters(filters: {
    stages?: string[];
    owner?: string;
    source?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<SupabaseLead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    if (filters.stages && filters.stages.length > 0) {
      query = query.in('stage', filters.stages);
    }

    if (filters.owner) {
      query = query.eq('owner', filters.owner);
    }

    if (filters.source) {
      query = query.eq('source', filters.source);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as SupabaseLead[];
  }

  // Activity operations
  static async createActivity(
    leadId: string, 
    type: LeadActivity['type'], 
    title: string, 
    previousValue?: string, 
    newValue?: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<LeadActivity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        type,
        title,
        description,
        previous_value: previousValue,
        new_value: newValue,
        user_id: user.id,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadActivity;
  }

  static async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as LeadActivity[];
  }

  // Sources operations
  static async getLeadSources(): Promise<LeadSource[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_sources')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as LeadSource[];
  }

  static async createLeadSource(sourceData: Omit<LeadSource, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<LeadSource> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_sources')
      .insert({
        ...sourceData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadSource;
  }

  // Stages operations
  static async getLeadStages(): Promise<LeadStage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_stages')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;
    return data as LeadStage[];
  }

  static async createLeadStage(stageData: Omit<LeadStage, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<LeadStage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_stages')
      .insert({
        ...stageData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadStage;
  }

  // Analytics
  static async getLeadsStats(): Promise<{
    total: number;
    byStage: Record<string, number>;
    totalValue: number;
    valueByStage: Record<string, number>;
    conversionRates: Record<string, number>;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: leads, error } = await supabase
      .from('leads')
      .select('stage, value, status')
      .eq('user_id', user.id);

    if (error) throw error;

    const byStage: Record<string, number> = {};
    const valueByStage: Record<string, number> = {};
    let totalValue = 0;

    leads.forEach(lead => {
      byStage[lead.stage] = (byStage[lead.stage] || 0) + 1;
      const value = lead.value || 0;
      valueByStage[lead.stage] = (valueByStage[lead.stage] || 0) + value;
      totalValue += value;
    });

    // Calculate conversion rates between stages
    const conversionRates: Record<string, number> = {};
    const stages = await this.getLeadStages();
    
    for (let i = 0; i < stages.length - 1; i++) {
      const currentStage = stages[i].name;
      const nextStage = stages[i + 1].name;
      const currentCount = byStage[currentStage] || 0;
      const nextCount = byStage[nextStage] || 0;
      
      if (currentCount > 0) {
        conversionRates[`${currentStage}_to_${nextStage}`] = (nextCount / currentCount) * 100;
      }
    }

    return {
      total: leads.length,
      byStage,
      totalValue,
      valueByStage,
      conversionRates,
    };
  }

  // Convert lead to client
  static async convertLeadToClient(leadId: string, clientData: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Update lead as converted
    await this.updateLead(leadId, {
      status: 'converted',
      converted_at: new Date().toISOString(),
      client_id: clientData.id,
    });

    // Log activity
    await this.createActivity(
      leadId,
      'stage_change',
      'Lead convertido em cliente',
      undefined,
      'converted',
      `Cliente criado: ${clientData.name}`
    );
  }
}