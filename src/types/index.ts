// Client types
export interface Client {
  id: string;
  name: string;
  status: 'Ativo' | 'Pausado' | 'Risco' | 'Prospect' | 'Arquivado' | 'active' | 'paused' | 'onboarding' | 'at_risk' | 'churned';
  stage: 'Prospecção' | 'Onboarding: Docs' | 'Onboarding: Setup' | 'Rodando' | 'Revisão' | 'Encerrado' | 'Setup inicial';
  owner: string;
  lastUpdate: string; // YYYY-MM-DD
  logoUrl?: string;
  budgetMonth: number; // in reais
  // Legacy fields for compatibility
  monthlyBudget?: number;
  budgetSpentMonth?: number;
  tags?: string[];
  website?: string;
  segment?: string;
  goalsLeads?: number;
  goalsCPA?: number;
  goalsROAS?: number;
  latestLeads?: number;
  latestCPA?: number;
  latestROAS?: number;
  ga4LastEventAt?: string;
  contacts?: ClientContact[];
  onboarding?: OnboardingItem[];
  access?: ClientAccess;
}

// Client-related types
export interface ClientContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  isPrimary: boolean;
}

export interface ClientAccess {
  gaPropertyId?: string;
  ga4PropertyId?: string;
  googleAdsCustomerId?: string;
  metaAdAccountId?: string;
  businessManager?: string;
  gtmContainerId?: string;
  searchConsoleUrl?: string;
  notes?: string;
  hasGA4Access: boolean;
  hasGoogleAdsAccess: boolean;
  hasMetaAccess: boolean;
}

export interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  task?: string;
  completed: boolean;
  completedAt?: string;
  required: boolean;
}

// Campaign types
export interface Campaign {
  id: string;
  clientId: string;
  platform: 'google_ads' | 'meta_ads' | 'google' | 'meta' | 'linkedin' | 'tiktok';
  name: string;
  status: 'ENABLED' | 'PAUSED' | 'REMOVED' | 'active' | 'paused' | 'draft' | 'ended';
  objective?: string;
  lastSync: string; // ISO date
  // Legacy fields for compatibility
  spend?: number;
  leads?: number;
  cpa?: number;
  roas?: number;
  clicks?: number;
  impressions?: number;
  revenue?: number;
}

// Metric types
export interface MetricRow {
  date: string; // YYYY-MM-DD
  clientId: string;
  platform: 'all' | 'google' | 'meta' | 'google_ads' | 'meta_ads' | 'linkedin' | 'tiktok';
  campaignId?: string;
  impressions: number;
  clicks: number;
  spend: number;
  leads: number;
  revenue: number;
  conversions?: number;
  cpa?: number; // cost per acquisition
  roas?: number; // return on ad spend
  ctr?: number; // click-through rate (%)
  convRate?: number; // conversion rate (%)
}

// Alert types
export interface Alert {
  id: string;
  clientId: string;
  type: 'budget' | 'performance' | 'campaign' | 'system' | 'error' | 'info' | 'warning';
  level: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  dismissed?: boolean;
  actionUrl?: string;
}

// Optimization types
export interface Optimization {
  id: string;
  clientId: string;
  title: string;
  type: 'campaign' | 'keyword' | 'creative' | 'budget' | 'targeting' | 'landing';
  objective: string;
  targetMetric: string;
  expectedImpact: string;
  campaigns: string[];
  notes: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  actualImpact?: string;
}

// Lead types for CRM
export type LeadStage = "Novo" | "Qualificação" | "Proposta" | "Fechado";

export interface Lead {
  id: string;                // uuid
  created_at: string;        // ISO
  updated_at?: string;       // ISO
  name: string;
  email?: string;
  phone?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  value?: number;            // potencial em moeda
  owner?: string;            // responsável
  stage: LeadStage;          // coluna do Kanban
  notes?: string;
  client_id?: string;        // opcional, vínculo com clients
}

// Calendar event types
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  type: 'optimization' | 'meeting' | 'deadline' | 'review';
  clientId?: string;
  optimizationId?: string;
  attendees?: string[];
}

// Team member types
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Gestor' | 'Leitor';
  avatar?: string;
  joinedAt: string;
  lastActive: string;
  status: 'active' | 'pending' | 'inactive';
}

// KPI types
export interface KPI {
  key: string;
  label: string;
  value: number;
  previousValue?: number;
  change?: number;
  changePercent?: number;
  format: 'currency' | 'int' | 'percent' | 'decimal';
  trend: 'up' | 'down' | 'neutral';
  color: 'positive' | 'negative' | 'neutral';
}

// Filter types
export interface ClientFilters {
  period: number;
  platform: 'all' | 'google_ads' | 'meta_ads';
  granularity: 'day' | 'week' | 'month';
  dateRange?: {
    from: string;
    to: string;
  };
}