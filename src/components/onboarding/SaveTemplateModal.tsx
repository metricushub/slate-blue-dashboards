import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OnboardingCard, onboardingTemplateOperations, OnboardingTemplate } from '@/shared/db/onboardingStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface SaveTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: OnboardingCard[];
  onSaved?: () => void;
}

const ONBOARDING_COLUMNS = [
  'dados-gerais',
  'implementacao', 
  'financeiro',
  'configuracao',
  'briefing',
  'go-live'
] as const;

export function SaveTemplateModal({ open, onOpenChange, cards, onSaved }: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const convertDateToOffset = (dateStr: string | undefined): string | undefined => {
    if (!dateStr) return undefined;
    
    const cardDate = new Date(dateStr);
    const today = new Date();
    const diffTime = cardDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '+0d';
    if (diffDays > 0) return `+${diffDays}d`;
    return `${diffDays}d`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o template",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Group cards by stage
      const stages = ONBOARDING_COLUMNS.map(stageId => {
        const stageCards = cards.filter(card => card.stage === stageId);
        
        return {
          stageId,
          cards: stageCards.map(card => ({
            title: card.title,
            description: card.notas || undefined,
            responsavel: card.responsavel || undefined,
            vencimentoOffset: convertDateToOffset(card.vencimento),
            tags: [] // Could be extended later
          }))
        };
      }).filter(stage => stage.cards.length > 0);

      const template: Omit<OnboardingTemplate, 'id' | 'created_at' | 'updated_at'> = {
        name: name.trim(),
        description: description.trim() || undefined,
        isDefault: false,
        stages
      };

      await onboardingTemplateOperations.create(template);
      
      toast({
        title: "Template salvo",
        description: `Template "${name}" foi salvo com sucesso`
      });

      setName('');
      setDescription('');
      onOpenChange(false);
      onSaved?.();
      
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o template",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Salvar como Template</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome do Template *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Onboarding Padrão E-commerce"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva quando usar este template..."
              rows={3}
            />
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>Resumo do quadro:</strong></p>
            <ul className="list-disc ml-6 mt-1">
              {ONBOARDING_COLUMNS.map(stageId => {
                const count = cards.filter(card => card.stage === stageId).length;
                if (count === 0) return null;
                
                const stageNames = {
                  'dados-gerais': 'Pré-cadastro',
                  'implementacao': 'Formulário & Docs',
                  'financeiro': 'Financeiro',
                  'configuracao': 'Acessos & Setup',
                  'briefing': 'Briefing & Estratégia',
                  'go-live': 'Go-Live'
                };
                
                return (
                  <li key={stageId}>
                    {stageNames[stageId]}: {count} card{count > 1 ? 's' : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}