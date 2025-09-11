import { MetricKey } from './metrics';

export type Optimization = {
  id: string;
  clientId: string;
  date: string;
  objective: string;
  action: string;
  targetMetric: MetricKey;
  baseline: number | null;
  expected: number | null;
  notes?: string;
  status: 'planned' | 'executed';
};

export type OptimizationFormData = Omit<Optimization, 'id' | 'date'> & {
  date?: string;
};