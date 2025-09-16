import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useDataSource } from "@/hooks/useDataSource";
import { onboardingCardOperations } from "@/shared/db/onboardingStore";
import { Client } from "@/types";

interface ClientPreCadastroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: any) => void;
  leadData: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    owner?: string;
  };
}

interface FormData {
  nomeEmpresa: string;
  contatoPrincipal: string;
  telefone: string;
  email: string;
  nicho: string;
}

export function ClientPreCadastroModal({
  open,
  onOpenChange,
  onSave,
  leadData
}: ClientPreCadastroModalProps) {
  const [loading, setLoading] = useState(false);
  const { dataSource } = useDataSource();
  
  const [formData, setFormData] = useState<FormData>({
    nomeEmpresa: leadData.name || '',
    contatoPrincipal: '',
    telefone: leadData.phone || '',
    email: leadData.email || '',
    nicho: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nomeEmpresa.trim() || !formData.email.trim()) {
      toast({
        title: "Erro",
        description: "Nome da empresa e e-mail são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    let clientId: string | null = null;
    let saved = false;
    
    try {
      // Gerar clientId único uma vez
      clientId = crypto.randomUUID();
      
      const newClient: Client = {
        id: clientId,
        name: formData.nomeEmpresa,
        status: 'onboarding' as any,
        stage: 'Setup inicial',
        owner: leadData.owner || 'Sistema',
        lastUpdate: new Date().toISOString().split('T')[0],
        budgetMonth: 0,
        segment: formData.nicho,
        contacts: [{
          id: crypto.randomUUID(),
          name: formData.contatoPrincipal,
          email: formData.email,
          phone: formData.telefone,
          role: 'Principal',
          isPrimary: true
        }]
      };

      // Salvar localmente primeiro (IndexedDB)
      const { ClientsStore } = await import('@/shared/db/clientsStore');
      const localClient = { ...newClient, createdAt: new Date().toISOString() };
      await ClientsStore.upsertClient(localClient);
      saved = true;

      // Tentar salvar no dataSource também (mock/sheets)
      if (dataSource?.addClient) {
        try {
          await dataSource.addClient(newClient);
        } catch (error) {
          console.warn('Erro ao salvar no dataSource, mas cliente salvo localmente:', error);
        }
      }

      // Criar card automático "Formulário enviado" no onboarding
      try {
        await onboardingCardOperations.create({
          title: "Formulário enviado",
          clientId: clientId,
          responsavel: leadData.owner || 'Sistema',
          vencimento: '',
          checklist: [],
          notas: "Cliente pré-cadastrado via formulário. Aguardando preenchimento completo dos dados.",
          stage: 'dados-gerais',
          position: 1
        });
      } catch (cardError) {
        console.error('Erro ao criar card automático:', cardError);
        // Não falha o fluxo se o card não for criado
      }

      // Salvar diagnóstico
      await ClientsStore.saveDiagnostic('onboardingPreCreate:last', {
        clientId,
        saved,
        redirect: `/cliente/${clientId}/onboarding?first=true`
      });

      toast({
        title: "Sucesso", 
        description: "Cliente pré-cadastrado com sucesso!"
      });

      onSave(newClient);
      onOpenChange(false);
      
      // Redirecionar para onboarding do cliente criado
      window.location.href = `/cliente/${clientId}/onboarding?first=true`;
    } catch (error) {
      console.error("Error creating client:", error);
      
      // Salvar diagnóstico de erro
      if (clientId) {
        const { ClientsStore } = await import('@/shared/db/clientsStore');
        await ClientsStore.saveDiagnostic('onboardingPreCreate:last', {
          clientId,
          saved,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      
      toast({
        title: "Erro",
        description: "Erro ao criar cliente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.nomeEmpresa.trim() && formData.email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pré-cadastro do Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
            <Input
              id="nomeEmpresa"
              value={formData.nomeEmpresa}
              onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
              placeholder="Nome da empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contatoPrincipal">Contato Principal</Label>
            <Input
              id="contatoPrincipal"
              value={formData.contatoPrincipal}
              onChange={(e) => handleInputChange('contatoPrincipal', e.target.value)}
              placeholder="Nome do contato principal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@empresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nicho">Nicho/Setor</Label>
            <Input
              id="nicho"
              value={formData.nicho}
              onChange={(e) => handleInputChange('nicho', e.target.value)}
              placeholder="Ex: E-commerce, Saúde, Educação..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!isValid || loading}
            >
              {loading ? "Salvando..." : "Salvar e Continuar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}