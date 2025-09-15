import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, ChevronLeft, ChevronRight, User, DollarSign, Layers } from 'lucide-react';
import { Client, Lead } from '@/types';
import { toast } from '@/hooks/use-toast';
import { getAllTemplateOptions } from '@/shared/data/onboardingTemplates';

interface ClientCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (client: Client) => void;
  leadData?: Lead; // Pre-fill from lead conversion
}

interface FormData {
  // Identificação
  name: string;
  owner: string;
  contactPrincipal: string;
  
  // Comercial
  platforms: string[];
  monthlyBudget: number;
  contractDuration: string;
  startDate: string;
  
  // Onboarding
  onboardingTemplate: string;
}

const PLATFORMS = [
  { id: 'google', name: 'Google Ads' },
  { id: 'meta', name: 'Meta Ads' },
  { id: 'linkedin', name: 'LinkedIn Ads' },
  { id: 'tiktok', name: 'TikTok Ads' }
];

  const ONBOARDING_TEMPLATES = getAllTemplateOptions();

export function ClientCreationWizard({ open, onOpenChange, onComplete, leadData }: ClientCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: leadData?.name || '',
    owner: leadData?.owner || '',
    contactPrincipal: leadData?.email || '',
    platforms: [],
    monthlyBudget: leadData?.value || 0,
    contractDuration: '',
    startDate: '',
    onboardingTemplate: 'padrao'
  });

  const steps = [
    { number: 1, title: 'Identificação', icon: User },
    { number: 2, title: 'Comercial', icon: DollarSign },
    { number: 3, title: 'Onboarding', icon: Layers }
  ];

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.owner && formData.contactPrincipal;
      case 2:
        return formData.platforms.length > 0 && formData.monthlyBudget > 0 && formData.contractDuration && formData.startDate;
      case 3:
        return formData.onboardingTemplate;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep) && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (!isStepValid(3)) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const client: Client = {
      id: crypto.randomUUID(),
      name: formData.name,
      owner: formData.owner,
      status: 'onboarding',
      stage: 'Setup inicial',
      monthlyBudget: formData.monthlyBudget,
      budgetMonth: formData.monthlyBudget,
      lastUpdate: new Date().toISOString().split('T')[0],
      tags: formData.platforms,
      website: '',
      segment: 'Marketing Digital'
    };

    onComplete(client);
  };

  const togglePlatform = (platformId: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(p => p !== platformId)
        : [...prev.platforms, platformId]
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="h-12 w-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold">Identificação do Cliente</h3>
        <p className="text-muted-foreground">Informações básicas para cadastro</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Cliente *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Empresa XYZ Ltda"
          />
        </div>

        <div>
          <Label htmlFor="owner">Responsável/Owner *</Label>
          <Select value={formData.owner} onValueChange={(value) => setFormData(prev => ({ ...prev, owner: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Alice Santos">Alice Santos</SelectItem>
              <SelectItem value="Bruno Lima">Bruno Lima</SelectItem>
              <SelectItem value="Carla Mendes">Carla Mendes</SelectItem>
              <SelectItem value="Diego Costa">Diego Costa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="contact">Contato Principal *</Label>
          <Input
            id="contact"
            type="email"
            value={formData.contactPrincipal}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPrincipal: e.target.value }))}
            placeholder="contato@empresa.com"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DollarSign className="h-12 w-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold">Informações Comerciais</h3>
        <p className="text-muted-foreground">Detalhes do contrato e investimento</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Plataformas de Anúncios *</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PLATFORMS.map(platform => (
              <Card
                key={platform.id}
                className={`cursor-pointer transition-all ${
                  formData.platforms.includes(platform.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => togglePlatform(platform.id)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{platform.name}</span>
                  {formData.platforms.includes(platform.id) ? (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="budget">Investimento Mensal (R$) *</Label>
          <Input
            id="budget"
            type="number"
            value={formData.monthlyBudget || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, monthlyBudget: parseFloat(e.target.value) || 0 }))}
            placeholder="Ex: 5000"
          />
        </div>

        <div>
          <Label htmlFor="duration">Duração do Contrato *</Label>
          <Select value={formData.contractDuration} onValueChange={(value) => setFormData(prev => ({ ...prev, contractDuration: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a duração" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3-meses">3 meses</SelectItem>
              <SelectItem value="6-meses">6 meses</SelectItem>
              <SelectItem value="12-meses">12 meses</SelectItem>
              <SelectItem value="24-meses">24 meses</SelectItem>
              <SelectItem value="indefinido">Indefinido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startDate">Data de Início *</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Layers className="h-12 w-12 mx-auto mb-3 text-primary" />
        <h3 className="text-lg font-semibold">Template de Onboarding</h3>
        <p className="text-muted-foreground">Escolha o processo de implementação</p>
      </div>

      <div className="space-y-3">
        {ONBOARDING_TEMPLATES.map(template => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all ${
              formData.onboardingTemplate === template.id
                ? 'border-primary bg-primary/5'
                : 'hover:border-primary/50'
            }`}
            onClick={() => setFormData(prev => ({ ...prev, onboardingTemplate: template.id }))}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.id === 'padrao' && <Badge variant="secondary">Recomendado</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                </div>
                {formData.onboardingTemplate === template.id ? (
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Resumo do Cliente:</h4>
        <div className="space-y-1 text-sm">
          <p><strong>Nome:</strong> {formData.name}</p>
          <p><strong>Responsável:</strong> {formData.owner}</p>
          <p><strong>Plataformas:</strong> {formData.platforms.map(p => PLATFORMS.find(pl => pl.id === p)?.name).join(', ')}</p>
          <p><strong>Investimento:</strong> R$ {formData.monthlyBudget.toLocaleString('pt-BR')}/mês</p>
          <p><strong>Duração:</strong> {formData.contractDuration}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {leadData ? 'Converter Lead em Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6 px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                <step.icon className="h-5 w-5" />
              </div>
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="px-6 py-4">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentStep} de {steps.length}
          </div>

          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
            >
              Próximo
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!isStepValid(3)}
              className="bg-success hover:bg-success/90"
            >
              Criar Cliente
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}