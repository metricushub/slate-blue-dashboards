import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { BlockEditor } from './BlockEditor';
import { onboardingTemplateV2Operations } from '@/shared/db/onboardingStore';
import { OnboardingTemplateV2, DEFAULT_TEMPLATE_BLOCKS } from '@/types/template';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Save, 
  X, 
  Settings,
  Eye,
  FileText,
  Crown,
  Loader2
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId?: string; // If provided, edit existing template
  onSaved?: (template: OnboardingTemplateV2) => void;
}

export function TemplateEditor({ 
  open, 
  onOpenChange, 
  templateId,
  onSaved 
}: TemplateEditorProps) {
  const [templates, setTemplates] = useState<OnboardingTemplateV2[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingTemplateV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'edit'>('list');
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (open) {
      loadTemplates();
      if (templateId) {
        loadTemplate(templateId);
      }
    }
  }, [open, templateId]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await onboardingTemplateV2Operations.getAll();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplate = async (id: string) => {
    try {
      const template = await onboardingTemplateV2Operations.getById(id);
      if (template) {
        setSelectedTemplate(template);
        setActiveView('edit');
      }
    } catch (error) {
      console.error('Error loading template:', error);
    }
  };

  const handleNewTemplate = () => {
    const newTemplate: OnboardingTemplateV2 = {
      id: crypto.randomUUID(),
      name: 'Novo Template',
      description: '',
      isDefault: false,
      blocks: DEFAULT_TEMPLATE_BLOCKS.map((block, index) => ({
        ...block,
        id: crypto.randomUUID(),
        cards: []
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setSelectedTemplate(newTemplate);
    setActiveView('edit');
  };

  const handleSelectTemplate = (template: OnboardingTemplateV2) => {
    setSelectedTemplate(template);
    setActiveView('edit');
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;

    setIsSaving(true);
    try {
      let savedTemplate: OnboardingTemplateV2;
      
      // Check if it's a new template (doesn't exist in templates array)
      const existingTemplate = templates.find(t => t.id === selectedTemplate.id);
      
      if (existingTemplate) {
        // Update existing
        await onboardingTemplateV2Operations.update(selectedTemplate.id, selectedTemplate);
        savedTemplate = selectedTemplate;
      } else {
        // Create new
        savedTemplate = await onboardingTemplateV2Operations.create(selectedTemplate);
      }

      toast({
        title: "Template salvo",
        description: "Template foi salvo com sucesso"
      });

      await loadTemplates();
      onSaved?.(savedTemplate);
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await onboardingTemplateV2Operations.delete(templateId);
      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setActiveView('list');
      }
      await loadTemplates();
      toast({
        title: "Template excluído",
        description: "Template foi removido com sucesso"
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicateTemplate = async (template: OnboardingTemplateV2) => {
    try {
      const duplicated = await onboardingTemplateV2Operations.duplicate(template.id);
      await loadTemplates();
      setSelectedTemplate(duplicated);
      setActiveView('edit');
      toast({
        title: "Template duplicado",
        description: "Template foi duplicado com sucesso"
      });
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar o template",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      await onboardingTemplateV2Operations.setDefault(templateId);
      await loadTemplates();
      toast({
        title: "Template padrão definido",
        description: "Este template será usado por padrão"
      });
    } catch (error) {
      console.error('Error setting default:', error);
      toast({
        title: "Erro ao definir padrão",
        description: "Não foi possível definir como padrão",
        variant: "destructive"
      });
    }
  };

  const handleBlocksReorder = (event: DragEndEvent) => {
    if (!selectedTemplate) return;
    
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedTemplate.blocks.findIndex(block => block.id === active.id);
    const newIndex = selectedTemplate.blocks.findIndex(block => block.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newBlocks = [...selectedTemplate.blocks];
    const [movedBlock] = newBlocks.splice(oldIndex, 1);
    newBlocks.splice(newIndex, 0, movedBlock);

    // Update order
    newBlocks.forEach((block, index) => {
      block.order = index + 1;
    });

    setSelectedTemplate({
      ...selectedTemplate,
      blocks: newBlocks
    });
  };

  const handleAddBlock = () => {
    if (!selectedTemplate) return;

    const newBlock = {
      id: crypto.randomUUID(),
      name: 'Novo Bloco',
      color: 'bg-gray-50 border-gray-200',
      icon: 'CheckSquare',
      order: selectedTemplate.blocks.length + 1,
      cards: []
    };

    setSelectedTemplate({
      ...selectedTemplate,
      blocks: [...selectedTemplate.blocks, newBlock]
    });
  };

  const handleUpdateBlock = (blockId: string, updates: any) => {
    if (!selectedTemplate) return;

    setSelectedTemplate({
      ...selectedTemplate,
      blocks: selectedTemplate.blocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!selectedTemplate) return;

    setSelectedTemplate({
      ...selectedTemplate,
      blocks: selectedTemplate.blocks.filter(block => block.id !== blockId)
    });
  };

  const renderTemplateList = () => (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Templates List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Templates</h3>
          <Button onClick={handleNewTemplate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
        
        <ScrollArea className="h-[500px]">
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))
            ) : (
              templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          {template.isDefault && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-muted-foreground">
                            {template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {template.blocks.length} blocos
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.blocks.reduce((sum, block) => sum + block.cards.length, 0)} cards
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Preview Area */}
      <div className="col-span-2 space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Preview</h3>
        </div>
        
        <div className="h-[500px] bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Selecione um template para visualizar</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTemplateEditor = () => (
    <div className="grid grid-cols-4 gap-6 h-full">
      {/* Block Editor */}
      <div className="col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setActiveView('list')} size="sm">
              ← Voltar
            </Button>
            <h3 className="text-lg font-semibold">Editar Template</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={handleSaveTemplate} 
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        {selectedTemplate && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Blocos do Template</CardTitle>
                <Button 
                  onClick={handleAddBlock}
                  size="sm"
                  variant="outline"
                  className="gap-2 border-dashed"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Bloco
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleBlocksReorder}
                  >
                    <SortableContext 
                      items={selectedTemplate.blocks.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4 pr-4">
                        {selectedTemplate.blocks.map((block) => (
                          <BlockEditor
                            key={block.id}
                            block={block}
                            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                            onDelete={() => handleDeleteBlock(block.id)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Properties Panel */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Propriedades</h3>
        
        {selectedTemplate && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="template-name">Nome do Template</Label>
                <Input
                  id="template-name"
                  value={selectedTemplate.name}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    name: e.target.value
                  })}
                />
              </div>
              
              <div>
                <Label htmlFor="template-description">Descrição</Label>
                <Textarea
                  id="template-description"
                  value={selectedTemplate.description || ''}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    description: e.target.value
                  })}
                  placeholder="Descrição do template..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is-default"
                  checked={selectedTemplate.isDefault || false}
                  onCheckedChange={(checked) => setSelectedTemplate({
                    ...selectedTemplate,
                    isDefault: checked
                  })}
                />
                <Label htmlFor="is-default">Template Padrão</Label>
              </div>

              <div className="pt-4 border-t space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Blocos:</strong> {selectedTemplate.blocks.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Cards:</strong> {selectedTemplate.blocks.reduce((sum, block) => sum + block.cards.length, 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[80vh] p-0">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Gerenciar Templates</h2>
            </div>
            <Button variant="ghost" onClick={() => onOpenChange(false)} size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden">
          {activeView === 'list' ? renderTemplateList() : renderTemplateEditor()}
        </div>
      </DialogContent>
    </Dialog>
  );
}