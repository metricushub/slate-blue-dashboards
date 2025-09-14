import { useState } from 'react';
import { useDataSource } from '@/hooks/useDataSource';
import { LeadsStore } from '@/shared/db/leadsStore';
import { dashboardDb } from '@/shared/db/dashboardStore';

export interface SearchResult {
  id: string;
  type: 'client' | 'lead' | 'task' | 'optimization' | 'campaign';
  title: string;
  subtitle: string;
  url: string;
}

export const useGlobalSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const { dataSource } = useDataSource();

  const search = async (query: string): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    setIsSearching(true);
    const results: SearchResult[] = [];

    try {
      const searchTerm = query.toLowerCase();

      // Search clients
      const clients = await dataSource.getClients();
      const clientResults = clients
        .filter(c => 
          c.name.toLowerCase().includes(searchTerm) ||
          c.owner.toLowerCase().includes(searchTerm)
        )
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          type: 'client' as const,
          title: c.name,
          subtitle: `Responsável: ${c.owner}`,
          url: `/cliente/${c.id}/overview`
        }));

      // Search leads
      const leads = await LeadsStore.searchLeads(query);
      const leadResults = leads
        .slice(0, 3)
        .map(l => ({
          id: l.id,
          type: 'lead' as const,
          title: l.name,
          subtitle: `${l.stage} • ${l.email || 'Sem email'}`,
          url: '/leads'
        }));

      // Search tasks
      const tasks = await dashboardDb.tasks.toArray();
      const taskResults = tasks
        .filter(t => 
          t.title.toLowerCase().includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
        )
        .slice(0, 2)
        .map(t => ({
          id: t.id,
          type: 'task' as const,
          title: t.title,
          subtitle: `Tarefa • ${t.status}`,
          url: `/cliente/${t.client_id}/overview`
        }));

      // Search optimizations
      const optimizations = await dashboardDb.optimizations.toArray();
      const optimizationResults = optimizations
        .filter(o => 
          o.title.toLowerCase().includes(searchTerm) ||
          (o.objective && o.objective.toLowerCase().includes(searchTerm))
        )
        .slice(0, 2)
        .map(o => ({
          id: o.id,
          type: 'optimization' as const,
          title: o.title,
          subtitle: `Otimização • ${o.status}`,
          url: '/otimizacoes'
        }));

      // Combine and sort results by relevance
      results.push(...clientResults, ...leadResults, ...taskResults, ...optimizationResults);
      
    } catch (error) {
      console.error('Erro na busca global:', error);
    } finally {
      setIsSearching(false);
    }

    return results.slice(0, 10); // Limit to 10 results
  };

  return { search, isSearching };
};