import { useState, useCallback } from 'react';
import { DataSourceFactory } from '@/shared/data-source/factory';
import { DataSourceType } from '@/shared/data-source/types';
import { toast } from 'sonner';

export function useDataSourceSwitcher() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentType, setCurrentType] = useState<DataSourceType>(() => 
    DataSourceFactory.getCurrentType()
  );

  const switchDataSource = useCallback(async (newType: DataSourceType) => {
    if (newType === currentType) return;

    setIsLoading(true);
    
    try {
      // Clear current instance
      DataSourceFactory.reset();
      
      // Set new type
      DataSourceFactory.setDataSourceType(newType);
      
      // Test new connection
      const newDataSource = DataSourceFactory.create(newType);
      await newDataSource.getClients(); // Test connection
      
      setCurrentType(newType);
      
      toast.success(`Data source alterado para: ${getDataSourceLabel(newType)}`);
      
      // Reload page to refresh all components
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao trocar data source:', error);
      
      // Revert to previous type
      DataSourceFactory.setDataSourceType(currentType);
      
      toast.error(`Erro ao conectar com ${getDataSourceLabel(newType)}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentType]);

  const getDataSourceInfo = useCallback((type: DataSourceType) => {
    switch (type) {
      case 'supabase':
        return {
          label: 'Supabase (Banco Online)',
          description: 'Dados armazenados na nuvem com sincronização em tempo real',
          pros: ['Dados centralizados', 'Acesso de múltiplos usuários', 'APIs robustas'],
          cons: ['Requer conexão à internet'],
          icon: '🗄️',
          status: 'recommended'
        };
      case 'hybrid':
        return {
          label: 'Híbrido (Supabase + Local)',
          description: 'Combina Supabase online com cache local para funcionar offline',
          pros: ['Funciona offline', 'Sincronização automática', 'Melhor experiência'],
          cons: ['Usa mais espaço local'],
          icon: '🔄',
          status: 'best'
        };
      case 'sheets':
        return {
          label: 'Google Sheets',
          description: 'Conecta diretamente com planilhas do Google Sheets',
          pros: ['Familiar para equipes', 'Fácil edição manual'],
          cons: ['Limitações de performance', 'Dependente do Google'],
          icon: '📊',
          status: 'legacy'
        };
      case 'mock':
        return {
          label: 'Dados de Exemplo',
          description: 'Dados simulados para demonstração e testes',
          pros: ['Não requer configuração', 'Dados sempre disponíveis'],
          cons: ['Não persistem alterações', 'Apenas para demonstração'],
          icon: '🎭',
          status: 'demo'
        };
      default:
        return {
          label: 'Desconhecido',
          description: '',
          pros: [],
          cons: [],
          icon: '❓',
          status: 'unknown' as const
        };
    }
  }, []);

  return {
    currentType,
    isLoading,
    switchDataSource,
    getDataSourceInfo,
    availableTypes: ['hybrid', 'supabase', 'sheets', 'mock'] as DataSourceType[]
  };
}

function getDataSourceLabel(type: DataSourceType): string {
  switch (type) {
    case 'supabase':
      return 'Supabase';
    case 'hybrid':
      return 'Híbrido';
    case 'sheets':
      return 'Google Sheets';
    case 'mock':
      return 'Dados de Exemplo';
    default:
      return 'Desconhecido';
  }
}