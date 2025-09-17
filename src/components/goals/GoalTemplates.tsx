import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
  ShoppingCart,
  Users,
  Megaphone,
  Code,
  Target,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { Goal, GoalTemplate } from '@/types/goals';
import { format } from 'date-fns';

interface GoalTemplatesProps {
  clientId?: string;
}

const templates: GoalTemplate[] = [
  {
    id: '1',
    name: 'E-commerce Performance',
    description: 'Metas focadas em conversão e receita para lojas online',
    category: 'E-commerce',
    businessType: 'ecommerce',
    goals: [
      {
        name: 'ROAS Mínimo',
        description: 'Manter retorno sobre investimento acima de 4x',
        metric: 'roas',
        operator: 'gte',
        targetValue: 4,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'high',
        enableAlerts: true,
        alertFrequency: 'daily',
        alertThreshold: 80,
        alertRecipients: [],
        category: 'Receita'
      },
      {
        name: 'CPL Máximo',
        description: 'Manter custo por lead abaixo de R$ 30',
        metric: 'cpl',
        operator: 'lte',
        targetValue: 30,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'high',
        enableAlerts: true,
        alertFrequency: 'immediate',
        alertThreshold: 90,
        alertRecipients: [],
        category: 'Eficiência'
      },
      {
        name: 'Meta de Receita Mensal',
        description: 'Gerar no mínimo R$ 50.000 em receita por mês',
        metric: 'revenue',
        operator: 'gte',
        targetValue: 50000,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'critical',
        enableAlerts: true,
        alertFrequency: 'weekly',
        alertThreshold: 75,
        alertRecipients: [],
        category: 'Receita'
      }
    ]
  },
  {
    id: '2',
    name: 'Geração de Leads B2B',
    description: 'Objetivos otimizados para empresas B2B focadas em lead generation',
    category: 'Lead Generation',
    businessType: 'lead_generation',
    goals: [
      {
        name: 'Meta de Leads Qualificados',
        description: 'Gerar 100 leads qualificados por mês',
        metric: 'leads',
        operator: 'gte',
        targetValue: 100,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'high',
        enableAlerts: true,
        alertFrequency: 'daily',
        alertThreshold: 80,
        alertRecipients: [],
        category: 'Aquisição'
      },
      {
        name: 'CPL Controle',
        description: 'Manter custo por lead abaixo de R$ 60',
        metric: 'cpl',
        operator: 'lte',
        targetValue: 60,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'medium',
        enableAlerts: true,
        alertFrequency: 'weekly',
        alertThreshold: 85,
        alertRecipients: [],
        category: 'Eficiência'
      },
      {
        name: 'Taxa de Conversão',
        description: 'Manter taxa de conversão acima de 2.5%',
        metric: 'convRate',
        operator: 'gte',
        targetValue: 2.5,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'medium',
        enableAlerts: true,
        alertFrequency: 'weekly',
        alertThreshold: 80,
        alertRecipients: [],
        category: 'Conversão'
      }
    ]
  },
  {
    id: '3',
    name: 'SaaS Growth',
    description: 'Metas específicas para empresas de software como serviço',
    category: 'SaaS',
    businessType: 'saas',
    goals: [
      {
        name: 'Leads Mensais',
        description: 'Adquirir 200 leads por mês',
        metric: 'leads',
        operator: 'gte',
        targetValue: 200,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'high',
        enableAlerts: true,
        alertFrequency: 'daily',
        alertThreshold: 75,
        alertRecipients: [],
        category: 'Aquisição'
      },
      {
        name: 'CPL Eficiente',
        description: 'Manter CPL abaixo de R$ 40',
        metric: 'cpl',
        operator: 'lte',
        targetValue: 40,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'high',
        enableAlerts: true,
        alertFrequency: 'immediate',
        alertThreshold: 90,
        alertRecipients: [],
        category: 'Eficiência'
      },
      {
        name: 'ROI Sustentável',
        description: 'Manter ROI acima de 300%',
        metric: 'roas',
        operator: 'gte',
        targetValue: 3,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'medium',
        enableAlerts: true,
        alertFrequency: 'weekly',
        alertThreshold: 80,
        alertRecipients: [],
        category: 'Receita'
      }
    ]
  },
  {
    id: '4',
    name: 'Branding & Awareness',
    description: 'Objetivos focados em visibilidade e reconhecimento de marca',
    category: 'Branding',
    businessType: 'branding',
    goals: [
      {
        name: 'Impressões Mensais',
        description: 'Atingir 1 milhão de impressões por mês',
        metric: 'impressions',
        operator: 'gte',
        targetValue: 1000000,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'high',
        enableAlerts: true,
        alertFrequency: 'weekly',
        alertThreshold: 80,
        alertRecipients: [],
        category: 'Crescimento'
      },
      {
        name: 'Alcance Eficiente',
        description: 'Manter CPM abaixo de R$ 15',
        metric: 'cpl', // proxy
        operator: 'lte',
        targetValue: 15,
        period: 'monthly',
        startDate: '',
        status: 'active',
        priority: 'medium',
        enableAlerts: true,
        alertFrequency: 'weekly',
        alertThreshold: 85,
        alertRecipients: [],
        category: 'Eficiência'
      }
    ]
  }
];

const STORAGE_KEY = 'metricus_goals_v1';

