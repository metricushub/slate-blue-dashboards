import { Client, Campaign, MetricRow, Alert, Optimization, Lead, LeadStageConfig } from '@/types';

// Legacy method support
export interface LegacyDataSource {
  getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]>;
  addClient?(client: Client): Promise<void>;
}

export interface DataSource extends LegacyDataSource {
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  getDailyMetrics(query: MetricsQuery): Promise<MetricRow[]>;
  getCampaigns(clientId: string, query?: CampaignQuery): Promise<Campaign[]>;
  getAlerts(clientId: string): Promise<Alert[]>;
  listOptimizations(clientId: string): Promise<Optimization[]>;
  upsertOptimization(input: OptimizationInput): Promise<Optimization>;
  
  // Mutations for clients (optional per adapter)
  updateClient?(id: string, updates: Partial<Client>): Promise<void>;
  deleteClient?(id: string): Promise<void>;
  
  // Lead stages methods
  getLeadStages?(): Promise<LeadStageConfig[]>;
  saveLeadStages?(stages: LeadStageConfig[]): Promise<LeadStageConfig[]>;
}

// Query interfaces
export interface MetricsQuery {
  clientId?: string;
  from?: string; // YYYY-MM-DD
  to?: string;   // YYYY-MM-DD
  platform?: 'all' | 'google_ads' | 'meta_ads';
  campaignId?: string;
}

export interface CampaignQuery {
  platform?: 'all' | 'google_ads' | 'meta_ads';
  status?: 'ENABLED' | 'PAUSED' | 'REMOVED';
}

// Optimization input for upsert
export interface OptimizationInput {
  id?: string;
  clientId: string;
  title: string;
  type: 'campaign' | 'keyword' | 'creative' | 'budget' | 'targeting' | 'landing';
  objective: string;
  targetMetric: string;
  expectedImpact: string;
  campaigns?: string[];
  notes?: string;
  status?: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt?: string;
}

// Data source configuration
export type DataSourceType = 'mock' | 'sheets' | 'supabase' | 'hybrid';

export interface SheetsConfig {
  spreadsheetId: string;
  clientsTab: string;
  campaignsTab: string;
  metricsTab: string;
  refreshInterval?: number;
}

// Storage keys
export const STORAGE_KEYS = {
  DATA_SOURCE_TYPE: 'datasource_type',
  SHEETS_CONFIG: 'sheets_config',
  SELECTED_METRICS: 'selected_metrics',
  CLIENT_FILTERS: 'client_filters',
  OPTIMIZATIONS: 'optimizations',
} as const;