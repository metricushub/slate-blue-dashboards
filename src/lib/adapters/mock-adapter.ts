import { DataSource, MetricsQuery, CampaignQuery, OptimizationInput } from '@/shared/data-source/types';
import { Client, Campaign, MetricRow, Alert, Optimization } from '@/types';

export class MockAdapter implements DataSource {
  private clients: Client[] = [];
  private campaigns: Campaign[] = [];
  private metrics: MetricRow[] = [];

  constructor() {
    this.initializeData();
  }

  async getClients(): Promise<Client[]> {
    return [...this.clients];
  }

  async getClient(id: string): Promise<Client | null> {
    return this.clients.find(client => client.id === id) || null;
  }

  async getDailyMetrics(query: MetricsQuery): Promise<MetricRow[]> {
    let filteredMetrics = [...this.metrics];

    if (query.clientId) {
      filteredMetrics = filteredMetrics.filter(m => m.clientId === query.clientId);
    }

    if (query.from) {
      const fromDate = new Date(query.from);
      filteredMetrics = filteredMetrics.filter(m => new Date(m.date) >= fromDate);
    }

    if (query.to) {
      const toDate = new Date(query.to);
      filteredMetrics = filteredMetrics.filter(m => new Date(m.date) <= toDate);
    }

    if (query.platform && query.platform !== 'all') {
      filteredMetrics = filteredMetrics.filter(m => m.platform === query.platform);
    }

    return filteredMetrics;
  }

  async getCampaigns(clientId: string, query?: CampaignQuery): Promise<Campaign[]> {
    let campaigns = this.campaigns.filter(c => c.clientId === clientId);

    if (query?.platform && query.platform !== 'all') {
      campaigns = campaigns.filter(c => c.platform === query.platform);
    }

    if (query?.status) {
      campaigns = campaigns.filter(c => c.status === query.status);
    }

    return campaigns;
  }

  async getAlerts(clientId: string): Promise<Alert[]> {
    const client = await this.getClient(clientId);
    if (!client) return [];

    const alerts: Alert[] = [];

    // Budget alerts based on budgetMonth
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const monthlyMetrics = await this.getDailyMetrics({
      clientId,
      from: startDate,
      to: endDate
    });

    const totalSpend = monthlyMetrics.reduce((sum, m) => sum + m.spend, 0);
    const budgetPercentage = client.budgetMonth > 0 ? (totalSpend / client.budgetMonth) * 100 : 0;

    if (budgetPercentage > 90) {
      alerts.push({
        id: `budget_high_${clientId}`,
        clientId,
        type: 'budget',
        level: 'high',
        title: 'Orçamento quase esgotado',
        message: `${budgetPercentage.toFixed(1)}% do orçamento mensal utilizado`,
        createdAt: new Date().toISOString(),
        isRead: false
      });
    } else if (budgetPercentage > 75) {
      alerts.push({
        id: `budget_medium_${clientId}`,
        clientId,
        type: 'budget',
        level: 'medium',
        title: 'Atenção ao orçamento',
        message: `${budgetPercentage.toFixed(1)}% do orçamento mensal utilizado`,
        createdAt: new Date().toISOString(),
        isRead: false
      });
    }

    // Performance alerts
    const weeklyMetrics = await this.getDailyMetrics({
      clientId,
      from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to: endDate
    });

    if (weeklyMetrics.length > 0) {
      const avgCPA = weeklyMetrics.reduce((sum, m) => {
        const cpa = m.leads > 0 ? m.spend / m.leads : 0;
        return sum + cpa;
      }, 0) / weeklyMetrics.length;

      if (avgCPA > 100) {
        alerts.push({
          id: `cpa_high_${clientId}`,
          clientId,
          type: 'performance',
          level: 'medium',
          title: 'CPA elevado',
          message: `CPA médio de R$ ${avgCPA.toFixed(2)} nos últimos 7 dias`,
          createdAt: new Date().toISOString(),
          isRead: false
        });
      }
    }

    return alerts;
  }

  async listOptimizations(clientId: string): Promise<Optimization[]> {
    const stored = localStorage.getItem(`optimizations_${clientId}`);
    return stored ? JSON.parse(stored) : [];
  }

