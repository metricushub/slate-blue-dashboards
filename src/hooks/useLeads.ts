import { useState, useEffect } from 'react';
import { Lead } from '@/types';
import { HybridLeadsStore } from '@/shared/db/hybridLeadsStore';
import { toast } from '@/hooks/use-toast';

export interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  createLead: (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<Lead | null>;
  updateLead: (id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>) => Promise<Lead | null>;
  deleteLead: (id: string) => Promise<boolean>;
  searchLeads: (query: string) => Promise<Lead[]>;
  getLeadsByStage: (stage: string) => Promise<Lead[]>;
  getLeadsByFilters: (filters: {
    stages?: string[];
    owner?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => Promise<Lead[]>;
  getLeadsStats: () => Promise<{
    total: number;
    byStage: Record<string, number>;
    totalValue: number;
    valueByStage: Record<string, number>;
  }>;
  refreshLeads: () => Promise<void>;
}

export const useLeads = (): UseLeadsReturn => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const allLeads = await HybridLeadsStore.getAllLeads();
      setLeads(allLeads);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar leads';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createLead = async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead | null> => {
    try {
      const newLead = await HybridLeadsStore.createLead(leadData);
      setLeads(prev => [newLead, ...prev]);
      
      toast({
        title: 'Sucesso',
        description: 'Lead criado com sucesso',
      });
      
      return newLead;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar lead';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateLead = async (id: string, updates: Partial<Omit<Lead, 'id' | 'created_at'>>): Promise<Lead | null> => {
    try {
      const updatedLead = await HybridLeadsStore.updateLead(id, updates);
      if (updatedLead) {
        setLeads(prev => prev.map(lead => lead.id === id ? updatedLead : lead));
        
        toast({
          title: 'Sucesso',
          description: 'Lead atualizado com sucesso',
        });
      }
      return updatedLead;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar lead';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteLead = async (id: string): Promise<boolean> => {
    try {
      await HybridLeadsStore.deleteLead(id);
      setLeads(prev => prev.filter(lead => lead.id !== id));
      
      toast({
        title: 'Sucesso',
        description: 'Lead removido com sucesso',
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao remover lead';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    }
  };

  const searchLeads = async (query: string): Promise<Lead[]> => {
    try {
      return await HybridLeadsStore.searchLeads(query);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na busca';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  };

  const getLeadsByStage = async (stage: string): Promise<Lead[]> => {
    try {
      return await HybridLeadsStore.getLeadsByStage(stage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao filtrar por stage';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  };

  const getLeadsByFilters = async (filters: {
    stages?: string[];
    owner?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<Lead[]> => {
    try {
      return await HybridLeadsStore.getLeadsByFilters(filters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aplicar filtros';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return [];
    }
  };

  const getLeadsStats = async () => {
    try {
      return await HybridLeadsStore.getLeadsStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      return {
        total: 0,
        byStage: {},
        totalValue: 0,
        valueByStage: {},
      };
    }
  };

  const refreshLeads = async () => {
    await loadLeads();
  };

  useEffect(() => {
    loadLeads();
  }, []);

  return {
    leads,
    loading,
    error,
    createLead,
    updateLead,
    deleteLead,
    searchLeads,
    getLeadsByStage,
    getLeadsByFilters,
    getLeadsStats,
    refreshLeads,
  };
};