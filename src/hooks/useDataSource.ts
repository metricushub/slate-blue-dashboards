import { useState, useEffect } from 'react';
import { DataSource, DataSourceType, SheetsConfig, STORAGE_KEYS } from '@/lib/data-source';
import { MockAdapter } from '@/lib/adapters/mock-adapter';
import { SheetsAdapter } from '@/lib/adapters/sheets-adapter';

export function useDataSource(): {
  dataSource: DataSource;
  sourceType: DataSourceType;
  isLoading: boolean;
  switchToMock: () => void;
  switchToSheets: (config: SheetsConfig) => void;
} {
  const [dataSource, setDataSource] = useState<DataSource>(() => new MockAdapter());
  const [sourceType, setSourceType] = useState<DataSourceType>('mock');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved data source type and configuration
    const savedType = localStorage.getItem(STORAGE_KEYS.DATA_SOURCE_TYPE) as DataSourceType;
    const savedConfig = localStorage.getItem(STORAGE_KEYS.SHEETS_CONFIG);

    if (savedType === 'sheets' && savedConfig) {
      try {
        const config: SheetsConfig = JSON.parse(savedConfig);
        setDataSource(new SheetsAdapter(config));
        setSourceType('sheets');
      } catch (error) {
        console.error('Failed to load sheets config:', error);
        // Fall back to mock
        setDataSource(new MockAdapter());
        setSourceType('mock');
      }
    }
  }, []);

  const switchToMock = () => {
    setIsLoading(true);
    setDataSource(new MockAdapter());
    setSourceType('mock');
    localStorage.setItem(STORAGE_KEYS.DATA_SOURCE_TYPE, 'mock');
    localStorage.removeItem(STORAGE_KEYS.SHEETS_CONFIG);
    setIsLoading(false);
  };

  const switchToSheets = (config: SheetsConfig) => {
    setIsLoading(true);
    try {
      setDataSource(new SheetsAdapter(config));
      setSourceType('sheets');
      localStorage.setItem(STORAGE_KEYS.DATA_SOURCE_TYPE, 'sheets');
      localStorage.setItem(STORAGE_KEYS.SHEETS_CONFIG, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to switch to sheets:', error);
      // Keep current data source on error
    }
    setIsLoading(false);
  };

  return {
    dataSource,
    sourceType,
    isLoading,
    switchToMock,
    switchToSheets,
  };
}
