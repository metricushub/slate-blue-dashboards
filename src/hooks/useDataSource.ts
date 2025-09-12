import { useState, useEffect } from 'react';
import { DataSource } from '@/shared/data-source/types';
import { DataSourceFactory } from '@/shared/data-source/factory';

export function useDataSource(): {
  dataSource: DataSource;
  sourceType: string;
  isLoading: boolean;
  refreshCache: () => Promise<void>;
} {
  const [dataSource] = useState<DataSource>(() => DataSourceFactory.create());
  const [isLoading, setIsLoading] = useState(false);

  const refreshCache = async () => {
    setIsLoading(true);
    try {
      if ('refreshCache' in dataSource) {
        await (dataSource as any).refreshCache();
      }
      // Force re-render by triggering state update
      window.location.reload();
    } catch (error) {
      console.error('Erro ao atualizar cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    dataSource,
    sourceType: DataSourceFactory.getCurrentType(),
    isLoading,
    refreshCache,
  };
}