import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Copy, MessageCircle, Mail, Edit, Send } from 'lucide-react';
import { Client } from '@/types';
import { OnboardingService } from '@/lib/onboardingService';

interface FormSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  formLink: string;
  onFormSent?: (client: Client) => void;
}

export function FormSendModal({ 
  open, 
  onOpenChange, 
  client,
  formLink,
  onFormSent
}: FormSendModalProps) {
  console.log('FormSendModal render:', { open, client: !!client, formLink });
  
  const [formLinkValue, setFormLinkValue] = useState(formLink);
  const [editingWhatsApp, setEditingWhatsApp] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  
  // Get contact info from client
  const primaryContact = client.contacts?.find(c => c.isPrimary) || client.contacts?.[0];
  const contactName = primaryContact?.name || client.owner || 'Cliente';
  const contactPhone = primaryContact?.phone || '';
  const contactEmail = primaryContact?.email || '';

  // Default messages
  const defaultWhatsAppMsg = `Olá ${contactName}! 🚀

Aqui está o formulário de onboarding da ${client.name} para alinharmos tudo e começar do jeito certo:

${formLinkValue}

Qualquer dúvida, estou por aqui. Obrigado!`;

  const defaultEmailMsg = `Olá ${contactName},

Aqui está o formulário de onboarding da ${client.name} para alinharmos tudo e começar do jeito certo:

${formLinkValue}

Qualquer dúvida, estou à disposição.

Obrigado!`;

  const [whatsappMessage, setWhatsappMessage] = useState(defaultWhatsAppMsg);
  const [emailMessage, setEmailMessage] = useState(defaultEmailMsg);

  useEffect(() => {
    if (!editingWhatsApp) {
      setWhatsappMessage(`Olá ${contactName}! 🚀\n\nAqui está o formulário de onboarding da ${client.name} para alinharmos tudo e começar do jeito certo:\n\n${formLinkValue}\n\nQualquer dúvida, estou por aqui. Obrigado!`);
    }
    if (!editingEmail) {
      setEmailMessage(`Olá ${contactName},\n\nAqui está o formulário de onboarding da ${client.name} para alinharmos tudo e começar do jeito certo:\n\n${formLinkValue}\n\nQualquer dúvida, estou à disposição.\n\nObrigado!`);
    }
  }, [formLinkValue, editingWhatsApp, editingEmail, contactName, client.name]);
  // Action handlers
  const handleCopyLink = async () => {
    if (!formLinkValue) {
      toast({
        title: "Erro",
        description: "Link do formulário não disponível",
        variant: "destructive"
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(formLinkValue);
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
    if (!contactPhone) {
      toast({
        title: "Erro",
        description: "Número de telefone não disponível",
        variant: "destructive"
      });
      return;
    }

    const phone = contactPhone.replace(/\D/g, '');
    const message = encodeURIComponent(whatsappMessage);
    const url = `https://wa.me/${phone}?text=${message}`;
    window.open(url, '_blank');
    
    toast({
      title: "WhatsApp aberto!",
      description: "A conversa foi aberta no WhatsApp",
    });
  };

  const handleEmailSend = () => {
    if (!contactEmail) {
      toast({
        title: "Erro",
        description: "E-mail não disponível",
        variant: "destructive"
      });
      return;
    }

    const subject = encodeURIComponent('Formulário de Onboarding');
    const body = encodeURIComponent(emailMessage);
    const url = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    window.open(url, '_blank');
    
    toast({
      title: "E-mail aberto!",
      description: "O cliente de e-mail foi aberto",
    });
  };

  const resetWhatsAppMessage = () => {
    setWhatsappMessage(defaultWhatsAppMsg);
    setEditingWhatsApp(false);
  };

  const resetEmailMessage = () => {
    setEmailMessage(defaultEmailMsg);
    setEditingEmail(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Enviar Formulário de Onboarding
            <Badge variant="secondary" className="text-xs">
              {client.name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Link do formulário */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Link do Formulário:</Label>
            <div className="flex gap-2">
              <Input 
                value={formLinkValue}
                onChange={(e) => setFormLinkValue(e.target.value)}
                placeholder="Cole ou edite o link do formulário aqui"
                className="font-mono text-xs"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </div>
          </div>

          {/* Informações do contato */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Dados do Contato:</div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div><strong>Nome:</strong> {contactName}</div>
              {contactPhone && <div><strong>Telefone:</strong> {contactPhone}</div>}
              {contactEmail && <div><strong>E-mail:</strong> {contactEmail}</div>}
            </div>
          </div>

          {/* WhatsApp Section */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-green-600" />
                Mensagem WhatsApp
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingWhatsApp(!editingWhatsApp)}
              >
                <Edit className="h-3 w-3 mr-1" />
                {editingWhatsApp ? 'Salvar' : 'Editar'}
              </Button>
            </div>
            
            {editingWhatsApp ? (
              <div className="space-y-2">
                <Textarea
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                  rows={6}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetWhatsAppMessage}
                  >
                    Restaurar Original
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                {whatsappMessage}
              </div>
            )}
            
            <Button
              onClick={handleWhatsAppSend}
              disabled={!contactPhone}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Enviar via WhatsApp
            </Button>
          </div>

          {/* Email Section */}
          <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                Mensagem E-mail
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingEmail(!editingEmail)}
              >
                <Edit className="h-3 w-3 mr-1" />
                {editingEmail ? 'Salvar' : 'Editar'}
              </Button>
            </div>
            
            {editingEmail ? (
              <div className="space-y-2">
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={8}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetEmailMessage}
                  >
                    Restaurar Original
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted rounded text-sm whitespace-pre-wrap">
                {emailMessage}
              </div>
            )}
            
            <Button
              onClick={handleEmailSend}
              disabled={!contactEmail}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Mail className="h-4 w-4 mr-2" />
              Enviar via E-mail
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Fechar
            </Button>
            
            <Button 
              onClick={async () => {
                try {
                  if (!formLinkValue) {
                    toast({
                      title: "Aviso",
                      description: "Adicione o link do formulário antes de marcar como enviado.",
                      variant: "destructive",
                    });
                    return;
                  }
                  OnboardingService.storeFormMetadata({
                    clientId: client.id,
                    formSentAt: new Date().toISOString(),
                    formLinkLast: formLinkValue,
                  });
                  await OnboardingService.ensureBoardAndFormCard(client.id, client.name, client.owner);
                  toast({
                    title: "Formulário registrado!",
                    description: "O envio do formulário foi registrado. Abrindo onboarding...",
                  });
                  onOpenChange(false);
                  
                  // Notify parent that form was sent
                  if (onFormSent) {
                    onFormSent(client);
                  }
                } catch (error) {
                  toast({
                    title: "Erro",
                    description: "Não foi possível registrar o envio.",
                    variant: "destructive",
                  });
                }
              }}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Marcar como Enviado
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}