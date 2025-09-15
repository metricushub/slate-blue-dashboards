import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { onboardingTemplateV2Operations, onboardingCardOperations } from '@/shared/db/onboardingStore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface SaveTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSaved?: () => void;
}

export function SaveTemplateModal({ open, onOpenChange, clientId, onSaved }: SaveTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o template",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      // Get current cards for this client
      const cards = await onboardingCardOperations.getByClient(clientId);
      
      await onboardingTemplateV2Operations.createFromKanban(name.trim(), description.trim() || '', cards);

      toast({
        title: "Template salvo",
        description: "Template criado com sucesso"
      });

      onSaved?.();
      onOpenChange(false);
      setName('');
      setDescription('');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Erro ao salvar template",
        description: "Não foi possível criar o template",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Salvar como Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="template-name">Nome do Template</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Processo de Onboarding Padrão"
            />
          </div>

          <div>
            <Label htmlFor="template-description">Descrição (opcional)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que este template contém..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Template'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}