import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Settings, GripVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  stage: 'dados-gerais' | 'financeiro' | 'implementacao' | 'briefing' | 'configuracao';
  checklist: string[];
  isDefault: boolean;
  created_at: string;
  updated_at: string;
}

interface ChecklistItemProps {
  id: string;
  content: string;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

function ChecklistItem({ id, content, onEdit, onDelete }: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editContent.trim()) {
      onEdit(id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border rounded-lg bg-background"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="flex-1 h-8"
            autoFocus
          />
          <Button size="sm" onClick={handleSave}>
            Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-between">
          <span className="text-sm">{content}</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplateFormProps {
  template?: OnboardingTemplate;
  onSave: (template: Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

function TemplateForm({ template, onSave, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    stage: template?.stage || 'dados-gerais' as const,
    checklist: template?.checklist || [],
    isDefault: template?.isDefault || false
  });
  const [newItem, setNewItem] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const addChecklistItem = () => {
    if (newItem.trim()) {
      setFormData(prev => ({
        ...prev,
        checklist: [...prev.checklist, newItem.trim()]
      }));
      setNewItem('');
    }
  };

  const editChecklistItem = (index: number, content: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.map((item, i) => i === index ? content : item)
    }));
  };

  const deleteChecklistItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== index)
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = parseInt(active.id as string);
      const newIndex = parseInt(over.id as string);
      
      setFormData(prev => ({
        ...prev,
        checklist: arrayMove(prev.checklist, oldIndex, newIndex)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do template é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (formData.checklist.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao checklist",
        variant: "destructive"
      });
      return;
    }

    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Template *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Onboarding Padrão"
          />
        </div>
        
        <div>
          <Label htmlFor="stage">Etapa *</Label>
          <select
            id="stage"
            value={formData.stage}
            onChange={(e) => setFormData(prev => ({ ...prev, stage: e.target.value as any }))}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="dados-gerais">Dados Gerais</option>
            <option value="financeiro">Financeiro</option>
            <option value="implementacao">Implementação</option>
            <option value="briefing">Briefing</option>
            <option value="configuracao">Configuração</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Descreva o objetivo deste template..."
          rows={3}
        />
      </div>

      <div>
        <Label>Checklist Items</Label>
        
        {/* Add new item */}
        <div className="flex gap-2 mb-4">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Adicionar novo item ao checklist..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addChecklistItem();
              }
            }}
          />
          <Button type="button" onClick={addChecklistItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Sortable checklist */}
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={formData.checklist.map((_, index) => index.toString())}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {formData.checklist.map((item, index) => (
                <ChecklistItem
                  key={`${index}-${item}`}
                  id={index.toString()}
                  content={item}
                  onEdit={(_, content) => editChecklistItem(index, content)}
                  onDelete={() => deleteChecklistItem(index)}
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeId !== null && (
              <div className="p-2 border rounded-lg bg-background shadow-lg">
                {formData.checklist[parseInt(activeId)]}
              </div>
            )}
          </DragOverlay>
        </DndContext>

        {formData.checklist.length === 0 && (
          <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
            Nenhum item no checklist. Adicione itens acima.
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
        />
        <Label htmlFor="isDefault">Usar como template padrão</Label>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {template ? 'Atualizar' : 'Criar'} Template
        </Button>
      </div>
    </form>
  );
}

export function OnboardingTemplateManager() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OnboardingTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      // Load from localStorage for now
      const saved = localStorage.getItem('onboarding:templates');
      if (saved) {
        setTemplates(JSON.parse(saved));
      } else {
        // Initialize with default templates
        const defaultTemplates: OnboardingTemplate[] = [
          {
            id: 'default-dados-gerais',
            name: 'Dados Gerais Padrão',
            description: 'Template padrão para coleta de dados gerais do cliente',
            stage: 'dados-gerais',
            checklist: [
              'Coletar razão social e CNPJ',
              'Definir contato comercial principal',
              'Definir contato técnico',
              'Estabelecer responsável interno',
              'Definir prazo para conclusão',
              'Documentar observações importantes'
            ],
            isDefault: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'default-financeiro',
            name: 'Financeiro Padrão',
            description: 'Template padrão para configuração financeira',
            stage: 'financeiro',
            checklist: [
              'Coletar dados bancários',
              'Definir ciclo de cobrança',
              'Estabelecer limite de investimento',
              'Configurar aprovações financeiras',
              'Documentar termos contratuais'
            ],
            isDefault: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setTemplates(defaultTemplates);
        localStorage.setItem('onboarding:templates', JSON.stringify(defaultTemplates));
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData: Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const now = new Date().toISOString();
      let updatedTemplates: OnboardingTemplate[];

      if (editingTemplate) {
        // Update existing
        updatedTemplates = templates.map(t => 
          t.id === editingTemplate.id 
            ? { ...templateData, id: editingTemplate.id, created_at: editingTemplate.created_at, updated_at: now }
            : t
        );
      } else {
        // Create new
        const newTemplate: OnboardingTemplate = {
          ...templateData,
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now
        };
        updatedTemplates = [...templates, newTemplate];
      }

      // If this template is marked as default, unmark others of the same stage
      if (templateData.isDefault) {
        updatedTemplates = updatedTemplates.map(t => 
          t.stage === templateData.stage && t.id !== (editingTemplate?.id || updatedTemplates[updatedTemplates.length - 1].id)
            ? { ...t, isDefault: false }
            : t
        );
      }

      setTemplates(updatedTemplates);
      localStorage.setItem('onboarding:templates', JSON.stringify(updatedTemplates));
      
      setShowForm(false);
      setEditingTemplate(null);
      
      toast({
        title: "Sucesso",
        description: `Template ${editingTemplate ? 'atualizado' : 'criado'} com sucesso!`
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar template",
        variant: "destructive"
      });
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('onboarding:templates', JSON.stringify(updatedTemplates));
      
      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso!"
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir template",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (template: OnboardingTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const stageLabels = {
    'dados-gerais': 'Dados Gerais',
    'financeiro': 'Financeiro',
    'implementacao': 'Implementação',
    'briefing': 'Briefing',
    'configuracao': 'Configuração'
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Templates</h2>
          <p className="text-muted-foreground">
            Crie e edite templates de onboarding personalizados
          </p>
        </div>
        
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </DialogTitle>
                <DialogDescription>
                  Defina nome, etapa e os itens do checklist do template.
                </DialogDescription>
              </DialogHeader>
            <TemplateForm
              template={editingTemplate || undefined}
              onSave={saveTemplate}
              onCancel={handleCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro template de onboarding
          </p>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {stageLabels[template.stage]}
                      </Badge>
                      {template.isDefault && (
                        <Badge>Padrão</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!template.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteTemplate(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {template.description}
                  </p>
                )}
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    Checklist ({template.checklist.length} itens):
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {template.checklist.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs text-muted-foreground">
                        • {item}
                      </div>
                    ))}
                    {template.checklist.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... e mais {template.checklist.length - 3} itens
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}