import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { OnboardingTemplate, onboardingTemplateOperations } from '@/shared/db/onboardingStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ApplyTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  defaultTemplateId?: string;
  clientData?: {
    empresa?: string;
    contato?: string;
    nicho?: string;
  };
  onApplied?: () => void;
}

export function ApplyTemplateModal({ 
  open, 
  onOpenChange, 
  clientId, 
  defaultTemplateId,
  clientData,
  onApplied 
}: ApplyTemplateModalProps) {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [anchorDate, setAnchorDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [usePreCadastroDate, setUsePreCadastroDate] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTemplates();
      
      // Auto-fill variables from client data
      if (clientData) {
        setVariables({
          empresa: clientData.empresa || '',
          contato: clientData.contato || '',
          nicho: clientData.nicho || '',
        });
      }
    }
  }, [open, clientData]);

  useEffect(() => {
    if (defaultTemplateId && templates.length > 0) {
      setSelectedTemplateId(defaultTemplateId);
    }
  }, [defaultTemplateId, templates]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const allTemplates = await onboardingTemplateOperations.getAll();
      setTemplates(allTemplates);
      
      if (allTemplates.length > 0 && !selectedTemplateId) {
        const defaultTemplate = allTemplates.find(t => t.isDefault) || allTemplates[0];
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates",
        variant: "destructive"
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  useEffect(() => {
    if (selectedTemplate) {
      // Auto-select all stages by default
      setSelectedStages(selectedTemplate.stages.map(s => s.stageId));
      
      // Extract variables from template
      const templateVariables = new Set<string>();
      selectedTemplate.stages.forEach(stage => {
        stage.cards.forEach(card => {
          const titleVars = card.title.match(/{{(\w+)}}/g);
          const descVars = card.description?.match(/{{(\w+)}}/g);
          
          [...(titleVars || []), ...(descVars || [])].forEach(variable => {
            const varName = variable.replace(/[{}]/g, '');
            templateVariables.add(varName);
          });
        });
      });

      // Update variables state with detected variables
      setVariables(prev => {
        const newVars = { ...prev };
        templateVariables.forEach(varName => {
          if (!(varName in newVars)) {
            newVars[varName] = '';
          }
        });
        return newVars;
      });
    }
  }, [selectedTemplate]);

  const getPreviewCounts = () => {
    if (!selectedTemplate) return {};
    
    const counts: Record<string, number> = {};
    selectedTemplate.stages.forEach(stage => {
      if (selectedStages.includes(stage.stageId)) {
        counts[stage.stageId] = stage.cards.length;
      }
    });
    
    return counts;
  };

  const getTotalCards = () => {
    const counts = getPreviewCounts();
    return Object.values(counts).reduce((sum, count) => sum + count, 0);
  };

  const handleApply = async () => {
    if (!selectedTemplate || !clientId) return;

    setIsLoading(true);
    
    try {
      const anchor = usePreCadastroDate 
        ? new Date() // Could be actual pre-cadastro date if available
        : new Date(anchorDate);
      
      const result = await onboardingTemplateOperations.applyTemplate(
        selectedTemplateId,
        clientId,
        anchor,
        variables
      );

      toast({
        title: "Template aplicado",
        description: `${result.created} cards criados, ${result.skipped} pulados`
      });

      onOpenChange(false);
      onApplied?.();
      
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: "Erro ao aplicar template",
        description: "Não foi possível aplicar o template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stageNames = {
    'dados-gerais': 'Pré-cadastro',
    'implementacao': 'Formulário & Docs', 
    'financeiro': 'Financeiro',
    'configuracao': 'Acessos & Setup',
    'briefing': 'Briefing & Estratégia',
    'go-live': 'Go-Live'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aplicar Template</DialogTitle>
        </DialogHeader>
        
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando templates...
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            {/* Template Selection */}
            <div className="grid gap-2">
              <Label>Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                      {template.isDefault && <Badge variant="secondary" className="ml-2">Padrão</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTemplate?.description && (
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              )}
            </div>

            {/* Date Anchor */}
            <div className="grid gap-2">
              <Label>Data Âncora</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="use-precadastro" 
                  checked={usePreCadastroDate}
                  onCheckedChange={(checked) => setUsePreCadastroDate(checked === true)}
                />
                <Label htmlFor="use-precadastro" className="text-sm">
                  Usar data do pré-cadastro
                </Label>
              </div>
              {!usePreCadastroDate && (
                <Input
                  type="date"
                  value={anchorDate}
                  onChange={(e) => setAnchorDate(e.target.value)}
                />
              )}
            </div>

            {/* Variables */}
            {Object.keys(variables).length > 0 && (
              <div className="grid gap-2">
                <Label>Variáveis Detectadas</Label>
                <div className="grid gap-2">
                  {Object.entries(variables).map(([key, value]) => (
                    <div key={key} className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-sm">{`{{${key}}}`}</Label>
                      <Input
                        value={value}
                        onChange={(e) => setVariables(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={`Valor para ${key}`}
                        className="col-span-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage Selection */}
            {selectedTemplate && (
              <div className="grid gap-2">
                <Label>Etapas a Incluir</Label>
                <div className="grid gap-2">
                  {selectedTemplate.stages.map(stage => (
                    <div key={stage.stageId} className="flex items-center space-x-2">
                      <Checkbox
                        id={stage.stageId}
                        checked={selectedStages.includes(stage.stageId)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStages(prev => [...prev, stage.stageId]);
                          } else {
                            setSelectedStages(prev => prev.filter(id => id !== stage.stageId));
                          }
                        }}
                      />
                      <Label htmlFor={stage.stageId} className="text-sm flex-1">
                        {stageNames[stage.stageId] || stage.stageId}
                      </Label>
                      <Badge variant="outline">
                        {stage.cards.length} card{stage.cards.length > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview */}
            {selectedTemplate && getTotalCards() > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Pré-visualização</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Serão criados <strong>{getTotalCards()} cards</strong> nas etapas selecionadas.
                    Cards duplicados na mesma coluna serão pulados.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isLoading || !selectedTemplate || !clientId || getTotalCards() === 0}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Cards ({getTotalCards()})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}