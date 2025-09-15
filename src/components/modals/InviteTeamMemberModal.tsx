import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamMember } from '@/pages/EquipePage';

interface InviteTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberData: Omit<TeamMember, 'id' | 'status' | 'clientsCount' | 'lastActivity' | 'joinedAt'>) => void;
}

export function InviteTeamMemberModal({ open, onOpenChange, onSave }: InviteTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Leitor' as TeamMember['role'],
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    setLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      onSave({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        notes: formData.notes.trim()
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: 'Leitor',
        notes: ''
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao convidar membro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Leitor',
      notes: ''
    });
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Membro da Equipe</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="email@empresa.com"
              required
            />
          </div>

          {/* Papel */}
          <div>
            <Label htmlFor="role">Papel</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Leitor">Leitor - Visualização apenas</SelectItem>
                <SelectItem value="Gestor">Gestor - Gestão de clientes</SelectItem>
                <SelectItem value="Admin">Admin - Acesso total</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="notes">Observações</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observações opcionais sobre o membro"
            />
          </div>

          {/* SSO Notice */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <span className="font-medium">📧 Em construção:</span>
              <span>Envio automático de convites por email</span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Por enquanto, o membro será adicionado com status "Convite pendente"
            </p>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim() || !formData.email.trim()}
            >
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}