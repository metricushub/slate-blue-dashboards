export interface Client {
  id: string;
  name: string;
  website?: string;
  segment?: string;
  monthlyBudget: number;
  budgetSpentMonth: number;
  status: 'active' | 'onboarding' | 'at_risk' | 'paused' | 'churned';
  stage: string;
  owner: string;
  lastUpdate: string;
  logoUrl?: string;
  tags: string[];
  
  // Goals/KPIs
  goalsLeads?: number;
  goalsCPA?: number;
  goalsROAS?: number;
  
  // Latest metrics for health score
  latestLeads?: number;
  latestCPA?: number;
  latestROAS?: number;
  
  // GA4 monitoring
  ga4LastEventAt?: string;
  
  // Contact info
  contacts?: ClientContact[];
  
  // Access credentials
  access?: ClientAccess;
  
  // Onboarding checklist
  onboarding?: OnboardingItem[];
}

export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

export interface ClientAccess {
  businessManager?: string;
  ga4PropertyId?: string;
  gtmContainerId?: string;
  searchConsoleUrl?: string;
  notes?: string;
}

export interface OnboardingItem {
  id: string;
  task: string;
  completed: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export interface Campaign {
  id: string;
  clientId: string;
  name: string;
  platform: 'google' | 'meta' | 'linkedin' | 'tiktok';
  status: 'active' | 'paused' | 'draft' | 'ended';
  spend: number;
  leads: number;
  cpa: number;
  roas: number;
  clicks?: number;
  impressions?: number;
  revenue?: number;
}

export interface MetricRow {
  date: string;
  clientId: string;
  platform: 'google' | 'meta' | 'all';
  campaignId?: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  revenue: number;
}

export interface Alert {
  id: string;
  clientId: string;
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  dismissed?: boolean;
}

export interface KPIData {
  value: number;
  change: number;
  isPositive: boolean;
  label: string;
}

export interface PeriodFilter {
  days: number;
  label: string;
  custom?: boolean;
}

export interface MetricType {
  key: string;
  label: string;
  format: 'number' | 'currency' | 'percentage';
}

export type ClientStatus = Client['status'];
export type Platform = Campaign['platform'];
export type AlertType = Alert['type'];