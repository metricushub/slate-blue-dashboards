// Shared team member types for UI consistency

export interface UITeamMember {
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

// For modal forms
export type TeamMemberFormData = Omit<UITeamMember, 'id' | 'status' | 'clientsCount' | 'lastActivity' | 'joinedAt'>;