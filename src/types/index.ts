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

// Optimization types (legacy - removed duplicate, using Client Dashboard version below)

// Lead types for CRM
export type LeadStage = "novo" | "qualificacao" | "proposta" | "negociacao" | "fechado" | "perdido" | "Novo" | "Qualificação" | "Proposta" | "Fechado";

export interface Lead {
  id: string;                // uuid
  created_at: string;        // ISO
  updated_at?: string;       // ISO
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;         // novo campo UTM
  value?: number;            // potencial em moeda
  owner?: string;            // responsável
  stage: string;             // coluna do Kanban - agora flexível
  notes?: string;
  client_id?: string;        // opcional, vínculo com clients
  
  // Novos campos do Supabase
  status?: string;           // active, converted, lost
  probability?: number;      // 0-100
  source?: string;           // fonte do lead
  assigned_to?: string;      // UUID do usuário assignado
  last_contact_at?: string;  // último contato
  next_follow_up_at?: string; // próximo follow-up
  lost_reason?: string;      // motivo da perda
  lost_at?: string;         // data da perda
  converted_at?: string;    // data da conversão
  
  // Campos existentes para compatibilidade
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  temperature?: 'cold' | 'warm' | 'hot';
  lastContactDate?: string;
  nextFollowUpDate?: string;
  leadScore?: number; // 0-100
  lossReason?: string;
  lossDate?: string;
  dealCloseDate?: string;
  proposalSentDate?: string;
  firstContactDate?: string;
  qualificationNotes?: string;
  competitorInfo?: string;
  decisionMaker?: string;
  budget?: {
    min: number;
    max: number;
    confirmed: boolean;
  };
  timeline?: {
    decisionDate?: string;
    implementationDate?: string;
    urgency: 'immediate' | 'this_quarter' | 'next_quarter' | 'flexible';
  };
}

// Client Dashboard Types
export type OptimizationStatus = "Planejada" | "Em teste" | "Concluída" | "Abortada";
export type TaskStatus = "Aberta" | "Em progresso" | "Concluída";
export type TaskPriority = "Baixa" | "Média" | "Alta";

export interface Optimization {
  id: string;
  client_id: string;
  title: string;
  type: string;
  objective?: string;
  target_metric?: string;   // ex.: CPL
  hypothesis?: string;
  campaigns?: string[];     // ids
  start_date: string;       // ISO
  review_date?: string;     // ISO
  expected_impact?: string; // texto livre
  status: OptimizationStatus;
  result_summary?: string;  // após revisão
  created_at: string;       // ISO
  updated_at?: string;      // ISO
}

export interface Task {
  id: string; 
  client_id?: string;  // Made optional - tasks can be general or client-specific
  title: string; 
  description?: string;
  due_date?: string; 
  owner?: string;
  priority: TaskPriority; 
  status: TaskStatus;
  completed_at?: string;  // ISO date when task was completed
  archived_at?: string;   // ISO date when task was archived
  created_at: string; 
  updated_at?: string;
}

export interface Note {
  id: string;
  client_id?: string;  // Optional - notes can be general or client-specific
  title: string;
  content: string;
  tags?: string[];     // Array of tag strings
  pinned: boolean;     // For pinning to top
  created_at: string;
  updated_at?: string;
}

export interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
  client_id: string;
  created_at: string;
  updated_at?: string;
}

export interface AlertRule {
  id: string; 
  client_id: string;
  name: string; 
  expression: string; // ex.: "CPL > 100"
  severity: "info"|"warn"|"error"; 
  enabled: boolean;
  created_at: string; 
  updated_at?: string;
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