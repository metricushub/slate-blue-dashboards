import { DataSource } from '../data-source';
import { Client, Campaign, MetricRow, Alert } from '@/types';

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

  async getCampaigns(clientId: string): Promise<Campaign[]> {
    return this.campaigns.filter(c => c.clientId === clientId);
  }

  async getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    return this.metrics.filter(m => {
      const metricDate = new Date(m.date);
      return m.clientId === clientId && 
             metricDate >= fromDate && 
             metricDate <= toDate;
    });
  }

  async getAlerts(clientId: string): Promise<Alert[]> {
    const client = this.clients.find(c => c.id === clientId);
    if (!client) return [];

    const alerts: Alert[] = [];

    // Budget alerts
    const budgetUsed = (client.budgetSpentMonth / client.monthlyBudget) * 100;
    if (budgetUsed > 80) {
      alerts.push({
        id: `budget-${clientId}`,
        clientId,
        type: budgetUsed > 95 ? 'error' : 'warning',
        title: 'Saldo baixo',
        message: `${Math.round(100 - budgetUsed)}% do orçamento restante`,
        createdAt: new Date().toISOString(),
      });
    }

    // CPA alerts
    if (client.goalsCPA && client.latestCPA && client.latestCPA > client.goalsCPA) {
      const diff = ((client.latestCPA - client.goalsCPA) / client.goalsCPA * 100).toFixed(0);
      alerts.push({
        id: `cpa-${clientId}`,
        clientId,
        type: 'warning',
        title: 'CPA acima da meta',
        message: `CPA atual R$ ${client.latestCPA.toFixed(2)} (+${diff}% da meta)`,
        createdAt: new Date().toISOString(),
      });
    }

    // GA4 events alert
    if (client.ga4LastEventAt) {
      const lastEvent = new Date(client.ga4LastEventAt);
      const hoursSince = (Date.now() - lastEvent.getTime()) / (1000 * 60 * 60);
      if (hoursSince > 24) {
        alerts.push({
          id: `ga4-${clientId}`,
          clientId,
          type: 'error',
          title: 'Sem eventos GA4',
          message: `Nenhum evento registrado há ${Math.round(hoursSince)}h`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }

  async addClient(client: Client): Promise<void> {
    this.clients.push(client);
    
    // Generate some sample campaigns for the new client
    const campaignCount = Math.floor(Math.random() * 3) + 6; // 6-8 campaigns
    for (let i = 0; i < campaignCount; i++) {
      const campaign: Campaign = {
        id: `camp-${client.id}-${i + 1}`,
        clientId: client.id,
        name: `Campanha ${i + 1}`,
        platform: ['google', 'meta', 'linkedin'][Math.floor(Math.random() * 3)] as Campaign['platform'],
        status: ['active', 'paused', 'active', 'active'][Math.floor(Math.random() * 4)] as Campaign['status'],
        spend: Math.random() * 5000 + 1000,
        leads: Math.floor(Math.random() * 50) + 10,
        cpa: Math.random() * 200 + 50,
        roas: Math.random() * 5 + 2,
        clicks: Math.floor(Math.random() * 1000) + 200,
        impressions: Math.floor(Math.random() * 10000) + 5000,
        revenue: 0,
      };
      campaign.revenue = campaign.spend * campaign.roas;
      this.campaigns.push(campaign);
    }

    // Generate 90 days of metrics
    this.generateMetricsForClient(client.id);
  }

  private initializeData() {
    // Generate 10 clients
    const owners = ['Ana Silva', 'Carlos Santos', 'Mariana Costa', 'Pedro Oliveira', 'Juliana Lima'];
    const segments = ['E-commerce', 'SaaS', 'Educação', 'Saúde', 'Imobiliário', 'Serviços', 'Fintech'];
    const stages = ['Setup inicial', 'Otimização', 'Crescimento', 'Manutenção', 'Expansão'];

    for (let i = 1; i <= 10; i++) {
      const budgetSpent = Math.random() * 0.9; // 0-90% spent
      const client: Client = {
        id: `client-${i}`,
        name: `Cliente ${i}`,
        website: `https://cliente${i}.com.br`,
        segment: segments[Math.floor(Math.random() * segments.length)],
        monthlyBudget: Math.floor(Math.random() * 20000) + 5000,
        budgetSpentMonth: 0,
        status: ['active', 'onboarding', 'at_risk'][Math.floor(Math.random() * 3)] as Client['status'],
        stage: stages[Math.floor(Math.random() * stages.length)],
        owner: owners[Math.floor(Math.random() * owners.length)],
        lastUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        logoUrl: `https://ui-avatars.com/api/?name=Cliente+${i}&background=0D8ABC&color=fff`,
        tags: ['Google Ads', 'Meta Ads'].slice(0, Math.floor(Math.random() * 2) + 1),
        goalsLeads: Math.floor(Math.random() * 100) + 50,
        goalsCPA: Math.random() * 150 + 50,
        goalsROAS: Math.random() * 3 + 3,
        latestLeads: Math.floor(Math.random() * 80) + 20,
        latestCPA: Math.random() * 200 + 30,
        latestROAS: Math.random() * 4 + 2,
        ga4LastEventAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000).toISOString(),
        contacts: [{
          id: `contact-${i}-1`,
          name: `Contato ${i}`,
          email: `contato@cliente${i}.com.br`,
          role: 'Marketing Manager',
          isPrimary: true,
        }],
      };
      client.budgetSpentMonth = client.monthlyBudget * budgetSpent;
      this.clients.push(client);

      // Generate campaigns for each client
      const campaignCount = Math.floor(Math.random() * 3) + 6; // 6-8 campaigns
      for (let j = 0; j < campaignCount; j++) {
        const campaign: Campaign = {
          id: `camp-${i}-${j + 1}`,
          clientId: client.id,
          name: `Campanha ${j + 1}`,
          platform: ['google', 'meta', 'linkedin'][Math.floor(Math.random() * 3)] as Campaign['platform'],
          status: ['active', 'paused', 'active', 'active'][Math.floor(Math.random() * 4)] as Campaign['status'],
          spend: Math.random() * 5000 + 1000,
          leads: Math.floor(Math.random() * 50) + 10,
          cpa: Math.random() * 200 + 50,
          roas: Math.random() * 5 + 2,
          clicks: Math.floor(Math.random() * 1000) + 200,
          impressions: Math.floor(Math.random() * 10000) + 5000,
          revenue: 0,
        };
        campaign.revenue = campaign.spend * campaign.roas;
        this.campaigns.push(campaign);
      }

      // Generate 90 days of metrics for each client
      this.generateMetricsForClient(client.id);
    }
  }

  private generateMetricsForClient(clientId: string) {
    const platforms: MetricRow['platform'][] = ['google', 'meta'];
    const today = new Date();
    
    for (let day = 0; day < 90; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() - day);
      
      for (const platform of platforms) {
        // Base values with some trend and seasonality
        const trend = 1 + (day / 90) * 0.2; // Slight upward trend
        const seasonality = 1 + Math.sin(day / 7) * 0.1; // Weekly pattern
        const randomFactor = 0.8 + Math.random() * 0.4; // Random variation
        
        const baseSpend = 200 * trend * seasonality * randomFactor;
        const baseImpressions = baseSpend * (50 + Math.random() * 30);
        const ctr = 0.02 + Math.random() * 0.03; // 2-5% CTR
        const conversionRate = 0.05 + Math.random() * 0.05; // 5-10% conversion
        
        const metric: MetricRow = {
          date: date.toISOString().split('T')[0],
          clientId,
          platform,
          impressions: Math.floor(baseImpressions),
          clicks: Math.floor(baseImpressions * ctr),
          spend: Math.floor(baseSpend),
          leads: Math.floor(baseImpressions * ctr * conversionRate),
          revenue: Math.floor(baseSpend * (2 + Math.random() * 3)), // 2-5x ROAS
        };
        
        this.metrics.push(metric);
      }
    }
  }
}