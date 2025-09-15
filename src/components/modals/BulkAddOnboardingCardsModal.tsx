import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { OnboardingCard, onboardingCardOperations } from "@/shared/db/onboardingStore";
import { Calendar, Plus, Eye, X, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ParsedCard {
  title: string;
  vencimento?: string;
  responsavel?: string;
  stage: string;
}

interface CardWithDate extends ParsedCard {
  index: number;
  individualDate?: Date;
  hasDateError?: boolean;
}

interface BulkAddOnboardingCardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCardsCreated: (cards: OnboardingCard[]) => void;
  clientId?: string;
}

const ONBOARDING_STAGES = [
  { id: 'dados-gerais', label: 'Pré-cadastro' },
  { id: 'implementacao', label: 'Formulário & Docs' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'configuracao', label: 'Acessos & Setup' },
  { id: 'briefing', label: 'Briefing & Estratégia' }
];

export function BulkAddOnboardingCardsModal({ 
  open, 
  onOpenChange, 
  onCardsCreated, 
  clientId 
}: BulkAddOnboardingCardsModalProps) {
  const [inputText, setInputText] = useState('');
  const [parsedCards, setParsedCards] = useState<ParsedCard[]>([]);
  const [defaultStage, setDefaultStage] = useState<string>('dados-gerais');
  const [defaultResponsible, setDefaultResponsible] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date>();
  const [showIndividualDates, setShowIndividualDates] = useState(false);
  const [cardsWithDates, setCardsWithDates] = useState<CardWithDate[]>([]);

  const parseInput = () => {
    const lines = inputText.split('\n').filter(line => line.trim());
    const cards: ParsedCard[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let title = trimmed;
      let vencimento: string | undefined;
      let responsavel: string | undefined;
      let stage = defaultStage;

      // Parse data @DD/MM ou @YYYY-MM-DD
      let dateMatch: RegExpMatchArray | null = null;
      
      dateMatch = title.match(/@(\d{4}-\d{1,2}-\d{1,2})/);
      if (dateMatch) {
        vencimento = dateMatch[1];
        title = title.replace(dateMatch[0], '').trim();
      } else {
        dateMatch = title.match(/@(\d{1,2}\/\d{1,2}(?:\/\d{4})?)/);
        if (dateMatch) {
          const dateStr = dateMatch[1];
          let parsedDate = dateStr;
          
          if (dateStr.split('/').length === 2) {
            const currentYear = new Date().getFullYear();
            parsedDate = `${dateStr}/${currentYear}`;
          }
          
          const [day, month, year] = parsedDate.split('/');
          vencimento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString().split('T')[0];
          title = title.replace(dateMatch[0], '').trim();
        }
      }

      // Parse responsável #nome
      const responsibleMatch = title.match(/#([^#\s]+)/);
      if (responsibleMatch) {
        responsavel = responsibleMatch[1];
        title = title.replace(responsibleMatch[0], '').trim();
      }

      // Parse coluna/etapa |etapa
      const stageMatch = title.match(/\|([^|]+)/);
      if (stageMatch) {
        const stageText = stageMatch[1].trim().toLowerCase();
        const foundStage = ONBOARDING_STAGES.find(s => 
          s.label.toLowerCase().includes(stageText) ||
          s.id.includes(stageText)
        );
        if (foundStage) {
          stage = foundStage.id;
        }
        title = title.replace(stageMatch[0], '').trim();
      }

      if (title) {
        cards.push({
          title,
          vencimento,
          responsavel: responsavel || defaultResponsible || undefined,
          stage
        });
      }
    });

    setParsedCards(cards);
    
    setCardsWithDates(cards.map((card, index) => ({
      ...card,
      index,
      individualDate: card.vencimento ? new Date(card.vencimento) : defaultDate
    })));
  };

  React.useEffect(() => {
    if (inputText.trim()) {
      parseInput();
    } else {
      setParsedCards([]);
      setCardsWithDates([]);
    }
  }, [inputText, defaultStage, defaultResponsible, defaultDate]);

  const toggleIndividualDates = () => {
    setShowIndividualDates(!showIndividualDates);
    if (!showIndividualDates) {
      setCardsWithDates(parsedCards.map((card, index) => ({
        ...card,
        index,
        individualDate: card.vencimento ? new Date(card.vencimento) : defaultDate
      })));
    }
  };

  const updateIndividualDate = (cardIndex: number, date: Date | undefined) => {
    setCardsWithDates(prev => prev.map(card => 
      card.index === cardIndex ? { 
        ...card, 
        individualDate: date,
        hasDateError: false
      } : card
    ));
  };

  const validateDates = () => {
    if (!showIndividualDates) return true;
    
    const hasErrors = cardsWithDates.some(card => {
      if (card.individualDate) {
        return isNaN(card.individualDate.getTime());
      }
      return false;
    });
    
    return !hasErrors;
  };

  const handleCreateCards = async () => {
    if (parsedCards.length === 0 || !validateDates() || !clientId) return;

    setLoading(true);
    try {
      const createdCards: OnboardingCard[] = [];
      
      for (let i = 0; i < parsedCards.length; i++) {
        const parsedCard = parsedCards[i];
        let finalDueDate: string | undefined;

        if (showIndividualDates) {
          const cardWithDate = cardsWithDates.find(c => c.index === i);
          if (cardWithDate?.individualDate) {
            finalDueDate = cardWithDate.individualDate.toISOString().split('T')[0];
          }
        } else {
          if (parsedCard.vencimento) {
            finalDueDate = parsedCard.vencimento;
          } else if (defaultDate) {
            finalDueDate = defaultDate.toISOString().split('T')[0];
          }
        }
        
        const cardData = {
          title: parsedCard.title,
          clientId,
          responsavel: parsedCard.responsavel || defaultResponsible || '',
          vencimento: finalDueDate,
          checklist: [],
          notas: '',
          stage: parsedCard.stage as any
        };
        
        const newCard = await onboardingCardOperations.create(cardData);
        createdCards.push(newCard);
      }

      onCardsCreated(createdCards);
      
      toast({
        title: "Cards criados",
        description: `${createdCards.length} card(s) criado(s) com sucesso`
      });

      // Reset form
      setInputText('');
      setParsedCards([]);
      setCardsWithDates([]);
      setDefaultDate(undefined);
      setShowIndividualDates(false);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar cards",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const removeCard = (index: number) => {
    setParsedCards(prev => prev.filter((_, i) => i !== index));
    const lines = inputText.split('\n');
    const filteredLines = lines.filter((_, i) => i !== index);
    setInputText(filteredLines.join('\n'));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Cards em Lote
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Coluna/Etapa Padrão
              </label>
              <Select value={defaultStage} onValueChange={setDefaultStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar etapa..." />
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

            <div>
              <label className="text-sm font-medium mb-2 block">
                Responsável Padrão (opcional)
              </label>
              <Input
                value={defaultResponsible}
                onChange={(e) => setDefaultResponsible(e.target.value)}
                placeholder="Nome do responsável padrão"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Data Padrão (opcional)
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !defaultDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {defaultDate ? format(defaultDate, "dd/MM/yyyy") : "Selecionar data padrão..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={defaultDate}
                    onSelect={setDefaultDate}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              {defaultDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDefaultDate(undefined)}
                  className="mt-1 h-auto p-1 text-xs text-muted-foreground"
                >
                  Limpar data padrão
                </Button>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Cards (uma por linha)
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleIndividualDates}
                  disabled={parsedCards.length === 0}
                >
                  {showIndividualDates ? 'Ocultar' : 'Definir'} datas por linha
                </Button>
              </div>
              <Textarea
                placeholder={`Digite seus cards, um por linha:

Revisar formulário @25/11 #João |formulario-docs
Configurar acessos (20/12) #Maria
Briefing inicial @2024-12-15 #Pedro |briefing-estrategia
Go-Live #Equipe

Formatos suportados:
@DD/MM, @DD/MM/YYYY, @YYYY-MM-DD, (DD/MM)
#responsavel = responsável
|etapa = coluna/etapa destino`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 min-h-[200px] resize-none font-mono text-sm"
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">
                {showIndividualDates ? 'Datas por Card' : `Preview (${parsedCards.length} card(s))`}
              </span>
            </div>
            
            <div className="flex-1 border rounded-lg p-3 overflow-y-auto">
              {parsedCards.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Digite cards à esquerda</p>
                  <p className="text-xs">Use formatos: @DD/MM, #responsável, |etapa</p>
                </div>
              ) : showIndividualDates ? (
                <div className="space-y-3">
                  {cardsWithDates.map((card) => (
                    <div key={card.index} className="grid grid-cols-2 gap-2 items-center p-2 border rounded">
                      <div className="text-sm font-medium truncate" title={card.title}>
                        {card.title}
                      </div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "justify-start text-left font-normal w-full",
                              !card.individualDate && "text-muted-foreground",
                              card.hasDateError && "border-destructive"
                            )}
                          >
                            <CalendarDays className="mr-1 h-3 w-3" />
                            {card.individualDate ? format(card.individualDate, "dd/MM") : "Sem data"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={card.individualDate}
                            onSelect={(date) => updateIndividualDate(card.index, date)}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {parsedCards.map((card, index) => (
                    <Card key={index} className="p-3 relative">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeCard(index)}
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                      
                      <CardContent className="p-0">
                        <div className="font-medium text-sm mb-2">{card.title}</div>
                        
                        <div className="flex flex-wrap gap-1 text-xs">
                          <Badge variant="secondary">
                            {ONBOARDING_STAGES.find(s => s.id === card.stage)?.label}
                          </Badge>
                          
                          {(card.vencimento || defaultDate) && (
                            <Badge variant="outline" className="gap-1">
                              <Calendar className="h-3 w-3" />
                              {card.vencimento ? 
                                new Date(card.vencimento).toLocaleDateString('pt-BR') : 
                                defaultDate ? format(defaultDate, "dd/MM/yyyy") + " (padrão)" : ''
                              }
                            </Badge>
                          )}
                          
                          {(card.responsavel || defaultResponsible) && (
                            <Badge variant="outline">
                              👤 {card.responsavel || defaultResponsible}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateCards}
            disabled={parsedCards.length === 0 || loading || !validateDates()}
          >
            {loading ? "Criando..." : `Criar ${parsedCards.length} Card(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}