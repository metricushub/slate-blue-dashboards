import { DataSource, DataSourceType } from './types';
import { SheetsAdapter } from './adapters/sheets';
import { SupabaseAdapter } from './adapters/supabase';
import { HybridAdapter } from './adapters/hybrid';
import { MockAdapter } from '@/lib/adapters/mock-adapter';

export class DataSourceFactory {
  private static instance: DataSource | null = null;

  static create(type?: DataSourceType): DataSource {
    // Get type from localStorage, env or parameter (in priority order)
    const storedType = localStorage.getItem('datasource_type') as DataSourceType;
    const sourceType = type || storedType || (import.meta.env.VITE_DATASOURCE as DataSourceType) || 'supabase';

    // Return singleton instance if already created for the same type
    if (this.instance) {
      return this.instance;
    }

    switch (sourceType) {
      case 'supabase':
        this.instance = new SupabaseAdapter();
        break;
      case 'hybrid':
        this.instance = new HybridAdapter();
        break;
      case 'sheets':
        this.instance = new SheetsAdapter();
        break;
      case 'mock':
        this.instance = new MockAdapter();
        break;
      default:
        this.instance = new HybridAdapter(); // Default to hybrid for best experience
        break;
    }

    console.log(`📊 DataSource inicializado: ${sourceType}`);
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  static getCurrentType(): DataSourceType {
    const storedType = localStorage.getItem('datasource_type') as DataSourceType;
    return storedType || (import.meta.env.VITE_DATASOURCE as DataSourceType) || 'supabase';
  }

  static setDataSourceType(type: DataSourceType): void {
    localStorage.setItem('datasource_type', type);
    this.reset(); // Force recreation with new type
  }
}