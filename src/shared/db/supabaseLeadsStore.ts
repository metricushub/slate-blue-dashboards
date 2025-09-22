import { supabase } from "@/integrations/supabase/client";
import { Lead, LeadStageConfig } from "@/types";

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
  created_at: string;
  metadata?: Record<string, any>;
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

// Export the Lead type as SupabaseLead for backwards compatibility
export type SupabaseLead = Lead;

export class SupabaseLeadsStore {
  // Basic CRUD operations
  static async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
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
    return data as Lead;
  }

  static async updateLead(id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>): Promise<Lead> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data as Lead;
  }

  static async getLead(id: string): Promise<Lead | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data as Lead | null;
  }

  static async getAllLeads(): Promise<Lead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
  }

  static async getLeadsByStage(stage: string): Promise<Lead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .eq('stage', stage)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
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

  static async searchLeads(query: string): Promise<Lead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
  }

  static async getLeadsByFilters(filters: any): Promise<Lead[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id);

    if (filters.stage) {
      query = query.eq('stage', filters.stage);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.owner) {
      query = query.eq('owner', filters.owner);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as Lead[];
  }

  // Activity operations
  static async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as LeadActivity[];
  }

  static async createActivity(
    leadId: string,
    type: string,
    title: string,
    description?: string,
    newValue?: string,
    previousValue?: string
  ): Promise<LeadActivity> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        user_id: user.id,
        type,
        title,
        description,
        new_value: newValue,
        previous_value: previousValue,
      })
      .select()
      .single();

    if (error) throw error;
    return data as LeadActivity;
  }

  // Source operations
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

  // Stages operations
  static async getLeadStages(): Promise<LeadStageConfig[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('lead_stages')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;
    return data as LeadStageConfig[];
  }

  static async saveLeadStages(stages: LeadStageConfig[]): Promise<LeadStageConfig[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete existing stages
    await supabase
      .from('lead_stages')
      .delete()
      .eq('user_id', user.id);

    // Insert new stages
    const { data, error } = await supabase
      .from('lead_stages')
      .insert(
        stages.map((stage, index) => ({
          name: stage.name,
          color: stage.color || '#3b82f6',
          order_index: index,
          user_id: user.id,
          is_active: true
        }))
      )
      .select();

    if (error) throw error;
    return data as LeadStageConfig[];
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
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'converted',
        converted_at: new Date().toISOString(),
        client_id: clientData.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    // Log activity
    await this.createActivity(
      leadId,
      'stage_change',
      'Lead convertido em cliente',
      `Cliente criado: ${clientData.name}`,
      'converted'
    );
  }
}