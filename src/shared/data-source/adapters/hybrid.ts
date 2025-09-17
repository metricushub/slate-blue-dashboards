import { DataSource, MetricsQuery, CampaignQuery, OptimizationInput } from '../types';
import { Client, Campaign, MetricRow, Alert, Optimization } from '@/types';
import { SupabaseAdapter } from './supabase';
import { dashboardDb, optimizationOperations } from '@/shared/db/dashboardStore';
import Dexie from 'dexie';

// Extended Dexie database for offline cache
class HybridDatabase extends Dexie {
  clients: Dexie.Table<Client, string>;
  campaigns: Dexie.Table<Campaign, string>;  
  metrics: Dexie.Table<MetricRow, string>;
  alerts: Dexie.Table<Alert, string>;

  constructor() {
    super('MetricusHybridCache');
    
    this.version(1).stores({
      clients: 'id, name, status, stage, owner, lastUpdate',
      campaigns: 'id, clientId, platform, name, status, lastSync',
      metrics: 'date, clientId, campaignId, platform',
      alerts: 'id, clientId, type, level, createdAt'
    });
  }
}

const hybridDb = new HybridDatabase();

export class HybridAdapter implements DataSource {
  private supabase = new SupabaseAdapter();
  private syncInProgress = false;
  private lastOnlineCheck = 0;
  private readonly ONLINE_CHECK_INTERVAL = 30000; // 30 seconds

  async getClients(): Promise<Client[]> {
    if (await this.isOnline()) {
      try {
        const clients = await this.supabase.getClients();
        
        // Cache offline for later use
        await this.cacheClients(clients);
        
        return clients;
      } catch (error) {
        console.warn('Falha ao carregar do Supabase, usando cache local:', error);
        return this.getCachedClients();
      }
    } else {
      return this.getCachedClients();
    }
  }

  async getClient(id: string): Promise<Client | null> {
    if (await this.isOnline()) {
      try {
        const client = await this.supabase.getClient(id);
        
        if (client) {
          // Cache this client
          await hybridDb.clients.put(client);
        }
        
        return client;
      } catch (error) {
        console.warn('Falha ao carregar cliente do Supabase, usando cache:', error);
        return hybridDb.clients.get(id) || null;
      }
    } else {
      return hybridDb.clients.get(id) || null;
    }
  }

  async getDailyMetrics(query: MetricsQuery): Promise<MetricRow[]> {
    if (await this.isOnline()) {
      try {
        const metrics = await this.supabase.getDailyMetrics(query);
        
        // Cache metrics for offline use
        await this.cacheMetrics(metrics);
        
        return metrics;
      } catch (error) {
        console.warn('Falha ao carregar métricas do Supabase, usando cache:', error);
        return this.getCachedMetrics(query);
      }
    } else {
      return this.getCachedMetrics(query);
    }
  }

  async getCampaigns(clientId: string, query?: CampaignQuery): Promise<Campaign[]> {
    if (await this.isOnline()) {
      try {
        const campaigns = await this.supabase.getCampaigns(clientId, query);
        
        // Cache campaigns
        await this.cacheCampaigns(campaigns);
        
        return campaigns;
      } catch (error) {
        console.warn('Falha ao carregar campanhas do Supabase, usando cache:', error);
        return this.getCachedCampaigns(clientId, query);
      }
    } else {
      return this.getCachedCampaigns(clientId, query);
    }
  }

  async getAlerts(clientId: string): Promise<Alert[]> {
    if (await this.isOnline()) {
      try {
        const alerts = await this.supabase.getAlerts(clientId);
        
        // Cache alerts
        await this.cacheAlerts(alerts);
        
        return alerts;
      } catch (error) {
        console.warn('Falha ao carregar alertas do Supabase, usando cache:', error);
        return this.getCachedAlerts(clientId);
      }
    } else {
      return this.getCachedAlerts(clientId);
    }
  }

  async listOptimizations(clientId: string): Promise<Optimization[]> {
    if (await this.isOnline()) {
      try {
        const onlineOptimizations = await this.supabase.listOptimizations(clientId);
        
        // Merge with local optimizations (created offline)
        const localOptimizations = await optimizationOperations.getByClient(clientId);
        
        // Combine and deduplicate (online takes precedence)
        const combined = [...onlineOptimizations];
        
        for (const local of localOptimizations) {
          if (!combined.find(online => online.id === local.id)) {
            combined.push(local);
          }
        }
        
        return combined.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      } catch (error) {
        console.warn('Falha ao carregar otimizações do Supabase, usando locais:', error);
        return optimizationOperations.getByClient(clientId);
      }
    } else {
      return optimizationOperations.getByClient(clientId);
    }
  }

