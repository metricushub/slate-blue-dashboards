import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  status: 'Ativo' | 'Arquivado' | 'Pendente';
  clients_count: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export const supabaseTeamStore = {
  async getTeamMembers(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as TeamMember[];
  },

  async addTeamMember(member: Omit<TeamMember, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<TeamMember> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('team_members')
      .insert({
        ...member,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as TeamMember;
  },

  async deleteTeamMember(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getTeamStats() {
    const members = await this.getTeamMembers();
    
    return {
      activeMembers: members.filter(m => m.status === 'Ativo').length,
      admins: members.filter(m => m.role === 'Admin').length,
      managers: members.filter(m => m.role === 'Gerente').length,
      pendingInvitations: members.filter(m => m.status === 'Pendente').length,
    };
  },
};