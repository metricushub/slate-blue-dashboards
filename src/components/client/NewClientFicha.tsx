import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Building, 
  User, 
  CreditCard, 
  Key, 
  MessageSquare, 
  FileText,
  Mail,
  Phone,
  Globe,
  MapPin,
  DollarSign,
  Calendar,
  Settings,
  Send
} from "lucide-react";
import { Client } from "@/types";
import { toast } from "@/hooks/use-toast";

interface NewClientFichaProps {
  clientId?: string;
  focusSection?: string | null;
}

interface ClientFichaData {
  // Geral
  nomeEmpresa: string;
  website: string;
  segmento: string;
  descricao: string;
  
  // Empresa
  cnpj: string;
  endereco: string;
  telefone: string;
  emailPrincipal: string;
  contatoPrincipal: string;
  cargoContato: string;
  
  // Financeiro
  orcamentoMensal: string;
  formaPagamento: string;
  diaVencimento: string;
  observacoesFinanceiras: string;
  
  // Acessos
  googleAds: string;
  metaAds: string;
  googleAnalytics: string;
  searchConsole: string;
  gtm: string;
  observacoesAcessos: string;
  
  // Briefing (em construção)
  objetivos: string;
  publicoAlvo: string;
  concorrentes: string;
  observacoesBriefing: string;
}

