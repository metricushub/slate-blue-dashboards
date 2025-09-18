import React, { useState, useEffect } from 'react';
import { supabaseTeamStore, type TeamMember } from '@/shared/db/supabaseTeamStore';
import { UITeamMember } from '@/types/team';
import { Search, Plus, MoreHorizontal, Edit, Archive, RotateCcw, Users, Badge as BadgeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { InviteTeamMemberModal } from '@/components/modals/InviteTeamMemberModal';
import { EditTeamMemberDrawer } from '@/components/modals/EditTeamMemberDrawer';
import { toast } from '@/hooks/use-toast';

// Export the UI interface for modal components
export type { UITeamMember as TeamMember };

// Remove mock data - we'll load from Supabase
const roleColors = {
  'Admin': 'bg-red-100 text-red-800',
  'Gestor': 'bg-blue-100 text-blue-800',
  'Leitor': 'bg-green-100 text-green-800'
};

const statusColors = {
  'Ativo': 'bg-green-100 text-green-800',
  'Arquivado': 'bg-gray-100 text-gray-800',
  'Pendente': 'bg-yellow-100 text-yellow-800'
};

export default function EquipePage() {
  const [members, setMembers] = useState<UITeamMember[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<UITeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UITeamMember | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Load data from Supabase
  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await supabaseTeamStore.getTeamMembers();
        const mappedData: UITeamMember[] = data.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role as 'Admin' | 'Gestor' | 'Leitor',
          status: member.status === 'Pendente' ? 'Pendente' : member.status as 'Ativo' | 'Arquivado',
          clientsCount: member.clients_count,
          lastActivity: member.last_activity,
          joinedAt: member.created_at.split('T')[0],
          notes: ''
        }));
        setMembers(mappedData);
        setFilteredMembers(mappedData);
      } catch (error) {
        console.error('Error loading team members:', error);
      }
    };

    loadMembers();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [members, searchQuery, selectedRole, selectedStatus]);

  const applyFilters = () => {
    let filtered = [...members];

    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRole !== 'all') {
      filtered = filtered.filter(member => member.role === selectedRole);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(member => member.status === selectedStatus);
    }

    setFilteredMembers(filtered);
  };

  const saveMembers = (updatedMembers: UITeamMember[]) => {
    setMembers(updatedMembers);
    // Data is automatically saved to Supabase via the store methods
  };

  const handleInviteMember = async (memberData: Omit<UITeamMember, 'id' | 'status' | 'clientsCount' | 'lastActivity' | 'joinedAt'>) => {
    try {
      const newMember = await supabaseTeamStore.addTeamMember({
        name: memberData.name,
        email: memberData.email,
        role: memberData.role,
        status: 'Pendente',
        clients_count: 0,
        last_activity: new Date().toISOString(),
      });
      
      const uiMember: UITeamMember = {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role as 'Admin' | 'Gestor' | 'Leitor',
        status: 'Pendente',
        clientsCount: 0,
        lastActivity: new Date().toISOString(),
        joinedAt: newMember.created_at.split('T')[0],
        notes: memberData.notes || ''
      };
      
      const updatedMembers = [...members, uiMember];
      saveMembers(updatedMembers);
      
      toast({
        title: "Convite enviado",
        description: `Convite enviado para ${memberData.email} com papel ${memberData.role}`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar convite",
        variant: "destructive"
      });
    }
  };

  const handleEditMember = async (memberData: Partial<UITeamMember>) => {
    if (!selectedMember) return;

    try {
      await supabaseTeamStore.updateTeamMember(selectedMember.id, {
        name: memberData.name,
        email: memberData.email,
        role: memberData.role,
        status: memberData.status,
        clients_count: memberData.clientsCount,
        last_activity: memberData.lastActivity,
      });
      
      const updatedMembers = members.map(member =>
        member.id === selectedMember.id 
          ? { ...member, ...memberData }
          : member
      );
      
      saveMembers(updatedMembers);
      setSelectedMember(null);
      setIsEditDrawerOpen(false);
      
      toast({
        title: "Membro atualizado",
        description: "Informações do membro foram atualizadas com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar membro",
        variant: "destructive"
      });
    }
  };

  const handleArchiveMember = async (member: UITeamMember) => {
    try {
      const newStatus: 'Ativo' | 'Arquivado' = member.status === 'Arquivado' ? 'Ativo' : 'Arquivado';
      
      await supabaseTeamStore.updateTeamMember(member.id, {
        status: newStatus,
      });
      
      const updatedMembers = members.map(m =>
        m.id === member.id 
          ? { ...m, status: newStatus }
          : m
      );
      
      saveMembers(updatedMembers);
      
      const action = newStatus === 'Arquivado' ? 'arquivado' : 'reativado';
      toast({
        title: `Membro ${action}`,
        description: `${member.name} foi ${action} com sucesso`
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do membro",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (member: UITeamMember) => {
    setSelectedMember(member);
    setIsEditDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipe</h1>
          <p className="text-muted-foreground">Gerencie membros da equipe e seus acessos</p>
        </div>
        
        <Button onClick={() => setIsInviteModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{members.filter(m => m.status === 'Ativo').length}</div>
                <div className="text-sm text-muted-foreground">Membros Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BadgeIcon className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{members.filter(m => m.role === 'Admin').length}</div>
                <div className="text-sm text-muted-foreground">Admins</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{members.filter(m => m.role === 'Gestor').length}</div>
                <div className="text-sm text-muted-foreground">Gestores</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{members.filter(m => m.status === 'Pendente').length}</div>
                <div className="text-sm text-muted-foreground">Convites Pendentes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Gestor">Gestor</SelectItem>
                <SelectItem value="Leitor">Leitor</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{member.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge className={roleColors[member.role]}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{member.clientsCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[member.status]}>
                        {member.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.lastActivity}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(member)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleArchiveMember(member)}>
                            {member.status === 'Arquivado' ? (
                              <>
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Reativar
                              </>
                            ) : (
                              <>
                                <Archive className="w-4 h-4 mr-2" />
                                Arquivar
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum membro encontrado</h3>
              <p className="text-muted-foreground">
                {searchQuery || selectedRole !== 'all' || selectedStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece convidando seu primeiro membro da equipe'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <InviteTeamMemberModal
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        onSave={handleInviteMember}
      />

      <EditTeamMemberDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        member={selectedMember}
        onSave={handleEditMember}
      />
    </div>
  );
}