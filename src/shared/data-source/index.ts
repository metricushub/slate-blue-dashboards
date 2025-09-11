// Re-export existing data source types and utilities
export * from '@/lib/data-source';

// Additional utilities for the refactored dashboard
export const STORAGE_KEYS_EXTENDED = {
  SELECTED_METRICS: 'metricus:selectedMetrics',
  OPTIMIZATIONS: 'metricus:optimizations',
} as const;