export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'date' 
  | 'select' 
  | 'multi-select'
  | 'checkbox' 
  | 'radio' 
  | 'email' 
  | 'url';

export interface BriefingFieldOption {
  value: string;
  label: string;
}

export interface BriefingField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required: boolean;
  options?: BriefingFieldOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  order: number;
  description?: string;
}

export interface BriefingTemplate {
  id: string;
  name: string;
  description?: string;
  fields: BriefingField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BriefingResponse {
  id: string;
  clientId: string;
  templateId: string;
  responses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BriefingFieldProps {
  field: BriefingField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

// Template padrão para inicialização
export const DEFAULT_BRIEFING_TEMPLATE: Omit<BriefingTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'Template Padrão',
  description: 'Template básico de briefing para novos clientes',
  isDefault: true,
  fields: [
    {
      id: 'objetivos',
      label: 'Quais são os principais objetivos?',
      type: 'textarea',
      placeholder: 'Descreva os objetivos principais do projeto...',
      required: true,
      order: 1
    },
    {
      id: 'publico-alvo',
      label: 'Qual é o público-alvo?',
      type: 'textarea',
      placeholder: 'Descreva o público-alvo...',
      required: true,
      order: 2
    },
    {
      id: 'concorrentes',
      label: 'Principais concorrentes',
      type: 'textarea',
      placeholder: 'Liste os principais concorrentes...',
      required: false,
      order: 3
    },
    {
      id: 'orcamento',
      label: 'Orçamento mensal',
      type: 'number',
      placeholder: '0',
      required: true,
      order: 4
    },
    {
      id: 'plataformas',
      label: 'Plataformas de interesse',
      type: 'multi-select',
      required: true,
      options: [
        { value: 'google-ads', label: 'Google Ads' },
        { value: 'facebook-ads', label: 'Facebook Ads' },
        { value: 'instagram-ads', label: 'Instagram Ads' },
        { value: 'linkedin-ads', label: 'LinkedIn Ads' },
        { value: 'tiktok-ads', label: 'TikTok Ads' },
        { value: 'youtube-ads', label: 'YouTube Ads' }
      ],
      order: 5
    },
    {
      id: 'resultados-esperados',
      label: 'Resultados esperados',
      type: 'textarea',
      placeholder: 'Quais resultados você espera alcançar?',
      required: true,
      order: 6
    }
  ]
};