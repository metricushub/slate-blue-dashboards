import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Calendar, 
  Users, 
  Target,
  DollarSign,
  Eye,
  Download,
  Share2,
  Plus,
  GripVertical
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ReportBuilderProps {
  clientId?: string;
}

interface ReportComponent {
  id: string;
  type: 'kpi' | 'chart' | 'table' | 'text' | 'image';
  title: string;
  config: any;
  enabled: boolean;
}

const availableComponents = [
  { type: 'kpi', title: 'KPIs Principais', icon: Target, description: 'Métricas principais como spend, leads, CPL, ROAS' },
  { type: 'chart', title: 'Gráfico de Tendência', icon: TrendingUp, description: 'Evolução das métricas ao longo do tempo' },
  { type: 'chart', title: 'Gráfico de Pizza', icon: PieChart, description: 'Distribuição por plataforma ou campanha' },
  { type: 'table', title: 'Tabela de Campanhas', icon: BarChart3, description: 'Performance detalhada por campanha' },
  { type: 'text', title: 'Insights e Recomendações', icon: FileText, description: 'Análises textuais e sugestões' },
];

const reportTemplates = [
  {
    id: 'executive',
    name: 'Relatório Executivo',
    description: 'Visão geral com KPIs principais e insights',
    components: ['kpi', 'chart-trend', 'insights']
  },
  {
    id: 'detailed',
    name: 'Relatório Detalhado',
    description: 'Análise completa com todas as métricas',
    components: ['kpi', 'chart-trend', 'chart-pie', 'table', 'insights']
  },
  {
    id: 'roi',
    name: 'Relatório de ROI',
    description: 'Foco em retorno sobre investimento',
    components: ['kpi-roi', 'chart-revenue', 'table-roi']
  },
  {
    id: 'comparison',
    name: 'Relatório Comparativo',
    description: 'Comparação entre períodos ou plataformas',
    components: ['kpi-comparison', 'chart-comparison', 'table-comparison']
  }
];

function SortableComponent({ component, onToggle }: { component: ReportComponent; onToggle: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'kpi': return Target;
      case 'chart': return TrendingUp;
      case 'table': return BarChart3;
      case 'text': return FileText;
      default: return FileText;
    }
  };

  const Icon = getIcon(component.type);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        checked={component.enabled}
        onCheckedChange={() => onToggle(component.id)}
      />
      
      <Icon className="h-4 w-4 text-chart-primary" />
      
      <div className="flex-1">
        <p className="font-medium text-foreground">{component.title}</p>
        <p className="text-sm text-muted-foreground">Componente {component.type}</p>
      </div>
      
      <Badge variant="outline">{component.type.toUpperCase()}</Badge>
    </div>
  );
}

export function ReportBuilder({ clientId }: ReportBuilderProps) {
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [components, setComponents] = useState<ReportComponent[]>([
    { id: '1', type: 'kpi', title: 'KPIs Principais', config: {}, enabled: true },
    { id: '2', type: 'chart', title: 'Tendência Temporal', config: {}, enabled: true },
    { id: '3', type: 'table', title: 'Performance por Campanha', config: {}, enabled: false },
    { id: '4', type: 'text', title: 'Insights e Análises', config: {}, enabled: true },
  ]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleComponent = (id: string) => {
    setComponents(prev => prev.map(comp => 
      comp.id === id ? { ...comp, enabled: !comp.enabled } : comp
    ));
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = reportTemplates.find(t => t.id === templateId);
    if (template) {
      setReportName(template.name);
      setReportDescription(template.description);
    }
  };

  const enabledComponents = components.filter(c => c.enabled);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Configuration Panel */}
      <div className="space-y-6 lg:col-span-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Relatório</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Relatório</Label>
              <Input
                id="name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Ex: Relatório Mensal - Dezembro 2024"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Breve descrição do relatório e seu objetivo"
              />
            </div>
          </CardContent>
        </Card>

        {/* Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates Pré-definidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reportTemplates.map((template) => (
              <div
                key={template.id}
                className={`p-3 border border-border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  selectedTemplate === template.id ? 'bg-primary-light border-primary' : ''
                }`}
                onClick={() => handleTemplateSelect(template.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {template.components.map((comp, index) => (
                      <div key={index} className="w-2 h-2 bg-chart-primary rounded-full" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Components */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {components.map((component) => (
                    <SortableComponent
                      key={component.id}
                      component={component}
                      onToggle={handleToggleComponent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Available Components */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes Disponíveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableComponents.map((comp, index) => {
              const Icon = comp.icon;
              return (
                <div key={index} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                  <Icon className="h-4 w-4 text-chart-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{comp.title}</p>
                    <p className="text-sm text-muted-foreground">{comp.description}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-3 w-3" />
                    Adicionar
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Preview Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              <div className="space-y-4">
                {enabledComponents.map((component, index) => (
                  <div key={component.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {component.type === 'kpi' && <Target className="h-4 w-4 text-chart-primary" />}
                      {component.type === 'chart' && <TrendingUp className="h-4 w-4 text-chart-primary" />}
                      {component.type === 'table' && <BarChart3 className="h-4 w-4 text-chart-primary" />}
                      {component.type === 'text' && <FileText className="h-4 w-4 text-chart-primary" />}
                      <span className="text-sm font-medium">{component.title}</span>
                    </div>
                    <div className="bg-muted rounded p-8 text-center text-muted-foreground">
                      Preview do {component.type.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button className="w-full">
            <Eye className="mr-2 h-4 w-4" />
            Visualizar Completo
          </Button>
          
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Gerar PDF
          </Button>
          
          <Button variant="outline" className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          
          <Separator />
          
          <Button variant="secondary" className="w-full">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar Envio
          </Button>
        </div>
      </div>
    </div>
  );
}