  async upsertOptimization(input: OptimizationInput): Promise<Optimization> {
    if (await this.isOnline()) {
      try {
        // Try to save online first
        const onlineOptimization = await this.supabase.upsertOptimization(input);
        
        // Also save locally for offline access
        await optimizationOperations.create({
          ...onlineOptimization,
          client_id: onlineOptimization.client_id
        });
        
        return onlineOptimization;
      } catch (error) {
        console.warn('Falha ao salvar no Supabase, salvando localmente:', error);
        
        // Mark for later sync
        const localOptimization = await optimizationOperations.create({
          client_id: input.clientId,
          title: input.title,
          type: input.type,
          objective: input.objective || '',
          target_metric: input.targetMetric || '',
          expected_impact: input.expectedImpact || '',
          campaigns: input.campaigns || [],
          status: this.mapStatusToPortuguese(input.status || 'planned'),
          start_date: input.createdAt || new Date().toISOString(),
          hypothesis: '',
          result_summary: ''
        });
        
        return localOptimization;
      }
    } else {
      // Offline - save locally only
      const localOptimization = await optimizationOperations.create({
        client_id: input.clientId,
        title: input.title,
        type: input.type,
        objective: input.objective || '',
        target_metric: input.targetMetric || '',
        expected_impact: input.expectedImpact || '',
        campaigns: input.campaigns || [],
        status: this.mapStatusToPortuguese(input.status || 'planned'),
        start_date: input.createdAt || new Date().toISOString(),
        hypothesis: '',
        result_summary: ''
      });
      
      return localOptimization;
    }
  }

