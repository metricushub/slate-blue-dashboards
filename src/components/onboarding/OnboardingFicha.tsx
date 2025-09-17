import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, ExternalLink, Download, Users, Building2, Target, Settings, Briefcase } from 'lucide-react';
import { CsvUploader } from './CsvUploader';
import { 
  onboardingFichaOperations, 
  onboardingCardOperations, 
  OnboardingFicha as FichaType 
} from '@/shared/db/onboardingStore';
import { toast } from '@/hooks/use-toast';

interface OnboardingFichaProps {
  clientId?: string;
  focusSection?: string | null;
}

export function OnboardingFicha({ clientId, focusSection }: OnboardingFichaProps) {
  const [ficha, setFicha] = useState<FichaType | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const sectionRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  const stageConfig = [
    { id: 'dados-gerais', title: 'Dados Gerais', icon: Building2, color: 'bg-blue-500' },
    { id: 'financeiro', title: 'Financeiro', icon: Users, color: 'bg-green-500' },
    { id: 'implementacao', title: 'Implementação Cliente', icon: Settings, color: 'bg-purple-500' },
    { id: 'configuracao', title: 'Configuração — Informações Necessárias', icon: Target, color: 'bg-red-500' }
  ];

  useEffect(() => {
    loadData();
  }, [clientId]);

  useEffect(() => {
    if (focusSection && sectionRefs.current[focusSection]) {
      sectionRefs.current[focusSection]?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [focusSection, ficha]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load ficha data
      let fichaData = await onboardingFichaOperations.getByClient(clientId || '');
      if (!fichaData) {
        // Create default ficha if doesn't exist
        fichaData = await onboardingFichaOperations.create({
          clientId: clientId || '',
          'dados-gerais': {},
          financeiro: { '2.1-cadastrar-financeiro': {} },
          implementacao: {},
          configuracao: {},
          attachments: []
        });
      }
      setFicha(fichaData);

      // Load cards for this client
      if (clientId) {
        const clientCards = await onboardingCardOperations.getByClient(clientId);
        setCards(clientCards);
      } else {
        const allCards = await onboardingCardOperations.getAll();
        setCards(allCards);
      }
    } catch (error) {
      console.error('Error loading ficha data:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados da ficha',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFichaSection = async (sectionId: string, data: any) => {
    if (!ficha) return;

    try {
      await onboardingFichaOperations.updateSection(ficha.id, sectionId, data);
      setFicha(prev => prev ? { ...prev, [sectionId]: { ...prev[sectionId], ...data } } : null);
      
      toast({
        title: 'Salvo',
        description: 'Seção atualizada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar seção',
        variant: 'destructive',
      });
    }
  };

  const handleCsvImport = async (mappedData: Record<string, any>) => {
    if (!ficha) return;

    try {
      // Update all sections with imported data
      for (const [sectionId, sectionData] of Object.entries(mappedData)) {
        if (sectionData && Object.keys(sectionData).length > 0) {
          await onboardingFichaOperations.updateSection(ficha.id, sectionId, {
            ...ficha[sectionId],
            ...sectionData
          });
        }
      }

      // Refresh ficha data
      await loadData();
      
      toast({
        title: 'Dados Importados',
        description: 'Dados do CSV foram importados com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao importar dados do CSV',
        variant: 'destructive',
      });
    }
  };

  const getTargetFields = () => {
    return [
      { key: 'dados-gerais.razaoSocial', label: 'Razão Social', section: 'Dados Gerais' },
      { key: 'dados-gerais.cnpj', label: 'CNPJ', section: 'Dados Gerais' },
      { key: 'dados-gerais.contatoComercial', label: 'Contato Comercial', section: 'Dados Gerais' },
      { key: 'dados-gerais.contatoTecnico', label: 'Contato Técnico', section: 'Dados Gerais' },
      { key: 'financeiro.dadosBancarios', label: 'Dados Bancários', section: 'Financeiro' },
      { key: 'financeiro.cicloCobranca', label: 'Ciclo de Cobrança', section: 'Financeiro' },
      { key: 'financeiro.limiteInvestimento', label: 'Limite de Investimento', section: 'Financeiro' },
      { key: 'implementacao.status', label: 'Status da Implementação', section: 'Implementação' },
      { key: 'implementacao.acessos', label: 'Acessos Necessários', section: 'Implementação' },
      { key: 'implementacao.configuracoes', label: 'Configurações Pendentes', section: 'Implementação' },
      { key: 'implementacao.responsavel', label: 'Responsável', section: 'Implementação' },
      { key: 'configuracao.pixels', label: 'Pixel/Tags Instalados', section: 'Configuração' },
      { key: 'configuracao.conversoes', label: 'Conversões Configuradas', section: 'Configuração' },
      { key: 'configuracao.crm', label: 'Integração CRM', section: 'Configuração' },
      { key: 'configuracao.statusConfig', label: 'Status Configuração', section: 'Configuração' },
      { key: 'configuracao.responsavel', label: 'Responsável', section: 'Configuração' },
    ];
  };

  const addAttachment = async () => {
    const url = prompt('Cole o link do anexo (Drive, Docs, Forms, etc.):');
    if (!url || !ficha) return;

    try {
      const attachment = { id: crypto.randomUUID(), url, name: url };
      await onboardingFichaOperations.addAttachment(ficha.id, attachment);
      setFicha(prev => prev ? { 
        ...prev, 
        attachments: [...prev.attachments, attachment] 
      } : null);
      
      toast({
        title: 'Anexo adicionado',
        description: 'Link salvo com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar anexo',
        variant: 'destructive',
      });
    }
  };

  const getCardsForStage = (stageId: string) => {
    return cards.filter(card => card.stage === stageId);
  };

  const renderSectionFields = (stageId: string, data: any = {}) => {
    const commonFields = (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Responsável</Label>
          <Input
            value={data.responsavel || ''}
            onChange={(e) => updateFichaSection(stageId, { responsavel: e.target.value })}
            placeholder="Nome do responsável"
          />
        </div>
        <div className="space-y-2">
          <Label>Prazo</Label>
          <Input
            type="date"
            value={data.prazo || ''}
            onChange={(e) => updateFichaSection(stageId, { prazo: e.target.value })}
          />
        </div>
        <div className="col-span-2 space-y-2">
          <Label>Observações</Label>
          <Textarea
            value={data.observacoes || ''}
            onChange={(e) => updateFichaSection(stageId, { observacoes: e.target.value })}
            placeholder="Observações gerais..."
            rows={3}
          />
        </div>
      </div>
    );

    switch (stageId) {
      case 'dados-gerais':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Razão Social</Label>
                <Input
                  value={data.razaoSocial || ''}
                  onChange={(e) => updateFichaSection(stageId, { razaoSocial: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={data.cnpj || ''}
                  onChange={(e) => updateFichaSection(stageId, { cnpj: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contato Comercial</Label>
                <Input
                  value={data.contatoComercial || ''}
                  onChange={(e) => updateFichaSection(stageId, { contatoComercial: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contato Técnico</Label>
                <Input
                  value={data.contatoTecnico || ''}
                  onChange={(e) => updateFichaSection(stageId, { contatoTecnico: e.target.value })}
                />
              </div>
            </div>
            {commonFields}
          </div>
        );
      
      case 'financeiro':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dados Bancários</Label>
                <Input
                  value={data.dadosBancarios || ''}
                  onChange={(e) => updateFichaSection(stageId, { dadosBancarios: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Ciclo de Cobrança</Label>
                <Select 
                  value={data.cicloCobranca || ''} 
                  onValueChange={(value) => updateFichaSection(stageId, { cicloCobranca: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Limite Investimento</Label>
                <Input
                  value={data.limiteInvestimento || ''}
                  onChange={(e) => updateFichaSection(stageId, { limiteInvestimento: e.target.value })}
                  placeholder="R$ 0,00"
                />
              </div>
            </div>
            {commonFields}
          </div>
        );

      case 'implementacao':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status da Implementação</Label>
                <Select 
                  value={data.status || ''} 
                  onValueChange={(value) => updateFichaSection(stageId, { status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em-andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Acessos Necessários</Label>
                <Textarea
                  value={data.acessos || ''}
                  onChange={(e) => updateFichaSection(stageId, { acessos: e.target.value })}
                  placeholder="Google Ads, Meta, Analytics, etc."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Configurações Pendentes</Label>
                <Textarea
                  value={data.configuracoes || ''}
                  onChange={(e) => updateFichaSection(stageId, { configuracoes: e.target.value })}
                  placeholder="Lista de configurações pendentes"
                  rows={3}
                />
              </div>
            </div>
            {commonFields}
          </div>
        );

      case 'configuracao':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pixel/Tags Instalados</Label>
                <Textarea
                  value={data.pixels || ''}
                  onChange={(e) => updateFichaSection(stageId, { pixels: e.target.value })}
                  placeholder="Facebook Pixel, Google Tag, etc."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Conversões Configuradas</Label>
                <Textarea
                  value={data.conversoes || ''}
                  onChange={(e) => updateFichaSection(stageId, { conversoes: e.target.value })}
                  placeholder="Eventos de conversão configurados"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Integração CRM</Label>
                <Input
                  value={data.crm || ''}
                  onChange={(e) => updateFichaSection(stageId, { crm: e.target.value })}
                  placeholder="Nome do CRM utilizado"
                />
              </div>
              <div className="space-y-2">
                <Label>Status Configuração</Label>
                <Select 
                  value={data.statusConfig || ''} 
                  onValueChange={(value) => updateFichaSection(stageId, { statusConfig: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao-iniciado">Não Iniciado</SelectItem>
                    <SelectItem value="em-andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {commonFields}
          </div>
        );

      default:
        return commonFields;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div>Carregando ficha...</div>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            Ficha de Onboarding {clientId && `- Cliente ${clientId}`}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={addAttachment}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Anexar Link
          </Button>
          <Button variant="outline" disabled>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
            <Badge variant="secondary" className="ml-2 text-xs">Em construção</Badge>
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100%-80px)]">
        <div className="p-4 space-y-6">
          {/* Attachments */}
          {ficha?.attachments && ficha.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Anexos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ficha.attachments.map((attachment) => (
                    <Button
                      key={attachment.id}
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Link
                      </a>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {stageConfig.map((stage) => {
            const stageCards = getCardsForStage(stage.id);
            const sectionData = ficha?.[stage.id] || {};
            
            return (
              <Card 
                key={stage.id}
                ref={(el) => { sectionRefs.current[stage.id] = el; }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <stage.icon className="h-5 w-5" />
                    {stage.title}
                    {stageCards.length > 0 && (
                      <Badge variant="secondary">{stageCards.length} cards</Badge>
                    )}
                  </CardTitle>
                  
                  {/* Associated cards */}
                  {stageCards.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {stageCards.map((card) => (
                        <Badge key={card.id} variant="outline" className="text-xs">
                          {card.title}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardHeader>
                
                 <CardContent>
                   {renderSectionFields(stage.id, sectionData)}
                   
                   {/* Sub-stage for Financeiro */}
                  {stage.id === 'financeiro' && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle className="text-sm">2.1 Cadastrar no Financeiro</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderSectionFields('2.1-cadastrar-financeiro', sectionData['2.1-cadastrar-financeiro'])}
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}