import React, { useState, useEffect } from 'react';
import { supabaseTeamStore, type TeamMember } from '@/shared/db/supabaseTeamStore';
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

// Create a local interface that matches the UI expectations
interface UITeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Gestor' | 'Leitor';
  status: 'Ativo' | 'Arquivado' | 'Pendente';
  clientsCount: number;
  lastActivity: string;
  avatar?: string;
  joinedAt: string;
  notes?: string;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    role: 'Admin',
    status: 'Ativo',
    clientsCount: 12,
    lastActivity: '2025-01-14 09:30',
    joinedAt: '2024-01-15',
    notes: 'Administradora principal do sistema'
  },
  {
    id: '2', 
    name: 'Carlos Santos',
    email: 'carlos.santos@empresa.com',
    role: 'Gestor',
    status: 'Ativo',
    clientsCount: 8,
    lastActivity: '2025-01-14 14:22',
    joinedAt: '2024-03-20',
    notes: 'Gestor de contas premium'
  },
  {
    id: '3',
    name: 'Maria Oliveira', 
    email: 'maria.oliveira@empresa.com',
    role: 'Leitor',
    status: 'Ativo',
    clientsCount: 3,
    lastActivity: '2025-01-13 16:45',
    joinedAt: '2024-06-10'
  },
  {
    id: '4',
    name: 'João Ferreira',
    email: 'joao.ferreira@empresa.com', 
    role: 'Gestor',
    status: 'Arquivado',
    clientsCount: 0,
    lastActivity: '2024-12-20 11:15',
    joinedAt: '2024-02-28',
    notes: 'Arquivado - saiu da empresa'
  }
];

const roleColors = {
  'Admin': 'bg-red-100 text-red-800',
  'Gestor': 'bg-blue-100 text-blue-800',
  'Leitor': 'bg-green-100 text-green-800'
};

const statusColors = {
  'Ativo': 'bg-green-100 text-green-800',
  'Arquivado': 'bg-gray-100 text-gray-800',
  'Convite pendente': 'bg-yellow-100 text-yellow-800'
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
        const mappedData = data.map(member => ({
          ...member,
          clientsCount: member.clients_count,
          lastActivity: member.last_activity,
          role: member.role as 'Admin' | 'Gestor' | 'Leitor',
          status: member.status === 'Pendente' ? 'Pendente' : member.status as 'Ativo' | 'Arquivado' | 'Pendente',
          joinedAt: member.created_at.split('T')[0],
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

  const saveMembers = (updatedMembers: TeamMember[]) => {
    setMembers(updatedMembers);
    localStorage.setItem('teamMembers', JSON.stringify(updatedMembers));
  };

  const handleInviteMember = (memberData: Omit<TeamMember, 'id' | 'status' | 'clientsCount' | 'lastActivity' | 'joinedAt'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'Convite pendente',
      clientsCount: 0,
      lastActivity: 'Nunca',
      joinedAt: new Date().toISOString().split('T')[0]
    };

    const updatedMembers = [...members, newMember];
    saveMembers(updatedMembers);
    
    toast({
      title: "Convite enviado",
      description: `Convite enviado para ${memberData.email} com papel ${memberData.role}`
    });
  };

  const handleEditMember = (memberData: Partial<TeamMember>) => {
    if (!selectedMember) return;

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
  };

  const handleArchiveMember = (member: TeamMember) => {
    const updatedMembers = members.map(m =>
      m.id === member.id 
        ? { ...m, status: member.status === 'Arquivado' ? 'Ativo' : 'Arquivado' as TeamMember['status'] }
        : m
    );
    
    saveMembers(updatedMembers);
    
    const action = member.status === 'Arquivado' ? 'reativado' : 'arquivado';
    toast({
      title: `Membro ${action}`,
      description: `${member.name} foi ${action} com sucesso`
    });
  };

  const handleEditClick = (member: TeamMember) => {
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
                <div className="text-2xl font-bold">{members.filter(m => m.status === 'Convite pendente').length}</div>
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
                <SelectItem value="Convite pendente">Convite pendente</SelectItem>
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