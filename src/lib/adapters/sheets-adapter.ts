import { DataSource, SheetsConfig } from '../data-source';
import { Client, Campaign, MetricRow, Alert } from '@/types';

export class SheetsAdapter implements DataSource {
  constructor(private config: SheetsConfig) {}

  async getClients(): Promise<Client[]> {
    try {
      const response = await fetch(this.config.clientsUrl);
      if (!response.ok) throw new Error('Failed to fetch clients');
      
      const csvText = await response.text();
      return this.parseClientsCSV(csvText);
    } catch (error) {
      console.error('Error fetching clients from Sheets:', error);
      return [];
    }
  }

  async getCampaigns(clientId: string): Promise<Campaign[]> {
    try {
      const response = await fetch(this.config.campaignsUrl);
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      
      const csvText = await response.text();
      const allCampaigns = this.parseCampaignsCSV(csvText);
      return allCampaigns.filter(c => c.clientId === clientId);
    } catch (error) {
      console.error('Error fetching campaigns from Sheets:', error);
      return [];
    }
  }

  async getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]> {
    try {
      const response = await fetch(this.config.metricsUrl);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      
      const csvText = await response.text();
      const allMetrics = this.parseMetricsCSV(csvText);
      
      const fromDate = new Date(from);
      const toDate = new Date(to);
      
      return allMetrics.filter(m => {
        const metricDate = new Date(m.date);
        return m.clientId === clientId && 
               metricDate >= fromDate && 
               metricDate <= toDate;
      });
    } catch (error) {
      console.error('Error fetching metrics from Sheets:', error);
      return [];
    }
  }

  async getAlerts(clientId: string): Promise<Alert[]> {
    // For Sheets adapter, we generate alerts based on client data
    // This is similar to MockAdapter but uses real data from sheets
    try {
      const clients = await this.getClients();
      const client = clients.find(c => c.id === clientId);
      if (!client) return [];

      const alerts: Alert[] = [];

      // Budget alerts
      const budgetUsed = (client.budgetSpentMonth / client.monthlyBudget) * 100;
    if (budgetUsed > 80) {
      alerts.push({
        id: `budget-${clientId}`,
        clientId,
        type: budgetUsed > 95 ? 'error' : 'warning',
        level: budgetUsed > 95 ? 'high' : 'medium',
        title: 'Saldo baixo',
        message: `${Math.round(100 - budgetUsed)}% do orçamento restante`,
        createdAt: new Date().toISOString(),
        isRead: false
      });
    }

      // CPA alerts
      if (client.goalsCPA && client.latestCPA && client.latestCPA > client.goalsCPA) {
        const diff = ((client.latestCPA - client.goalsCPA) / client.goalsCPA * 100).toFixed(0);
      alerts.push({
        id: `cpa-${clientId}`,
        clientId,
        type: 'warning',
        level: 'medium',
        title: 'CPA acima da meta',
        message: `CPA atual R$ ${client.latestCPA.toFixed(2)} (+${diff}% da meta)`,
        createdAt: new Date().toISOString(),
        isRead: false
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
          level: 'high',
          title: 'Sem eventos GA4',
          message: `Nenhum evento registrado há ${Math.round(hoursSince)}h`,
          createdAt: new Date().toISOString(),
          isRead: false
        });
        }
      }

      return alerts;
    } catch (error) {
      console.error('Error generating alerts:', error);
      return [];
    }
  }

  private parseClientsCSV(csvText: string): Client[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });

      return {
        id: obj.id,
        name: obj.name,
        status: obj.status,
        stage: obj.stage,
        owner: obj.owner,
        lastUpdate: obj.last_update,
        logoUrl: obj.logo_url,
        monthlyBudget: parseFloat(obj.monthly_budget) || 0,
        budgetSpentMonth: parseFloat(obj.budget_spent_month) || 0,
        goalsLeads: parseInt(obj.goals_leads) || 0,
        goalsCPA: parseFloat(obj.goals_cpa) || 0,
        goalsROAS: parseFloat(obj.goals_roas) || 0,
        latestLeads: parseInt(obj.latest_leads) || 0,
        latestCPA: parseFloat(obj.latest_cpa) || 0,
        latestROAS: parseFloat(obj.latest_roas) || 0,
        ga4LastEventAt: obj.ga4_last_event_at,
        tags: obj.tags ? obj.tags.split(';') : [],
      } as Client;
    });
  }

  private parseCampaignsCSV(csvText: string): Campaign[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });

      return {
        id: obj.id,
        clientId: obj.client_id,
        platform: obj.platform,
        name: obj.name,
        status: obj.status,
        spend: parseFloat(obj.spend) || 0,
        leads: parseInt(obj.leads) || 0,
        cpa: parseFloat(obj.cpa) || 0,
        roas: parseFloat(obj.roas) || 0,
      } as Campaign;
    });
  }

  private parseMetricsCSV(csvText: string): MetricRow[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });

      return {
        date: obj.date,
        clientId: obj.client_id,
        platform: obj.platform,
        campaignId: obj.campaign_id,
        impressions: parseInt(obj.impressions) || 0,
        clicks: parseInt(obj.clicks) || 0,
        spend: parseFloat(obj.spend) || 0,
        leads: parseInt(obj.leads) || 0,
        revenue: parseFloat(obj.revenue) || 0,
      } as MetricRow;
    });
  }
}