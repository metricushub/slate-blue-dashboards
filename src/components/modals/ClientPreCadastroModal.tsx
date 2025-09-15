import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useDataSource } from "@/hooks/useDataSource";
import { onboardingCardOperations } from "@/shared/db/onboardingStore";

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

    if (!dataSource) {
      toast({
        title: "Erro",
        description: "Sistema não inicializado.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Criar cliente
      const newClient = await dataSource.addClient({
        name: formData.nomeEmpresa,
        phone: formData.telefone,
        status: 'onboarding' as any,
        segment: formData.nicho,
        contacts: [{
          id: crypto.randomUUID(),
          name: formData.contatoPrincipal,
          email: formData.email,
          phone: formData.telefone,
          role: 'Principal',
          isPrimary: true
        }]
      });

      // Criar card automático "Formulário enviado"
      try {
        await onboardingCardOperations.create({
          title: "Formulário enviado",
          clientId: (newClient as any)?.id || 'temp',
          responsavel: '',
          vencimento: '',
          checklist: [],
          notas: "Aguardando preenchimento do formulário",
          stage: 'dados-gerais'
        });
      } catch (cardError) {
        console.error('Erro ao criar card automático:', cardError);
      }

      toast({
        title: "Sucesso",
        description: "Cliente pré-cadastrado com sucesso!"
      });

      onSave(newClient);
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating client:", error);
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