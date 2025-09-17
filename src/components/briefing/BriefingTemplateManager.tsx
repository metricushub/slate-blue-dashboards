import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, Copy, Star, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { BriefingTemplate } from '@/types/briefing';
import { briefingTemplateOperations } from '@/shared/db/briefingStore';
import { BriefingFieldEditor } from './BriefingFieldEditor';

export function BriefingTemplateManager() {
  const [templates, setTemplates] = useState<BriefingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<BriefingTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allTemplates = await briefingTemplateOperations.getAll();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleEditTemplate = (template: BriefingTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setIsEditing(true);
  };

  const handleSaveTemplate = async (templateData: Partial<BriefingTemplate>) => {
    try {
      if (isCreating) {
        await briefingTemplateOperations.create(templateData as Omit<BriefingTemplate, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Template criado com sucesso!');
      } else if (selectedTemplate) {
        await briefingTemplateOperations.update(selectedTemplate.id, templateData);
        toast.success('Template atualizado com sucesso!');
      }

      await loadTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const handleDuplicateTemplate = async (template: BriefingTemplate) => {
    try {
      await briefingTemplateOperations.duplicate(template.id);
      await loadTemplates();
      toast.success('Template duplicado com sucesso!');
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      toast.error('Erro ao duplicar template');
    }
  };

  const handleDeleteTemplate = async (template: BriefingTemplate) => {
    try {
      await briefingTemplateOperations.delete(template.id);
      await loadTemplates();
      toast.success('Template excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      toast.error('Erro ao excluir template');
    }
  };

  const handleSetDefault = async (template: BriefingTemplate) => {
    try {
      await briefingTemplateOperations.setDefault(template.id);
      await loadTemplates();
      toast.success('Template definido como padrão!');
    } catch (error) {
      console.error('Erro ao definir template padrão:', error);
      toast.error('Erro ao definir template padrão');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Carregando templates...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Templates de Briefing</h2>
          <p className="text-muted-foreground">
            Configure formulários personalizados para diferentes tipos de briefing
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.isDefault && (
                    <Badge variant="outline" className="text-primary border-primary bg-primary/5">
                      <Star className="h-3 w-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(template)}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Template</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o template "{template.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTemplate(template)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{template.fields.length} campos configurados</span>
                <span>Atualizado em {new Date(template.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Editor Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              {isCreating ? 'Criar Novo Template' : `Editar ${selectedTemplate?.name}`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <BriefingFieldEditor
              template={selectedTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}