  // Legacy method for compatibility
  async getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]> {
    return this.getDailyMetrics({ clientId, from, to });
  }

  async addClient(client: Client): Promise<void> {
    if (await this.isOnline()) {
      try {
        await this.supabase.addClient(client);
        
        // Also cache locally
        await hybridDb.clients.put(client);
      } catch (error) {
        console.warn('Falha ao adicionar cliente no Supabase, salvando localmente:', error);
        
        // Save locally only - will sync later
        await hybridDb.clients.put({
          ...client,
          id: client.id || `client_offline_${Date.now()}`
        });
      }
    } else {
      // Offline - save locally only
      await hybridDb.clients.put({
        ...client,
        id: client.id || `client_offline_${Date.now()}`
      });
    }
  }

  // Connectivity and caching methods
  private async isOnline(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (now - this.lastOnlineCheck < this.ONLINE_CHECK_INTERVAL) {
      return navigator.onLine;
    }
    
    this.lastOnlineCheck = now;
    
    if (!navigator.onLine) {
      return false;
    }
    
    // Test actual connectivity to Supabase
    try {
      await this.supabase.getClients();
      return true;
    } catch {
      return false;
    }
  }

  private async cacheClients(clients: Client[]): Promise<void> {
    try {
      await hybridDb.clients.clear();
      await hybridDb.clients.bulkAdd(clients);
    } catch (error) {
      console.warn('Erro ao fazer cache dos clientes:', error);
    }
  }

  private async getCachedClients(): Promise<Client[]> {
    try {
      return await hybridDb.clients.orderBy('name').toArray();
    } catch (error) {
      console.warn('Erro ao carregar clientes do cache:', error);
      return [];
    }
  }

  private async cacheMetrics(metrics: MetricRow[]): Promise<void> {
    try {
      // Clear old metrics (keep only last 90 days)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 90);
      
      await hybridDb.metrics
        .where('date')
        .below(oldDate.toISOString().split('T')[0])
        .delete();
      
      // Add new metrics
      await hybridDb.metrics.bulkPut(metrics.map(m => ({
        ...m,
        id: `${m.date}_${m.clientId}_${m.platform}_${m.campaignId || 'all'}`
      })));
    } catch (error) {
      console.warn('Erro ao fazer cache das métricas:', error);
    }
  }

  private async getCachedMetrics(query: MetricsQuery): Promise<MetricRow[]> {
    try {
      let collection = hybridDb.metrics.toCollection();
      
      if (query.clientId) {
        collection = hybridDb.metrics.where('clientId').equals(query.clientId);
      }
      
      const metrics = await collection.toArray();
      
      // Apply filters
      return metrics.filter(m => {
        if (query.from && m.date < query.from) return false;
        if (query.to && m.date > query.to) return false;
        if (query.platform && query.platform !== 'all' && m.platform !== query.platform) return false;
        if (query.campaignId && m.campaignId !== query.campaignId) return false;
        return true;
      });
    } catch (error) {
      console.warn('Erro ao carregar métricas do cache:', error);
      return [];
    }
  }

  private async cacheCampaigns(campaigns: Campaign[]): Promise<void> {
    try {
      await hybridDb.campaigns.bulkPut(campaigns);
    } catch (error) {
      console.warn('Erro ao fazer cache das campanhas:', error);
    }
  }

  private async getCachedCampaigns(clientId: string, query?: CampaignQuery): Promise<Campaign[]> {
    try {
      let campaigns = await hybridDb.campaigns
        .where('clientId')
        .equals(clientId)
        .toArray();
      
      // Apply filters
      if (query?.platform && query.platform !== 'all') {
        campaigns = campaigns.filter(c => c.platform === query.platform);
      }
      
      if (query?.status) {
        campaigns = campaigns.filter(c => c.status === query.status);
      }
      
      return campaigns;
    } catch (error) {
      console.warn('Erro ao carregar campanhas do cache:', error);
      return [];
    }
  }

  private async cacheAlerts(alerts: Alert[]): Promise<void> {
    try {
      await hybridDb.alerts.bulkPut(alerts);
    } catch (error) {
      console.warn('Erro ao fazer cache dos alertas:', error);
    }
  }

  private async getCachedAlerts(clientId: string): Promise<Alert[]> {
    try {
      return await hybridDb.alerts
        .where('clientId')
        .equals(clientId)
        .toArray();
    } catch (error) {
      console.warn('Erro ao carregar alertas do cache:', error);
      return [];
    }
  }

  // Sync methods
  async syncWhenOnline(): Promise<void> {
    if (this.syncInProgress || !(await this.isOnline())) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      console.log('Iniciando sincronização com Supabase...');
      
      // Sync offline optimizations
      await this.syncOfflineOptimizations();
      
      // Sync offline clients
      await this.syncOfflineClients();
      
      console.log('Sincronização concluída');
    } catch (error) {
      console.error('Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOfflineOptimizations(): Promise<void> {
    const localOptimizations = await optimizationOperations.getByClient('');
    
    for (const optimization of localOptimizations) {
      if (optimization.id.includes('offline')) {
        try {
          await this.supabase.upsertOptimization({
            clientId: optimization.client_id,
            title: optimization.title,
            type: optimization.type as any,
            objective: optimization.objective,
            targetMetric: optimization.target_metric,
            expectedImpact: optimization.expected_impact,
            campaigns: optimization.campaigns,
            status: this.mapStatusToEnglish(optimization.status) as any,
            createdAt: optimization.created_at
          });
          
          // Remove local copy after successful sync
          await optimizationOperations.delete(optimization.id);
        } catch (error) {
          console.warn(`Erro ao sincronizar otimização ${optimization.id}:`, error);
        }
      }
    }
  }

  private async syncOfflineClients(): Promise<void> {
    const localClients = await hybridDb.clients
      .where('id')
      .startsWith('client_offline_')
      .toArray();
    
    for (const client of localClients) {
      try {
        await this.supabase.addClient(client);
        
        // Remove local copy after successful sync
        await hybridDb.clients.delete(client.id);
      } catch (error) {
        console.warn(`Erro ao sincronizar cliente ${client.id}:`, error);
      }
    }
  }

  async refreshCache(): Promise<void> {
    await Promise.all([
      hybridDb.clients.clear(),
      hybridDb.campaigns.clear(),
      hybridDb.metrics.clear(),
      hybridDb.alerts.clear(),
      this.supabase.refreshCache()
    ]);
    
    console.log('Cache híbrido limpo');
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

  private mapStatusToEnglish(status: "Planejada" | "Em teste" | "Concluída" | "Abortada"): string {
    switch (status) {
      case 'Planejada':
        return 'planned';
      case 'Em teste':
        return 'in_progress';
      case 'Concluída':
        return 'completed';
      case 'Abortada':
        return 'cancelled';
      default:
        return 'planned';
    }
  }
}
