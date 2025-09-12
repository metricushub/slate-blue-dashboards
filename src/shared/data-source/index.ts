// Re-export existing data source types and utilities
export * from '@/lib/data-source';

// Additional utilities for the refactored dashboard
export const STORAGE_KEYS_EXTENDED = {
  SELECTED_METRICS: 'metricus:dash:metrics',
  OPTIMIZATIONS: 'metricus:optimizations',
} as const;

// Feature flags for data source switching
export const FEATURE_FLAGS = {
  DATA_SOURCE: (import.meta.env.VITE_DATA_SOURCE as 'mock' | 'sheets') || 'mock',
} as const;

// Telemetry utility (console logging for now)
export function track(event: string, payload: Record<string, any>) {
  console.log(`📊 [${event}]`, payload);
}

// Data validation guards
export function safeCalculate(numerator: number, denominator: number, fallback = 0): number {
  if (denominator === 0 || !isFinite(numerator) || !isFinite(denominator)) {
    return fallback;
  }
  return numerator / denominator;
}