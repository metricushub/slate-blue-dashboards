import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { OnboardingCard, onboardingCardOperations } from "@/shared/db/onboardingStore";
import { CalendarIcon, Save, X, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface OnboardingCardEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: OnboardingCard | null;
  onSave: (cardId: string, updates: Partial<OnboardingCard>) => Promise<void>;
  onDelete: (cardId: string) => Promise<void>;
  onDuplicate?: (card: OnboardingCard) => Promise<void>;
}

const ONBOARDING_STAGES = [
  { id: 'dados-gerais', label: 'Pré-cadastro' },
  { id: 'implementacao', label: 'Formulário & Docs' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'configuracao', label: 'Acessos & Setup' },
  { id: 'briefing', label: 'Briefing & Estratégia' }
];

export function OnboardingCardEditDrawer({ 
  open, 
  onOpenChange, 
  card, 
  onSave, 
  onDelete, 
  onDuplicate
}: OnboardingCardEditDrawerProps) {
  const [formData, setFormData] = useState<Partial<OnboardingCard>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (card && open) {
      setFormData({
        title: card.title || '',
        notas: card.notas || '',
        vencimento: card.vencimento || '',
        responsavel: card.responsavel || '',
        stage: card.stage || 'dados-gerais',
      });
    }
  }, [card, open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open) {
        if (e.key === 'Escape') {
          onOpenChange(false);
        } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, formData]);

  const handleSave = async () => {
    if (!card || !formData.title?.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await onSave(card.id, formData);
      toast({
        title: "Sucesso",
        description: "Card atualizado com sucesso"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar card:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar card",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!card) return;
    
    setIsDeleting(true);
    try {
      await onDelete(card.id);
      toast({
        title: "Sucesso",
        description: "Card excluído com sucesso"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao excluir card:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir card",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    if (!card || !onDuplicate) return;
    
    try {
      await onDuplicate(card);
      toast({
        title: "Sucesso",
        description: "Card duplicado com sucesso"
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao duplicar card:', error);
      toast({
        title: "Erro",
        description: "Erro ao duplicar card",
        variant: "destructive"
      });
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        vencimento: format(date, 'yyyy-MM-dd')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vencimento: ''
      }));
    }
    setCalendarOpen(false);
  };

  if (!card) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Editar Card</SheetTitle>
          <SheetDescription>
            Faça alterações no card. Pressione ESC para cancelar ou Ctrl+S para salvar.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-4 flex-1 min-h-0 overflow-y-auto">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Digite o título do card"
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas detalhadas do card"
              rows={3}
            />
          </div>

          {/* Etapa/Coluna */}
          <div className="space-y-2">
            <Label>Etapa</Label>
            <Select 
              value={formData.stage || 'dados-gerais'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a etapa" />
              </SelectTrigger>
              <SelectContent>
                {ONBOARDING_STAGES.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <Label htmlFor="responsavel">Responsável</Label>
            <Input
              id="responsavel"
              value={formData.responsavel || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
              placeholder="Nome do responsável"
            />
          </div>

          {/* Data de Vencimento */}
          <div className="space-y-2">
            <Label>Vencimento</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.vencimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.vencimento ? (
                    format(new Date(formData.vencimento), "PPP", { locale: pt })
                  ) : (
                    "Selecionar data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.vencimento ? new Date(formData.vencimento) : undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                />
                {formData.vencimento && (
                  <div className="p-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleDateSelect(undefined)}
                    >
                      Limpar data
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-col gap-2 pt-4 border-t bg-background mt-auto shrink-0">
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={!formData.title?.trim() || loading}
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
          </div>

          <div className="flex gap-2">
            {onDuplicate && (
              <Button 
                variant="outline" 
                onClick={handleDuplicate}
                className="flex-1"
                disabled={loading}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  disabled={isDeleting || loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este card? Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}