import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, GripVertical, Settings, Save, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableStageItem } from './SortableStageItem';

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order_index: number;
}

interface FunnelTemplate {
  id: string;
  name: string;
  description: string;
  stages: FunnelStage[];
  is_default: boolean;
}

interface FunnelConfigModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (stages: FunnelStage[]) => void;
  currentStages: FunnelStage[];
}

const defaultColors = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#84cc16'
];

export function FunnelConfigModal({ open, onClose, onSave, currentStages }: FunnelConfigModalProps) {
  const [stages, setStages] = useState<FunnelStage[]>(currentStages);
  const [templates, setTemplates] = useState<FunnelTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveTemplateMode, setSaveTemplateMode] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (open) {
      setStages(currentStages);
      loadTemplates();
    }
  }, [open, currentStages]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('sales_funnel_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates((data || []).map(template => ({
        ...template,
        stages: template.stages as unknown as FunnelStage[]
      })));
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    }
  };

  const addStage = () => {
    const newStage: FunnelStage = {
      id: `stage-${Date.now()}`,
      name: `Nova Etapa ${stages.length + 1}`,
      color: defaultColors[stages.length % defaultColors.length],
      order_index: stages.length
    };
    setStages([...stages, newStage]);
  };

  const removeStage = (id: string) => {
    if (stages.length <= 2) {
      toast.error('É necessário ter pelo menos 2 etapas');
      return;
    }
    setStages(stages.filter(stage => stage.id !== id));
  };

  const updateStage = (id: string, field: keyof FunnelStage, value: any) => {
    setStages(stages.map(stage => 
      stage.id === id ? { ...stage, [field]: value } : stage
    ));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setStages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order_index: index }));
      });
    }
  };

  const applyTemplate = (template: FunnelTemplate) => {
    const templatedStages = template.stages.map((stage, index) => ({
      ...stage,
      id: `stage-${Date.now()}-${index}`,
      order_index: index
    }));
    setStages(templatedStages);
    toast.success(`Template "${template.name}" aplicado`);
  };

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sales_funnel_templates')
        .insert({
          name: templateName,
          description: templateDescription,
          stages: stages.map(({ id, ...stage }) => stage),
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Template salvo com sucesso');
      setSaveTemplateMode(false);
      setTemplateName('');
      setTemplateDescription('');
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (stages.length < 2) {
      toast.error('É necessário ter pelo menos 2 etapas');
      return;
    }

    const orderedStages = stages.map((stage, index) => ({
      ...stage,
      order_index: index
    }));

    onSave(orderedStages);
    onClose();
    toast.success('Configuração do funil salva');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Funil de Vendas</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stages" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stages">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Etapas
            </TabsTrigger>
            <TabsTrigger value="templates">
              <Download className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Etapas do Funil</h3>
                <p className="text-sm text-muted-foreground">
                  Arraste para reordenar as etapas
                </p>
              </div>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setSaveTemplateMode(true)}
                  disabled={stages.length < 2}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Template
                </Button>
                <Button onClick={addStage} disabled={stages.length >= 8}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Etapa
                </Button>
              </div>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {stages.map((stage, index) => (
                    <SortableStageItem
                      key={stage.id}
                      id={stage.id}
                      stage={stage}
                      index={index}
                      onUpdate={updateStage}
                      onRemove={removeStage}
                      canRemove={stages.length > 2}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {saveTemplateMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Salvar como Template</CardTitle>
                  <CardDescription>
                    Salve esta configuração como um template reutilizável
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="templateName">Nome do Template</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Ex: Meu Funil Personalizado"
                    />
                  </div>
                  <div>
                    <Label htmlFor="templateDescription">Descrição (opcional)</Label>
                    <Textarea
                      id="templateDescription"
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Descreva quando usar este template..."
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={saveAsTemplate} disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Template'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSaveTemplateMode(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar Configuração
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Templates Disponíveis</h3>
              <p className="text-sm text-muted-foreground">
                Escolha um template para começar rapidamente
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {template.name}
                          {template.is_default && (
                            <Badge variant="secondary">Padrão</Badge>
                          )}
                        </CardTitle>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {template.stages.map((stage, index) => (
                          <Badge 
                            key={index}
                            variant="outline"
                            style={{ 
                              backgroundColor: stage.color + '20',
                              borderColor: stage.color,
                              color: stage.color
                            }}
                          >
                            {stage.name}
                          </Badge>
                        ))}
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => applyTemplate(template)}
                      >
                        Aplicar Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}