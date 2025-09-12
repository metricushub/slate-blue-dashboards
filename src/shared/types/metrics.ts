import { MetricRow } from '@/types';

export type MetricKey = 'spend' | 'leads' | 'cpl' | 'cpa' | 'roas' | 'clicks' | 'impressions' | 'revenue' | 'convRate';

export type MetricDef = {
  key: MetricKey;
  label: string;
  unit: 'currency' | 'int' | 'percent' | 'decimal';
  higherIsBetter: boolean;
  compute?(rows: MetricRow[]): number;
};

export const METRICS: Record<MetricKey, MetricDef> = {
  spend: {
    key: 'spend',
    label: 'Investimento',
    unit: 'currency',
    higherIsBetter: false,
  },
  leads: {
    key: 'leads',
    label: 'Leads',
    unit: 'int',
    higherIsBetter: true,
  },
  cpl: {
    key: 'cpl',
    label: 'CPL',
    unit: 'currency',
    higherIsBetter: false,
    compute: (rows: MetricRow[]) => {
      const totalSpend = rows.reduce((sum, row) => sum + row.spend, 0);
      const totalLeads = rows.reduce((sum, row) => sum + row.leads, 0);
      return totalLeads > 0 ? totalSpend / totalLeads : 0;
    },
  },
  cpa: {
    key: 'cpa',
    label: 'CPA',
    unit: 'currency',
    higherIsBetter: false,
  },
  roas: {
    key: 'roas',
    label: 'ROAS',
    unit: 'decimal',
    higherIsBetter: true,
  },
  clicks: {
    key: 'clicks',
    label: 'Clicks',
    unit: 'int',
    higherIsBetter: true,
  },
  impressions: {
    key: 'impressions',
    label: 'Impressões',
    unit: 'int',
    higherIsBetter: true,
  },
  revenue: {
    key: 'revenue',
    label: 'Receita',
    unit: 'currency',
    higherIsBetter: true,
  },
  convRate: {
    key: 'convRate',
    label: 'Taxa de Conversão',
    unit: 'percent',
    higherIsBetter: true,
    compute: (rows: MetricRow[]) => {
      const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
      const totalLeads = rows.reduce((sum, row) => sum + row.leads, 0);
      return totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    },
  },
};

export const DEFAULT_SELECTED_METRICS: MetricKey[] = ['spend', 'leads', 'cpl', 'roas'];

// Data source configuration
export const DATA_SOURCE_CONFIG = {
  FEATURE_FLAG: import.meta.env.VITE_DATA_SOURCE || 'mock',
} as const;

// Formatting utilities
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}

// Period comparison utilities
export function calculatePeriodChange(current: number, previous: number): {
  change: number;
  isPositive: boolean | null;
} {
  if (previous === 0 && current === 0) {
    return { change: 0, isPositive: null };
  }
  
  if (previous === 0) {
    return { change: 100, isPositive: true };
  }
  
  const change = ((current - previous) / previous) * 100;
  return { 
    change: Math.abs(change), 
    isPositive: change >= 0 
  };
}

export function formatMetricValue(value: number, unit: MetricDef['unit']): string {
  switch (unit) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    case 'int':
      return new Intl.NumberFormat('pt-BR').format(Math.round(value));
    case 'percent':
      return `${value.toFixed(1)}%`;
    case 'decimal':
      return value.toFixed(2);
    default:
      return value.toString();
  }
}