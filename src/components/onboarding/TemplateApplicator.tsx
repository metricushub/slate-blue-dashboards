import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { onboardingTemplateV2Operations } from '@/shared/db/onboardingStore';
import { OnboardingTemplateV2 } from '@/types/template';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Target, Loader2 } from 'lucide-react';

interface TemplateApplicatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onApplied?: () => void;
}

export function TemplateApplicator({ open, onOpenChange, clientId, onApplied }: TemplateApplicatorProps) {
  const [templates, setTemplates] = useState<OnboardingTemplateV2[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [anchorDate, setAnchorDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [createMissingBlocks, setCreateMissingBlocks] = useState(true);
  const [mergeWithExisting, setMergeWithExisting] = useState(true);
  const [avoidDuplicateCards, setAvoidDuplicateCards] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const allTemplates = await onboardingTemplateV2Operations.getAll();
      setTemplates(allTemplates);
      
      // Auto-select default template
      const defaultTemplate = allTemplates.find(t => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = async () => {
    console.log('Template application started:', { selectedTemplateId, clientId });
    
    if (!selectedTemplateId) {
      toast({
        title: "Selecione um template",
        description: "Escolha um template para aplicar",
        variant: "destructive"
      });
      return;
    }

    if (!clientId) {
      toast({
        title: "Cliente não identificado",
        description: "ID do cliente não foi fornecido",
        variant: "destructive"
      });
      return;
    }

    setIsApplying(true);
    try {
      console.log('Applying template with options:', {
        templateId: selectedTemplateId,
        clientId,
        anchorDate,
        createMissingBlocks,
        mergeWithExisting,
        avoidDuplicateCards
      });

      const result = await onboardingTemplateV2Operations.applyToClient(selectedTemplateId, clientId, {
        anchorDate,
        createMissingBlocks,
        mergeWithExisting,
        avoidDuplicateCards,
        variables: {} // Could be extended later
      });

      console.log('Template application result:', result);

      toast({
        title: "Template aplicado",
        description: `${result.created.length} cards criados, ${result.skipped.length} pulados`
      });

      onApplied?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying template:', error);
      toast({
        title: "Erro ao aplicar template",
        description: error instanceof Error ? error.message : "Não foi possível aplicar o template",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Aplicar Template
          </DialogTitle>
          <DialogDescription>
            Selecione um template e como aplicá-lo. Os cards serão criados nas colunas correspondentes aos blocos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <Label>Template</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex items-center gap-2">
                      <span>{template.name}</span>
                      {template.isDefault && <Badge variant="secondary">Padrão</Badge>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Anchor Date */}
          <div>
            <Label>Data Âncora</Label>
            <Input
              type="date"
              value={anchorDate}
              onChange={(e) => setAnchorDate(e.target.value)}
            />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Label>Opções de Aplicação</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="create-blocks"
                checked={createMissingBlocks}
                onCheckedChange={(checked) => setCreateMissingBlocks(checked === true)}
              />
              <Label htmlFor="create-blocks">Criar blocos que não existirem</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="merge-existing"
                checked={mergeWithExisting}
                onCheckedChange={(checked) => setMergeWithExisting(checked === true)}
              />
              <Label htmlFor="merge-existing">Mesclar com blocos existentes</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="avoid-duplicates"
                checked={avoidDuplicateCards}
                onCheckedChange={(checked) => setAvoidDuplicateCards(checked === true)}
              />
              <Label htmlFor="avoid-duplicates">Evitar duplicar cards</Label>
            </div>
          </div>

          {/* Preview */}
          {selectedTemplate && (
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Preview</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Blocos:</strong> {selectedTemplate.blocks.length}</p>
                  <p><strong>Cards:</strong> {selectedTemplate.blocks.reduce((sum, block) => sum + block.cards.length, 0)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={isApplying || !selectedTemplateId}
          >
            {isApplying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Aplicando...
              </>
            ) : (
              'Aplicar Template'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}