function loadClientGoals(clientId: string): Goal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Record<string, Goal[]>;
    return parsed[clientId] || [];
  } catch {
    return [];
  }
}

function saveClientGoals(clientId: string, goals: Goal[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = (raw ? JSON.parse(raw) : {}) as Record<string, Goal[]>;
    parsed[clientId] = goals;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (e) {
    console.error('Erro ao salvar metas:', e);
  }
}

function uid() {
  if ('randomUUID' in crypto) return crypto.randomUUID();
  return 'goal-' + Math.random().toString(36).slice(2) + Date.now();
}

export function GoalTemplates({ clientId }: GoalTemplatesProps) {
  const cid = clientId || 'client-1';
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBusinessType, setFilterBusinessType] = useState<string>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<GoalTemplate | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter(t =>
      (filterCategory === 'all' || t.category === filterCategory) &&
      (filterBusinessType === 'all' || t.businessType === filterBusinessType)
    );
  }, [filterCategory, filterBusinessType]);

  const getBusinessTypeIcon = (type: string) => {
    switch (type) {
      case 'ecommerce': return ShoppingCart;
      case 'lead_generation': return Users;
      case 'branding': return Megaphone;
      case 'saas': return Code;
      default: return Target;
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'ecommerce': return 'E-commerce';
      case 'lead_generation': return 'Lead Generation';
      case 'branding': return 'Branding';
      case 'saas': return 'SaaS';
      default: return type;
    }
  };

  const openPreview = (template: GoalTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  const handleApplyTemplate = (template: GoalTemplate) => {
    const existing = loadClientGoals(cid);
    const today = format(new Date(), 'yyyy-MM-dd');

    const newGoals: Goal[] = template.goals.map(g => ({
      id: uid(),
      clientId: cid,
      name: g.name,
      description: g.description,
      metric: g.metric,
      operator: g.operator,
      targetValue: g.targetValue,
      maxValue: (g as any).maxValue,
      period: g.period,
      startDate: g.startDate || today,
      endDate: (g as any).endDate,
      status: g.status as Goal['status'],
      priority: g.priority as Goal['priority'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'template',
      enableAlerts: g.enableAlerts,
      alertFrequency: g.alertFrequency,
      alertThreshold: g.alertThreshold,
      alertRecipients: g.alertRecipients,
      category: g.category,
      tags: [],
      isTemplate: false,
      currentValue: undefined,
      progress: 0,
      lastCalculatedAt: undefined,
    }));

    const merged = [...existing, ...newGoals];
    saveClientGoals(cid, merged);

    toast({
      title: 'Template aplicado',
      description: `${newGoals.length} metas foram criadas. Abra a aba "Gerenciar" para editar.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Templates de Metas</h2>
          <p className="text-muted-foreground">Use templates pré-configurados baseados no tipo de negócio</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            <SelectItem value="E-commerce">E-commerce</SelectItem>
            <SelectItem value="Lead Generation">Lead Generation</SelectItem>
            <SelectItem value="SaaS">SaaS</SelectItem>
            <SelectItem value="Branding">Branding</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterBusinessType} onValueChange={setFilterBusinessType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de negócio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
            <SelectItem value="lead_generation">Lead Generation</SelectItem>
            <SelectItem value="saas">SaaS</SelectItem>
            <SelectItem value="branding">Branding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {filteredTemplates.map((template) => {
          const BusinessIcon = getBusinessTypeIcon(template.businessType);

          return (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BusinessIcon className="h-6 w-6 text-chart-primary" />
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant="secondary">{getBusinessTypeLabel(template.businessType)}</Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Goals Preview */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Metas Incluídas ({template.goals.length})</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {template.goals.map((goal, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        <Target className="h-3 w-3 text-chart-primary flex-shrink-0" />
                        <span className="font-medium">{goal.name}</span>
                        <Badge variant="outline" className="text-xs">{goal.category}</Badge>
                        <Badge variant={
                          goal.priority === 'critical' ? 'destructive' :
                          goal.priority === 'high' ? 'default' : 'secondary'
                        } className="text-xs">
                          {goal.priority === 'critical' ? 'Crítica' :
                           goal.priority === 'high' ? 'Alta' :
                           goal.priority === 'medium' ? 'Média' : 'Baixa'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Template Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    {template.goals.length} metas • Configuração automática
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openPreview(template)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button size="sm" onClick={() => handleApplyTemplate(template)}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Aplicar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">Ajuste os filtros para encontrar templates adequados ao seu negócio</p>
            <Button onClick={() => { setFilterCategory('all'); setFilterBusinessType('all'); }}>
              Limpar Filtros
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Preview do Template</DialogTitle>
            <DialogDescription>
              Visualize as metas que serão criadas ao aplicar este template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-foreground">{previewTemplate?.name}</p>
              <p className="text-sm text-muted-foreground">{previewTemplate?.description}</p>
            </div>
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {previewTemplate?.goals.map((g, i) => (
                  <div key={i} className="p-3 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{g.name}</span>
                      <Badge variant="outline">{g.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Métrica: {g.metric} • Condição: {g.operator} • Meta: {g.targetValue} • Período: {g.period}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Fechar</Button>
              <Button onClick={() => { if (previewTemplate) { handleApplyTemplate(previewTemplate); setPreviewOpen(false); } }}>Aplicar Template</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}