  async upsertOptimization(input: OptimizationInput): Promise<Optimization> {
    const optimizations = await this.listOptimizations(input.clientId);
    
    const optimization: Optimization = {
      id: input.id || `opt_${Date.now()}`,
      client_id: input.clientId,
      title: input.title,
      type: input.type,
      objective: input.objective,
      target_metric: input.targetMetric,
      expected_impact: input.expectedImpact,
      campaigns: input.campaigns || [],
      start_date: input.createdAt || new Date().toISOString(),
      status: (input.status === 'planned' ? 'Planejada' : 
               input.status === 'in_progress' ? 'Em teste' : 
               input.status === 'completed' ? 'Concluída' : 'Abortada') as any,
      created_at: input.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const index = optimizations.findIndex(o => o.id === optimization.id);
    if (index >= 0) {
      optimizations[index] = optimization;
    } else {
      optimizations.push(optimization);
    }

    localStorage.setItem(`optimizations_${input.clientId}`, JSON.stringify(optimizations));
    return optimization;
  }

  // Legacy methods for compatibility
  async getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]> {
    return this.getDailyMetrics({ clientId, from, to });
  }

  async addClient(client: Client): Promise<void> {
    this.clients.push(client);
    this.generateCampaignsForClient(client.id);
    this.generateMetricsForClient(client.id);
  }

  private initializeData() {
    // Generate sample clients
    const owners = ['Ana Silva', 'Carlos Santos', 'Marina Costa', 'Pedro Oliveira', 'Juliana Lima'];
    
    for (let i = 1; i <= 5; i++) {
      const client: Client = {
        id: `client-${i}`,
        name: `Cliente ${i}`,
        status: ['Ativo', 'Pausado', 'Risco', 'Prospect'][Math.floor(Math.random() * 4)] as Client['status'],
        stage: ['Prospecção', 'Onboarding: Setup', 'Rodando', 'Revisão'][Math.floor(Math.random() * 4)] as Client['stage'],
        owner: owners[Math.floor(Math.random() * owners.length)],
        lastUpdate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        logoUrl: `https://ui-avatars.com/api/?name=Cliente+${i}&background=0D8ABC&color=fff`,
        budgetMonth: Math.floor(Math.random() * 20000) + 5000,
        // Legacy compatibility fields
        monthlyBudget: Math.floor(Math.random() * 20000) + 5000,
        budgetSpentMonth: Math.floor(Math.random() * 15000),
        tags: ['Google Ads', 'Meta Ads'].slice(0, Math.floor(Math.random() * 2) + 1)
      };
      
      this.clients.push(client);
      this.generateCampaignsForClient(client.id);
      this.generateMetricsForClient(client.id);
    }
  }

  private generateCampaignsForClient(clientId: string) {
    const campaignCount = Math.floor(Math.random() * 4) + 3; // 3-6 campaigns
    
    for (let j = 0; j < campaignCount; j++) {
      const platform = ['google_ads', 'meta_ads'][Math.floor(Math.random() * 2)] as Campaign['platform'];
      const campaign: Campaign = {
        id: `camp-${clientId}-${j + 1}`,
        clientId,
        platform,
        name: `Campanha ${platform === 'google_ads' ? 'Google' : 'Meta'} ${j + 1}`,
        status: ['ENABLED', 'PAUSED', 'ENABLED', 'ENABLED'][Math.floor(Math.random() * 4)] as Campaign['status'],
        objective: platform === 'google_ads' ? 'Conversões' : 'Geração de leads',
        lastSync: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        // Legacy compatibility fields
        spend: Math.random() * 5000 + 1000,
        leads: Math.floor(Math.random() * 50) + 10,
        cpa: Math.random() * 200 + 50,
        roas: Math.random() * 5 + 2
      };
      
      this.campaigns.push(campaign);
    }
  }

  private generateMetricsForClient(clientId: string) {
    const platforms: MetricRow['platform'][] = ['google', 'meta'];
    const today = new Date();
    
    for (let day = 0; day < 90; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      
      for (const platform of platforms) {
        const trend = 1 + (day / 90) * 0.2;
        const seasonality = 1 + Math.sin(day / 7) * 0.1;
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        const baseSpend = 200 * trend * seasonality * randomFactor;
        const baseImpressions = baseSpend * (50 + Math.random() * 30);
        const ctr = 0.02 + Math.random() * 0.03;
        const conversionRate = 0.05 + Math.random() * 0.05;
        
        const impressions = Math.floor(baseImpressions);
        const clicks = Math.floor(baseImpressions * ctr);
        const spend = Math.floor(baseSpend);
        const leads = Math.floor(clicks * conversionRate);
        const revenue = Math.floor(spend * (2 + Math.random() * 3));
        const conversions = Math.floor(leads * 0.8); // 80% of leads convert
        
        const metric: MetricRow = {
          date: date.toISOString().split('T')[0],
          clientId,
          platform,
          campaignId: `camp-${clientId}-1`,
          impressions,
          clicks,
          spend,
          leads,
          revenue,
          conversions,
          cpa: leads > 0 ? spend / leads : 0,
          roas: spend > 0 ? revenue / spend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
          convRate: clicks > 0 ? (leads / clicks) * 100 : 0
        };
        
        this.metrics.push(metric);
      }
    }
  }
}