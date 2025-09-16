import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Client, Lead } from '@/types';
import { ClientsStore } from '@/shared/db/clientsStore';
import { useDataSource } from '@/hooks/useDataSource';
import { toast } from '@/hooks/use-toast';
import { Copy, MessageCircle, Mail, Send, SkipForward } from 'lucide-react';
import { OnboardingService } from '@/lib/onboardingService';
import { FormSendModal } from './FormSendModal';

interface ClientPreCadastroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (client: Client) => Promise<void>;
  leadData?: Lead;
}

interface FormData {
  nomeEmpresa: string;
  nomeContato: string;
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
    nomeEmpresa: leadData?.name || '',
    nomeContato: leadData?.owner || '',
    telefone: leadData?.phone || '',
    email: leadData?.email || '',
    nicho: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Generate Typebot form link with parameters
  const generateFormLink = (): string => {
    const baseUrl = import.meta.env.VITE_TYPEBOT_URL || '';
    if (!baseUrl) return '';

    const params = new URLSearchParams({
      company: formData.nomeEmpresa,
      contact: formData.nomeContato,
      phone: formData.telefone,
      email: formData.email,
      niche: formData.nicho,
      clientId: leadData?.id || crypto.randomUUID()
    });

    return `${baseUrl}?${params.toString()}`;
  };

  // Get default messages from env with fallbacks
  const getWhatsAppMessage = (): string => {
    const defaultMsg = `Olá ${formData.nomeContato}! 🚀 Aqui está o formulário de onboarding da ${formData.nomeEmpresa} para alinharmos tudo e começar do jeito certo:\n\n${generateFormLink()}\n\nQualquer dúvida, estou por aqui. Obrigado!`;
    return import.meta.env.VITE_ONBOARDING_WAPP_MSG?.replace('{contato}', formData.nomeContato).replace('{empresa}', formData.nomeEmpresa).replace('{link}', generateFormLink()) || defaultMsg;
  };

  const getEmailMessage = (): string => {
    const defaultMsg = `Olá ${formData.nomeContato},\n\nAqui está o formulário de onboarding da ${formData.nomeEmpresa} para alinharmos tudo e começar do jeito certo:\n\n${generateFormLink()}\n\nQualquer dúvida, estou à disposição.\n\nObrigado!`;
    return import.meta.env.VITE_ONBOARDING_EMAIL_MSG?.replace('{contato}', formData.nomeContato).replace('{empresa}', formData.nomeEmpresa).replace('{link}', generateFormLink()) || defaultMsg;
  };

  // Action handlers
  const handleCopyLink = async () => {
    const link = generateFormLink();
    if (!link) {
      toast({
        title: "Aviso",
        description: "URL do Typebot não configurada (VITE_TYPEBOT_URL)",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link copiado!",
        description: "O link do formulário foi copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao copiar o link",
        variant: "destructive"
      });
    }
  };

  const handleWhatsAppSend = () => {
    const phone = formData.telefone.replace(/\D/g, '');
    const message = encodeURIComponent(getWhatsAppMessage());
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
  };

  const handleEmailSend = () => {
    const subject = encodeURIComponent('Formulário de Onboarding');
    const body = encodeURIComponent(getEmailMessage());
    const url = `mailto:${formData.email}?subject=${subject}&body=${body}`;
    window.open(url, '_blank');
  };

  const handleSaveAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setLoading(true);
    try {
      const client: Client = {
        id: crypto.randomUUID(),
        name: formData.nomeEmpresa,
        status: 'Ativo',
        stage: 'Setup inicial',
        owner: formData.nomeContato,
        lastUpdate: new Date().toISOString().split('T')[0],
        budgetMonth: 0,
        segment: formData.nicho,
        contacts: [{
          id: crypto.randomUUID(),
          name: formData.nomeContato,
          email: formData.email,
          phone: formData.telefone,
          role: 'Principal',
          isPrimary: true
        }]
      };

      // Não registramos envio aqui; será registrado ao marcar como enviado no próximo passo.

      // Save to local store
      const localClient = { ...client, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      await ClientsStore.upsertClient(localClient);
      
      // Try to save to data source
      try {
        if (dataSource && dataSource.addClient) {
          await dataSource.addClient(client);
        }
      } catch (error) {
        console.warn('Failed to save to data source:', error);
      }

      // Onboarding será criado somente quando marcar como enviado no próximo passo.

      // Close modal and trigger parent to open FormSendModal
      await onSave(client);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving client:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar cliente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Save without form link
    const formDataCopy = { ...formData };
    await handleSaveAndSend(new Event('submit') as any);
  };

  const isValid = formData.nomeEmpresa && formData.email && formData.nomeContato && formData.telefone && formData.nicho;
  const formLink = generateFormLink();
  const hasTypebotUrl = !!import.meta.env.VITE_TYPEBOT_URL;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Pré-cadastro Rápido
              {leadData && (
                <Badge variant="secondary" className="text-xs">
                  {leadData.name}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAndSend} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="nomeEmpresa">Nome da Empresa *</Label>
                <Input
                  id="nomeEmpresa"
                  value={formData.nomeEmpresa}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Empresa XYZ Ltda"
                />
              </div>

              <div>
                <Label htmlFor="nomeContato">Nome do Contato *</Label>
                <Input
                  id="nomeContato"
                  value={formData.nomeContato}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <Label htmlFor="telefone">Telefone (BR) *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: +55 11 99999-9999"
                  pattern="^(\\+?55\\s?)?(\\(?\\d{2}\\)?\\s?)?\\d{4,5}-?\\d{4}$"
                  title="Aceita: +55 11 99999-9999, (11) 99999-9999 ou 11999999999"
                />
              </div>

              <div>
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: contato@empresa.com"
                />
              </div>

              <div>
                <Label htmlFor="nicho">Nicho/Setor *</Label>
                <Input
                  id="nicho"
                  value={formData.nicho}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: E-commerce, Serviços, Indústria"
                />
              </div>
            </div>

            {/* Warning if no Typebot URL */}
            {!hasTypebotUrl && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ VITE_TYPEBOT_URL não configurada. O link do formulário não será gerado, mas você ainda pode salvar o cliente.
                </p>
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSkip}
                disabled={!isValid || loading}
                className="flex items-center gap-1"
              >
                <SkipForward className="h-3 w-3" />
                Pular
              </Button>
              
              <Button 
                type="submit" 
                disabled={!isValid || loading}
                className="flex-1 flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                {loading ? "Salvando..." : "Salvar & Continuar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </>
  );
}