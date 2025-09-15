import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingTemplate, onboardingTemplateOperations } from '@/shared/db/onboardingStore';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Edit, 
  Trash2, 
  Copy, 
  Crown,
  FileText,
  Calendar
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

interface ManageTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditTemplate?: (template: OnboardingTemplate) => void;
}

export function ManageTemplatesModal({ 
  open, 
  onOpenChange,
  onEditTemplate 
}: ManageTemplatesModalProps) {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await onboardingTemplateOperations.getAll();
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

  const handleDelete = async (templateId: string) => {
    try {
      await onboardingTemplateOperations.delete(templateId);
      toast({
        title: "Template excluído",
        description: "Template foi removido com sucesso"
      });
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o template",
        variant: "destructive"
      });
    }
  };

  const handleDuplicate = async (template: OnboardingTemplate) => {
    try {
      const newTemplate = {
        ...template,
        name: `${template.name} (Cópia)`,
        isDefault: false
      };
      delete (newTemplate as any).id;
      delete (newTemplate as any).created_at;
      delete (newTemplate as any).updated_at;
      
      await onboardingTemplateOperations.create(newTemplate);
      toast({
        title: "Template duplicado",
        description: "Nova cópia do template foi criada"
      });
      loadTemplates();
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
      await onboardingTemplateOperations.setDefault(templateId);
      toast({
        title: "Template padrão definido",
        description: "Este template agora é o padrão"
      });
      loadTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      toast({
        title: "Erro ao definir padrão",
        description: "Não foi possível definir como padrão",
        variant: "destructive"
      });
    }
  };

  const handleRename = async (templateId: string, newName: string) => {
    if (!newName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o template",
        variant: "destructive"
      });
      return;
    }

    try {
      await onboardingTemplateOperations.update(templateId, { name: newName.trim() });
      toast({
        title: "Template renomeado",
        description: "Nome do template foi atualizado"
      });
      loadTemplates();
      setEditingNameId(null);
    } catch (error) {
      console.error('Error renaming template:', error);
      toast({
        title: "Erro ao renomear",
        description: "Não foi possível renomear o template",
        variant: "destructive"
      });
    }
  };

  const getTotalCards = (template: OnboardingTemplate) => {
    return template.stages.reduce((total, stage) => total + stage.cards.length, 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Templates</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground">
              Crie um template salvando o quadro atual de onboarding.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map(template => (
              <Card key={template.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {editingNameId === template.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRename(template.id, editingName);
                              } else if (e.key === 'Escape') {
                                setEditingNameId(null);
                              }
                            }}
                            autoFocus
                            className="text-lg font-semibold"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleRename(template.id, editingName)}
                          >
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingNameId(null)}
                          >
                            Cancelar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold">{template.name}</h3>
                          {template.isDefault && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Crown className="h-3 w-3" />
                              Padrão
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{getTotalCards(template)} cards</span>
                        <span>{template.stages.length} etapas</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(template.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      {!template.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSetDefault(template.id)}
                          title="Definir como padrão"
                        >
                          <Crown className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingNameId(template.id);
                          setEditingName(template.name);
                        }}
                        title="Renomear"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicate(template)}
                        title="Duplicar"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir template?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O template "{template.name}" será 
                              permanentemente removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(template.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {template.stages.map(stage => {
                      const stageNames = {
                        'dados-gerais': 'Pré-cadastro',
                        'implementacao': 'Formulário & Docs',
                        'financeiro': 'Financeiro', 
                        'configuracao': 'Acessos & Setup',
                        'briefing': 'Briefing & Estratégia',
                        'go-live': 'Go-Live'
                      };
                      
                      return (
                        <Badge key={stage.stageId} variant="outline" className="justify-between">
                          <span>{stageNames[stage.stageId] || stage.stageId}</span>
                          <span>{stage.cards.length}</span>
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}