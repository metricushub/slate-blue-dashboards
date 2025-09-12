import { DataSource } from '../types';
import { Client, Campaign, MetricRow, Alert, Optimization } from '@/types';
import { CampaignQuery, MetricsQuery, OptimizationInput } from '../types';

// Google Sheets configuration from env
const SPREADSHEET_ID = import.meta.env.VITE_SHEETS_SPREADSHEET_ID;
const TAB_CLIENTS = import.meta.env.VITE_SHEETS_TAB_CLIENTS || 'clients';
const TAB_CAMPAIGNS = import.meta.env.VITE_SHEETS_TAB_CAMPAIGNS || 'campaigns';
const TAB_METRICS = import.meta.env.VITE_SHEETS_TAB_DAILY || 'metrics';
const REFRESH_INTERVAL = parseInt(import.meta.env.VITE_SHEETS_REFRESH_SEC || '900') * 1000; // Default 15min

export class SheetsAdapter implements DataSource {
  private cache = new Map<string, { data: any; timestamp: number; etag?: string }>();

  // Legacy method for compatibility
  async getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]> {
    return this.getDailyMetrics({ clientId, from, to });
  }

  private async fetchSheetData(sheetName: string): Promise<any[]> {
    if (!SPREADSHEET_ID) {
      throw new Error('VITE_SHEETS_SPREADSHEET_ID não configurado no .env');
    }

    const cacheKey = `sheet_${sheetName}`;
    const cached = this.cache.get(cacheKey);
    
    // Check cache validity
    if (cached && Date.now() - cached.timestamp < REFRESH_INTERVAL) {
      return cached.data;
    }

    try {
      const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
      const response = await fetch(url, { cache: 'no-cache' });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(`Aba "${sheetName}" não encontrada ou não publicada. Verifique se a aba existe e está visível para qualquer pessoa com o link.`);
        }
        throw new Error(`Erro ao acessar planilha: ${response.status}`);
      }

      const text = await response.text();
      
      // Parse Google Visualization JSON response
      const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\((.+)\);/);
      if (!jsonMatch) {
        throw new Error(`Formato de resposta inválido da aba "${sheetName}"`);
      }

      const data = JSON.parse(jsonMatch[1]);
      
      if (data.status === 'error') {
        throw new Error(`Erro da planilha: ${data.errors?.[0]?.detailed_message || 'Erro desconhecido'}`);
      }

      // Convert Google Sheets format to array of objects
      const rows = this.parseGoogleSheetsData(data);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: rows,
        timestamp: Date.now(),
        etag: response.headers.get('etag') || undefined
      });

      return rows;
    } catch (error) {
      console.error(`Erro ao carregar aba "${sheetName}":`, error);
      
      // Return cached data if available, even if expired
      if (cached) {
        console.warn(`Usando dados em cache para aba "${sheetName}"`);
        return cached.data;
      }
      
      throw error;
    }
  }

  private parseGoogleSheetsData(data: any): any[] {
    if (!data.table?.rows) return [];

    const cols = data.table.cols || [];
    const rows = data.table.rows || [];

    return rows.map((row: any) => {
      const obj: any = {};
      
      cols.forEach((col: any, index: number) => {
        const cellData = row.c?.[index];
        const columnId = col.id || col.label || `col_${index}`;
        
        if (cellData?.v !== null && cellData?.v !== undefined) {
          let value = cellData.v;
          
          // Handle different data types
          if (col.type === 'number') {
            value = parseFloat(value) || 0;
          } else if (col.type === 'date') {
            // Google Sheets date format
            value = new Date(value).toISOString().split('T')[0];
          } else if (col.type === 'datetime') {
            value = new Date(value).toISOString();
          } else {
            value = String(value);
          }
          
          obj[columnId] = value;
        } else {
          // Handle empty cells
          obj[columnId] = col.type === 'number' ? 0 : '';
        }
      });
      
      return obj;
    });
  }

  async getClients(): Promise<Client[]> {
    try {
      const rawData = await this.fetchSheetData(TAB_CLIENTS);
      return this.validateClientsData(rawData);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      throw new Error(`Não foi possível carregar os dados dos clientes: ${error.message}`);
    }
  }

  async getClient(id: string): Promise<Client | null> {
    const clients = await this.getClients();
    return clients.find(client => client.id === id) || null;
  }

  async getDailyMetrics(query: MetricsQuery): Promise<MetricRow[]> {
    try {
      const rawData = await this.fetchSheetData(TAB_METRICS);
      let metrics = this.validateMetricsData(rawData);

      // Apply filters
      if (query.clientId) {
        metrics = metrics.filter(m => m.clientId === query.clientId);
      }
      
      if (query.from) {
        metrics = metrics.filter(m => m.date >= query.from);
      }
      
      if (query.to) {
        metrics = metrics.filter(m => m.date <= query.to);
      }
      
      if (query.platform && query.platform !== 'all') {
        metrics = metrics.filter(m => m.platform === query.platform);
      }

      return metrics;
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      throw new Error(`Não foi possível carregar as métricas: ${error.message}`);
    }
  }

  async getCampaigns(clientId: string, query?: CampaignQuery): Promise<Campaign[]> {
    try {
      const rawData = await this.fetchSheetData(TAB_CAMPAIGNS);
      let campaigns = this.validateCampaignsData(rawData);

      // Filter by client
      campaigns = campaigns.filter(c => c.clientId === clientId);

      // Apply additional filters
      if (query?.platform && query.platform !== 'all') {
        campaigns = campaigns.filter(c => c.platform === query.platform);
      }

      if (query?.status) {
        campaigns = campaigns.filter(c => c.status === query.status);
      }

      return campaigns;
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      throw new Error(`Não foi possível carregar as campanhas: ${error.message}`);
    }
  }

  async getAlerts(clientId: string): Promise<Alert[]> {
    // Generate alerts based on client data and metrics
    const client = await this.getClient(clientId);
    if (!client) return [];

    const alerts: Alert[] = [];
    
    // Get recent metrics (last 7 days)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      const metrics = await this.getDailyMetrics({
        clientId,
        from: startDate,
        to: endDate
      });

      // Calculate total spend in the period
      const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
      const monthlyBudget = client.budgetMonth || 0;
      
      // Budget alerts
      if (monthlyBudget > 0) {
        const spendPercentage = (totalSpend / monthlyBudget) * 100;
        
        if (spendPercentage > 90) {
          alerts.push({
            id: `budget_high_${clientId}`,
            clientId,
            type: 'budget',
            level: 'high',
            title: 'Orçamento quase esgotado',
            message: `${spendPercentage.toFixed(1)}% do orçamento mensal já foi utilizado`,
            createdAt: new Date().toISOString(),
            isRead: false
          });
        } else if (spendPercentage > 75) {
          alerts.push({
            id: `budget_medium_${clientId}`,
            clientId,
            type: 'budget',
            level: 'medium',
            title: 'Atenção ao orçamento',
            message: `${spendPercentage.toFixed(1)}% do orçamento mensal utilizado`,
            createdAt: new Date().toISOString(),
            isRead: false
          });
        }
      }

      // Performance alerts
      const avgCPA = metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.cpa, 0) / metrics.length : 0;
      
      if (avgCPA > 100) { // Arbitrary threshold
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

      return alerts;
    } catch (error) {
      console.error('Erro ao gerar alertas:', error);
      return [];
    }
  }

  // Optimization methods (stored locally)
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

    // Update or add
    const index = optimizations.findIndex(o => o.id === optimization.id);
    if (index >= 0) {
      optimizations[index] = optimization;
    } else {
      optimizations.push(optimization);
    }

    // Save to localStorage
    localStorage.setItem(`optimizations_${input.clientId}`, JSON.stringify(optimizations));
    
    return optimization;
  }

  // Force refresh cache
  async refreshCache(): Promise<void> {
    this.cache.clear();
    console.log('Cache do Google Sheets limpo');
  }

  // Get cache status for integration page
  getCacheStatus(): { sheet: string; lastUpdate: string; rowCount: number }[] {
    const status = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith('sheet_')) {
        status.push({
          sheet: key.replace('sheet_', ''),
          lastUpdate: new Date(value.timestamp).toLocaleString('pt-BR'),
          rowCount: Array.isArray(value.data) ? value.data.length : 0
        });
      }
    }
    
    return status;
  }

  // Validation methods
  private validateClientsData(rawData: any[]): Client[] {
    const requiredFields = ['id', 'name', 'status', 'stage'];
    
    return rawData.map(row => {
      // Check required fields
      for (const field of requiredFields) {
        if (!row[field]) {
          throw new Error(`Campo obrigatório "${field}" ausente na aba clients`);
        }
      }

      return {
        id: String(row.id),
        name: String(row.name),
        status: String(row.status) as Client['status'],
        stage: String(row.stage) as Client['stage'],
        owner: String(row.owner || ''),
        lastUpdate: row.last_update || new Date().toISOString().split('T')[0],
        logoUrl: String(row.logo_url || ''),
        budgetMonth: parseFloat(row.budget_month) || 0
      };
    });
  }

  private validateCampaignsData(rawData: any[]): Campaign[] {
    const requiredFields = ['id', 'client_id', 'platform', 'name', 'status'];
    
    return rawData.map(row => {
      // Check required fields
      for (const field of requiredFields) {
        if (!row[field]) {
          throw new Error(`Campo obrigatório "${field}" ausente na aba campaigns`);
        }
      }

      return {
        id: String(row.id),
        clientId: String(row.client_id),
        platform: String(row.platform) as Campaign['platform'],
        name: String(row.name),
        status: String(row.status) as Campaign['status'],
        objective: String(row.objective || ''),
        lastSync: row.last_sync || new Date().toISOString()
      };
    });
  }

  private validateMetricsData(rawData: any[]): MetricRow[] {
    const requiredFields = ['date', 'client_id', 'platform'];
    
    return rawData.map(row => {
      // Check required fields
      for (const field of requiredFields) {
        if (!row[field]) {
          throw new Error(`Campo obrigatório "${field}" ausente na aba metrics`);
        }
      }

      const impressions = parseFloat(row.impressions) || 0;
      const clicks = parseFloat(row.clicks) || 0;
      const spend = parseFloat(row.spend) || 0;
      const leads = parseFloat(row.leads) || 0;
      const revenue = parseFloat(row.revenue) || 0;
      const conversions = parseFloat(row.conversions) || 0;

      // Calculate derived metrics if not provided
      const cpa = row.cpa ? parseFloat(row.cpa) : (leads > 0 ? spend / leads : 0);
      const roas = row.roas ? parseFloat(row.roas) : (spend > 0 ? revenue / spend : 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      const convRate = clicks > 0 ? (leads / clicks) * 100 : 0;

      return {
        date: String(row.date),
        clientId: String(row.client_id),
        platform: String(row.platform) as MetricRow['platform'],
        campaignId: String(row.campaign_id || ''),
        impressions,
        clicks,
        spend,
        leads,
        revenue,
        conversions,
        cpa,
        roas,
        ctr,
        convRate
      };
    });
  }
}