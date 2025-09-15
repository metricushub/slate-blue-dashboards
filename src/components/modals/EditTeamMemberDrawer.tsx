import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TeamMember } from '@/pages/EquipePage';
import { Save, X, Users, Settings } from "lucide-react";

interface EditTeamMemberDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSave: (memberData: Partial<TeamMember>) => void;
}

export function EditTeamMemberDrawer({ 
  open, 
  onOpenChange, 
  member, 
  onSave
}: EditTeamMemberDrawerProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({});

  useEffect(() => {
    if (member && open) {
      setFormData({
        name: member.name || '',
        email: member.email || '',
        role: member.role || 'Leitor',
        notes: member.notes || ''
      });
    }
  }, [member, open]);

  const handleSave = () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      return;
    }

    onSave({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      notes: formData.notes?.trim()
    });
  };

  if (!member) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-96 sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col">
        <SheetHeader>
          <SheetTitle>Editar Membro</SheetTitle>
          <SheetDescription>
            Altere as informações do membro da equipe
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4 flex-1 min-h-0 overflow-y-auto">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
            
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@empresa.com"
              />
            </div>

            {/* Papel */}
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select 
                value={formData.role || 'Leitor'} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as TeamMember['role'] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Leitor">Leitor - Visualização apenas</SelectItem>
                  <SelectItem value="Gestor">Gestor - Gestão de clientes</SelectItem>
                  <SelectItem value="Admin">Admin - Acesso total</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Info */}
            <div className="space-y-2">
              <Label>Status Atual</Label>
              <div className="flex items-center gap-2">
                <Badge className={
                  member.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                  member.status === 'Arquivado' ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {member.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Membro desde {new Date(member.joinedAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o membro..."
                rows={3}
              />
            </div>
          </div>

          {/* Clientes Atribuídos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes Atribuídos
                <Badge variant="secondary" className="text-xs">Em construção</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Total de clientes</span>
                </div>
                <Badge variant="outline">{member.clientsCount}</Badge>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Gestão detalhada em desenvolvimento</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Atribuição e remoção individual de clientes será implementada em breve
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Permissões Avançadas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Permissões por Módulo
                <Badge variant="secondary" className="text-xs">Em construção</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Dashboard</span>
                  <Badge variant="outline" className="text-xs">Auto</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Leads</span>
                  <Badge variant="outline" className="text-xs">Auto</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Relatórios</span>
                  <Badge variant="outline" className="text-xs">Auto</Badge>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-orange-700">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Controle granular em desenvolvimento</span>
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Permissões específicas por módulo serão configuráveis em breve
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 border-t bg-background mt-auto shrink-0">
          <Button 
            onClick={handleSave}
            className="flex-1"
            disabled={!formData.name?.trim() || !formData.email?.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Alterações
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}