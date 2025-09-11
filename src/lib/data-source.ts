import { Client, Campaign, MetricRow, Alert } from '@/types';

export interface DataSource {
  getClients(): Promise<Client[]>;
  getMetrics(clientId: string, from: string, to: string): Promise<MetricRow[]>;
  getCampaigns(clientId: string): Promise<Campaign[]>;
  getAlerts(clientId: string): Promise<Alert[]>;
  addClient?(client: Client): Promise<void>;
}

// Configuration interface for Sheets adapter
export interface SheetsConfig {
  clientsUrl: string;
  campaignsUrl: string;
  metricsUrl: string;
}

// Storage keys
export const STORAGE_KEYS = {
  SHEETS_CONFIG: 'sheets_config',
  DATA_SOURCE_TYPE: 'data_source_type',
  METRIC_SELECTIONS: 'metric_selections',
} as const;

export type DataSourceType = 'mock' | 'sheets';