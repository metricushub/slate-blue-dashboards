import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Lead, Client } from '@/types';
import { Building, User, Phone, Mail, Tag } from 'lucide-react';

interface ClientPreCadastroModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (client: Client) => void;
  leadData: Lead;
}

interface PreCadastroData {
  name: string;
  contactPrincipal: string;
  telefone: string;
  email: string;
  nicho: string;
}

export function ClientPreCadastroModal({ 
  open, 
  onOpenChange, 
  onComplete, 
  leadData 
}: ClientPreCadastroModalProps) {
  const [formData, setFormData] = useState<PreCadastroData>({
    name: leadData.name || '',
    contactPrincipal: '',
    telefone: leadData.phone || '',
    email: leadData.email || '',
    nicho: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    // Create client object
    const client: Client = {
      id: crypto.randomUUID(),
      name: formData.name,
      status: 'onboarding', // Pré-cadastrado status
      stage: 'Setup inicial',
      owner: leadData.owner || '',
      lastUpdate: new Date().toISOString().split('T')[0],
      budgetMonth: 0,
      contacts: [{
        id: crypto.randomUUID(),
        name: formData.contactPrincipal,
        email: formData.email,
        phone: formData.telefone,
        role: 'Principal',
        isPrimary: true
      }],
      segment: formData.nicho,
    };

    onComplete(client);
  };

  const handleInputChange = (field: keyof PreCadastroData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = formData.name.trim() && formData.email.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Pré-cadastro do Cliente
          </DialogTitle>
          <DialogDescription>
            Complete os dados básicos para converter o lead em cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Nome da Empresa *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nome da empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Contato Principal
            </Label>
            <Input
              id="contact"
              value={formData.contactPrincipal}
              onChange={(e) => handleInputChange('contactPrincipal', e.target.value)}
              placeholder="Nome do contato principal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.telefone}
                onChange={(e) => handleInputChange('telefone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail *
              </Label>
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
            <Label htmlFor="nicho" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Nicho/Setor
            </Label>
            <Input
              id="nicho"
              value={formData.nicho}
              onChange={(e) => handleInputChange('nicho', e.target.value)}
              placeholder="Ex: E-commerce, Saúde, Educação..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid}>
              Salvar e Continuar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}