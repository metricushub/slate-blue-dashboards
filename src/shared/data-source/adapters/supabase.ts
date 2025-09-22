import { DataSource, MetricsQuery, CampaignQuery, OptimizationInput } from '../types';
import { Client, Campaign, MetricRow, Alert, Optimization, LeadStageConfig } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { SupabaseLeadsStore } from '@/shared/db/supabaseLeadsStore';

export class SupabaseAdapter implements DataSource {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getClients(): Promise<Client[]> {
    const cacheKey = 'clients';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao carregar clientes:', error);
      throw new Error(`Não foi possível carregar clientes: ${error.message}`);
    }

    const clients = data.map(row => this.mapSupabaseClient(row));
    this.cache.set(cacheKey, { data: clients, timestamp: Date.now() });
    
    return clients;
  }

  async getClient(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar cliente:', error);
      throw new Error(`Erro ao carregar cliente: ${error.message}`);
    }

    return data ? this.mapSupabaseClient(data) : null;
  }

  async getDailyMetrics(query: MetricsQuery): Promise<MetricRow[]> {
    let supabaseQuery = supabase
      .from('metrics')
      .select('*')
      .order('date', { ascending: false });

    // Apply filters
    if (query.clientId) {
      supabaseQuery = supabaseQuery.eq('client_id', query.clientId);
    }
    
    if (query.from) {
      supabaseQuery = supabaseQuery.gte('date', query.from);
    }
    
    if (query.to) {
      supabaseQuery = supabaseQuery.lte('date', query.to);
    }
    
    if (query.platform && query.platform !== 'all') {
      supabaseQuery = supabaseQuery.eq('platform', query.platform);
    }

    if (query.campaignId) {
      supabaseQuery = supabaseQuery.eq('campaign_id', query.campaignId);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Erro ao carregar métricas:', error);
      throw new Error(`Erro ao carregar métricas: ${error.message}`);
    }

    return data.map(row => this.mapSupabaseMetric(row));
  }

  async getCampaigns(clientId: string, query?: CampaignQuery): Promise<Campaign[]> {
    let supabaseQuery = supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', clientId)
      .order('name');

    // Apply filters
    if (query?.platform && query.platform !== 'all') {
      supabaseQuery = supabaseQuery.eq('platform', query.platform);
    }

    if (query?.status) {
      supabaseQuery = supabaseQuery.eq('status', query.status);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error('Erro ao carregar campanhas:', error);
      throw new Error(`Erro ao carregar campanhas: ${error.message}`);
    }

    return data.map(row => this.mapSupabaseCampaign(row));
  }

  async getAlerts(clientId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('client_id', clientId)
      .eq('dismissed', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar alertas:', error);
      throw new Error(`Erro ao carregar alertas: ${error.message}`);
    }

    return data.map(row => this.mapSupabaseAlert(row));
  }

  async listOptimizations(clientId: string): Promise<Optimization[]> {
    const { data, error } = await supabase
      .from('optimizations')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar otimizações:', error);
      throw new Error(`Erro ao carregar otimizações: ${error.message}`);
    }

    return data.map(row => this.mapSupabaseOptimization(row));
  }

  async upsertOptimization(input: OptimizationInput): Promise<Optimization> {
    const optimizationData = {
      id: input.id,
      client_id: input.clientId,
      title: input.title,
      type: input.type,
      objective: input.objective,
      target_metric: input.targetMetric,
      expected_impact: input.expectedImpact,
      campaigns: input.campaigns || [],
      status: this.mapStatusToPortuguese(input.status || 'planned'),
      start_date: input.createdAt ? new Date(input.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    };

    const { data, error } = await supabase
      .from('optimizations')
      .upsert(optimizationData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar otimização:', error);
      throw new Error(`Erro ao salvar otimização: ${error.message}`);
    }

    return this.mapSupabaseOptimization(data);
  }

  // Legacy method for compatibility
  async getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]> {
    return this.getDailyMetrics({ clientId, from, to });
  }

  async addClient(client: Client): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .insert({
        id: client.id,
        name: client.name,
        status: client.status,
        stage: client.stage,
        owner: client.owner,
        website: client.website,
        logo_url: client.logoUrl,
        monthly_budget: client.budgetMonth || client.monthlyBudget,
        segment: client.segment,
        tags: client.tags
      });

    if (error) {
      console.error('Erro ao adicionar cliente:', error);
      throw new Error(`Erro ao adicionar cliente: ${error.message}`);
    }
  }

  // Data mapping methods
  private mapSupabaseClient(row: any): Client {
    return {
      id: row.id,
      name: row.name,
      status: row.status,
      stage: row.stage,
      owner: row.owner,
      website: row.website,
      segment: row.segment,
      logoUrl: row.logo_url,
      lastUpdate: row.last_update || new Date().toISOString().split('T')[0],
      budgetMonth: Number(row.monthly_budget || 0),
      budgetSpentMonth: Number(row.budget_spent_month || 0),
      // Legacy compatibility
      monthlyBudget: Number(row.monthly_budget || 0),
      tags: row.tags || []
    };
  }

  private mapSupabaseMetric(row: any): MetricRow {
    return {
      date: row.date,
      clientId: row.client_id,
      campaignId: row.campaign_id,
      platform: row.platform,
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      spend: Number(row.spend || 0),
      leads: Number(row.leads || 0),
      conversions: Number(row.conversions || 0),
      revenue: Number(row.revenue || 0),
      cpa: Number(row.cpa || 0),
      roas: Number(row.roas || 0),
      ctr: Number(row.ctr || 0),
      convRate: Number(row.conv_rate || 0)
    };
  }

  private mapSupabaseCampaign(row: any): Campaign {
    return {
      id: row.id,
      clientId: row.client_id,
      platform: row.platform,
      name: row.name,
      status: row.status,
      objective: row.objective,
      lastSync: row.last_sync || new Date().toISOString()
    };
  }

  private mapSupabaseAlert(row: any): Alert {
    return {
      id: row.id,
      clientId: row.client_id,
      type: row.type,
      level: row.level,
      title: row.title,
      message: row.message,
      createdAt: row.created_at,
      isRead: row.is_read || false,
      actionUrl: row.action_url
    };
  }

  // Cache management
  clearCache(): void {
    this.cache.clear();
  }

  async refreshCache(): Promise<void> {
    this.clearCache();
    console.log('Cache do Supabase limpo');
  }

  // Status mapping helpers
  private mapStatusToPortuguese(status: string): "Planejada" | "Em teste" | "Concluída" | "Abortada" {
    switch (status) {
      case 'planned':
        return 'Planejada';
      case 'in_progress':
        return 'Em teste';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Abortada';
      default:
        return 'Planejada';
    }
  }

  private mapSupabaseOptimization(row: any): Optimization {
    return {
      id: row.id,
      client_id: row.client_id,
      title: row.title,
      type: row.type,
      objective: row.objective,
      target_metric: row.target_metric,
      hypothesis: row.hypothesis,
      campaigns: row.campaigns || [],
      start_date: row.start_date,
      review_date: row.review_date,
      expected_impact: row.expected_impact,
      status: this.mapStatusFromDatabase(row.status),
      result_summary: row.result_summary,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  private mapStatusFromDatabase(status: string): "Planejada" | "Em teste" | "Concluída" | "Abortada" {
    switch (status) {
      case 'planned':
      case 'Planejada':
        return 'Planejada';
      case 'in_progress':
      case 'Em teste':
        return 'Em teste';
      case 'completed':
      case 'Concluída':
        return 'Concluída';
      case 'cancelled':
      case 'Abortada':
        return 'Abortada';
      default:
        return 'Planejada';
    }
  }

  async getLeadStages(): Promise<LeadStageConfig[]> {
    return SupabaseLeadsStore.getLeadStages();
  }

  async saveLeadStages(stages: LeadStageConfig[]): Promise<LeadStageConfig[]> {
    return SupabaseLeadsStore.saveLeadStages(stages);
  }
}