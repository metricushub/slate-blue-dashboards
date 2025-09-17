import { MetricKey } from '@/shared/types/metrics';

export type GoalPeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type GoalOperator = 'gte' | 'lte' | 'eq' | 'range';
export type GoalStatus = 'active' | 'paused' | 'completed' | 'failed';
export type AlertFrequency = 'immediate' | 'daily' | 'weekly';

export interface Goal {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  metric: MetricKey;
  operator: GoalOperator;
  targetValue: number;
  maxValue?: number; // For range goals
  period: GoalPeriod;
  startDate: string;
  endDate?: string;
  status: GoalStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  
  // Alert configuration
  enableAlerts: boolean;
  alertFrequency: AlertFrequency;
  alertThreshold: number; // Percentage threshold to trigger alert
  alertRecipients: string[];
  
  // Progress tracking
  currentValue?: number;
  progress?: number; // 0-100%
  lastCalculatedAt?: string;
  
  // Advanced settings
  category?: string;
  tags?: string[];
  isTemplate?: boolean;
}

export interface GoalProgress {
  goalId: string;
  date: string;
  actualValue: number;
  targetValue: number;
  progress: number;
  isOnTrack: boolean;
  variance: number;
  variantPercent: number;
}

export interface GoalAlert {
  id: string;
  goalId: string;
  clientId: string;
  type: 'under_performance' | 'over_performance' | 'deadline_approaching' | 'goal_achieved';
  severity: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
}

export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  businessType: 'ecommerce' | 'lead_generation' | 'branding' | 'saas' | 'general';
  goals: Omit<Goal, 'id' | 'clientId' | 'createdAt' | 'updatedAt' | 'createdBy'>[];
}

export const GOAL_CATEGORIES = [
  'Aquisição',
  'Conversão',
  'Receita',
  'Qualidade',
  'Eficiência',
  'Crescimento'
] as const;

export const BUSINESS_TYPES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'lead_generation', label: 'Geração de Leads' },
  { value: 'branding', label: 'Branding' },
  { value: 'saas', label: 'SaaS' },
  { value: 'general', label: 'Geral' }
] as const;