export function NewClientFicha({ clientId, focusSection }: NewClientFichaProps) {
  const [fichaData, setFichaData] = useState<ClientFichaData>({
    nomeEmpresa: '',
    website: '',
    segmento: '',
    descricao: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    emailPrincipal: '',
    contatoPrincipal: '',
    cargoContato: '',
    orcamentoMensal: '',
    formaPagamento: '',
    diaVencimento: '',
    observacoesFinanceiras: '',
    googleAds: '',
    metaAds: '',
    googleAnalytics: '',
    searchConsole: '',
    gtm: '',
    observacoesAcessos: '',
    objetivos: '',
    publicoAlvo: '',
    concorrentes: '',
    observacoesBriefing: '',
  });

  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(false);

  // Focus on specific section if provided
  useEffect(() => {
    if (focusSection) {
      setActiveTab(focusSection);
    }
  }, [focusSection]);

  const handleInputChange = (field: keyof ClientFichaData, value: string) => {
    setFichaData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSection = async (section: string) => {
    setLoading(true);
    try {
      // Here you would save to the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Seção salva",
        description: `Dados da seção ${section} salvos com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderGeralTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
          <Input
            id="nomeEmpresa"
            value={fichaData.nomeEmpresa}
            onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
            placeholder="Digite o nome da empresa"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={fichaData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.empresa.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="segmento">Segmento/Nicho</Label>
        <Input
          id="segmento"
          value={fichaData.segmento}
          onChange={(e) => handleInputChange('segmento', e.target.value)}
          placeholder="Ex: E-commerce, Saúde, Educação"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição da Empresa</Label>
        <Textarea
          id="descricao"
          value={fichaData.descricao}
          onChange={(e) => handleInputChange('descricao', e.target.value)}
          placeholder="Descreva o negócio, produtos/serviços..."
          rows={4}
        />
      </div>

      <Button 
        onClick={() => handleSaveSection('Geral')} 
        disabled={loading}
        className="w-full md:w-auto"
      >
        Salvar Dados Gerais
      </Button>
    </div>
  );

  const renderEmpresaTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input
            id="cnpj"
            value={fichaData.cnpj}
            onChange={(e) => handleInputChange('cnpj', e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            value={fichaData.telefone}
            onChange={(e) => handleInputChange('telefone', e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço</Label>
        <Textarea
          id="endereco"
          value={fichaData.endereco}
          onChange={(e) => handleInputChange('endereco', e.target.value)}
          placeholder="Endereço completo da empresa"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contatoPrincipal">Contato Principal</Label>
          <Input
            id="contatoPrincipal"
            value={fichaData.contatoPrincipal}
            onChange={(e) => handleInputChange('contatoPrincipal', e.target.value)}
            placeholder="Nome do contato"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="cargoContato">Cargo do Contato</Label>
          <Input
            id="cargoContato"
            value={fichaData.cargoContato}
            onChange={(e) => handleInputChange('cargoContato', e.target.value)}
            placeholder="CEO, Marketing Manager..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailPrincipal">E-mail Principal</Label>
        <Input
          id="emailPrincipal"
          type="email"
          value={fichaData.emailPrincipal}
          onChange={(e) => handleInputChange('emailPrincipal', e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>

      <Button 
        onClick={() => handleSaveSection('Empresa')} 
        disabled={loading}
        className="w-full md:w-auto"
      >
        Salvar Dados da Empresa
      </Button>
    </div>
  );

  const renderFinanceiroTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="orcamentoMensal">Orçamento Mensal</Label>
          <Input
            id="orcamentoMensal"
            value={fichaData.orcamentoMensal}
            onChange={(e) => handleInputChange('orcamentoMensal', e.target.value)}
            placeholder="R$ 10.000"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
          <Input
            id="formaPagamento"
            value={fichaData.formaPagamento}
            onChange={(e) => handleInputChange('formaPagamento', e.target.value)}
            placeholder="Boleto, PIX, Cartão..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diaVencimento">Dia de Vencimento</Label>
          <Input
            id="diaVencimento"
            value={fichaData.diaVencimento}
            onChange={(e) => handleInputChange('diaVencimento', e.target.value)}
            placeholder="Todo dia 10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoesFinanceiras">Observações Financeiras</Label>
        <Textarea
          id="observacoesFinanceiras"
          value={fichaData.observacoesFinanceiras}
          onChange={(e) => handleInputChange('observacoesFinanceiras', e.target.value)}
          placeholder="Informações adicionais sobre pagamento, faturamento..."
          rows={4}
        />
      </div>

      <Button 
        onClick={() => handleSaveSection('Financeiro')} 
        disabled={loading}
        className="w-full md:w-auto"
      >
        Salvar Dados Financeiros
      </Button>
    </div>
  );

  const renderAcessosTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="googleAds">Google Ads</Label>
          <Input
            id="googleAds"
            value={fichaData.googleAds}
            onChange={(e) => handleInputChange('googleAds', e.target.value)}
            placeholder="ID da conta Google Ads"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="metaAds">Meta Ads</Label>
          <Input
            id="metaAds"
            value={fichaData.metaAds}
            onChange={(e) => handleInputChange('metaAds', e.target.value)}
            placeholder="ID da conta Meta Ads"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="googleAnalytics">Google Analytics</Label>
          <Input
            id="googleAnalytics"
            value={fichaData.googleAnalytics}
            onChange={(e) => handleInputChange('googleAnalytics', e.target.value)}
            placeholder="ID da propriedade GA4"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="searchConsole">Search Console</Label>
          <Input
            id="searchConsole"
            value={fichaData.searchConsole}
            onChange={(e) => handleInputChange('searchConsole', e.target.value)}
            placeholder="URL da propriedade"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="gtm">Google Tag Manager</Label>
        <Input
          id="gtm"
          value={fichaData.gtm}
          onChange={(e) => handleInputChange('gtm', e.target.value)}
          placeholder="ID do container GTM"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoesAcessos">Observações sobre Acessos</Label>
        <Textarea
          id="observacoesAcessos"
          value={fichaData.observacoesAcessos}
          onChange={(e) => handleInputChange('observacoesAcessos', e.target.value)}
          placeholder="Informações sobre permissões, status dos acessos..."
          rows={4}
        />
      </div>

      <Button 
        onClick={() => handleSaveSection('Acessos')} 
        disabled={loading}
        className="w-full md:w-auto"
      >
        Salvar Acessos
      </Button>
    </div>
  );

  const renderBriefingTab = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-5 w-5 text-yellow-600" />
          <h3 className="font-medium text-yellow-800">Em Construção</h3>
        </div>
        <p className="text-sm text-yellow-700">
          Esta seção está sendo desenvolvida. Em breve você poderá gerenciar briefings e estratégia aqui.
        </p>
      </div>

      {/* Preview structure */}
      <div className="grid grid-cols-1 gap-4 opacity-50">
        <div className="space-y-2">
          <Label htmlFor="objetivos">Objetivos do Cliente</Label>
          <Textarea
            id="objetivos"
            value={fichaData.objetivos}
            onChange={(e) => handleInputChange('objetivos', e.target.value)}
            placeholder="Quais são os principais objetivos?"
            rows={3}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicoAlvo">Público-Alvo</Label>
          <Textarea
            id="publicoAlvo"
            value={fichaData.publicoAlvo}
            onChange={(e) => handleInputChange('publicoAlvo', e.target.value)}
            placeholder="Descrição do público-alvo"
            rows={3}
            disabled
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="concorrentes">Principais Concorrentes</Label>
          <Textarea
            id="concorrentes"
            value={fichaData.concorrentes}
            onChange={(e) => handleInputChange('concorrentes', e.target.value)}
            placeholder="Liste os principais concorrentes"
            rows={3}
            disabled
          />
        </div>
      </div>
    </div>
  );

  const renderContratosTab = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <h3 className="font-medium text-blue-800">Gestão de Contratos</h3>
        </div>
        <p className="text-sm text-blue-700 mb-4">
          Gerencie contratos e documentos do cliente nesta seção.
        </p>
        
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Send className="h-4 w-4 mr-2" />
            Enviar Contrato
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Ver Documentos
          </Button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-700">
          Esta funcionalidade está em construção. Em breve você poderá enviar contratos e gerenciar documentos diretamente aqui.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Ficha do Cliente</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="geral" className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="empresa" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="acessos" className="flex items-center gap-1">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Acessos</span>
          </TabsTrigger>
          <TabsTrigger value="briefing" className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Briefing</span>
          </TabsTrigger>
          <TabsTrigger value="contratos" className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contratos</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="geral">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Dados Gerais
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderGeralTab()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderEmpresaTab()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financeiro">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações Financeiras
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderFinanceiroTab()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acessos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Acessos e Configurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderAcessosTab()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="briefing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Briefing e Estratégia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderBriefingTab()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contratos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contratos e Documentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderContratosTab()}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}