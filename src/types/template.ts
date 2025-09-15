export interface OnboardingTemplateV2 {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  blocks: TemplateBlock[];
  created_at: string;
  updated_at: string;
}

export interface TemplateBlock {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  cards: TemplateCard[];
}

export interface TemplateCard {
  id: string;
  title: string;
  description?: string;
  responsavel?: string;
  prazoOffset?: string; // "+2d", "+1w", "+3w", etc.
  tags?: string[];
  order: number;
}

export interface ApplyTemplateOptions {
  templateId: string;
  anchorDate: string;
  createMissingBlocks: boolean;
  mergeWithExisting: boolean;
  avoidDuplicateCards: boolean;
  resetBeforeApply?: boolean;
  selectedBlockIds?: string[];
  variables?: Record<string, string>;
}

export interface TemplatePreview {
  blocksToCreate: number;
  cardsToCreate: number;
  blockDetails: {
    blockName: string;
    cardCount: number;
    isNew: boolean;
  }[];
}

// Icon options for blocks
export const BLOCK_ICONS = [
  'FileText',
  'CreditCard', 
  'Settings',
  'MessageSquare',
  'Rocket',
  'User',
  'Calendar',
  'CheckSquare',
  'Target',
  'Briefcase'
] as const;

// Color options for blocks
export const BLOCK_COLORS = [
  'bg-blue-50 border-blue-200',
  'bg-yellow-50 border-yellow-200', 
  'bg-orange-50 border-orange-200',
  'bg-purple-50 border-purple-200',
  'bg-indigo-50 border-indigo-200',
  'bg-green-50 border-green-200',
  'bg-red-50 border-red-200',
  'bg-pink-50 border-pink-200',
  'bg-gray-50 border-gray-200'
] as const;

// Default template structure
export const DEFAULT_TEMPLATE_BLOCKS: Omit<TemplateBlock, 'id'>[] = [
  {
    name: 'Pré-cadastro',
    color: 'bg-blue-50 border-blue-200',
    icon: 'FileText',
    order: 1,
    cards: []
  },
  {
    name: 'Formulário & Docs',
    color: 'bg-yellow-50 border-yellow-200',
    icon: 'FileText', 
    order: 2,
    cards: []
  },
  {
    name: 'Financeiro',
    color: 'bg-orange-50 border-orange-200',
    icon: 'CreditCard',
    order: 3,
    cards: []
  },
  {
    name: 'Acessos & Setup',
    color: 'bg-purple-50 border-purple-200',
    icon: 'Settings',
    order: 4,
    cards: []
  },
  {
    name: 'Briefing & Estratégia',
    color: 'bg-indigo-50 border-indigo-200',
    icon: 'MessageSquare',
    order: 5,
    cards: []
  },
  {
    name: 'Go-Live',
    color: 'bg-green-50 border-green-200',
    icon: 'Rocket',
    order: 6,
    cards: []
  }
];