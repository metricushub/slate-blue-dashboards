import { DataSource, DataSourceType } from './types';
import { SheetsAdapter } from './adapters/sheets';
import { MockAdapter } from '@/lib/adapters/mock-adapter';

export class DataSourceFactory {
  private static instance: DataSource | null = null;

  static create(type?: DataSourceType): DataSource {
    // Get type from env or parameter
    const sourceType = type || (import.meta.env.VITE_DATASOURCE as DataSourceType) || 'mock';

    // Return singleton instance if already created for the same type
    if (this.instance) {
      return this.instance;
    }

    switch (sourceType) {
      case 'sheets':
        this.instance = new SheetsAdapter();
        break;
      case 'mock':
      default:
        this.instance = new MockAdapter();
        break;
    }

    console.log(`📊 DataSource inicializado: ${sourceType}`);
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
  }

  static getCurrentType(): DataSourceType {
    return (import.meta.env.VITE_DATASOURCE as DataSourceType) || 'mock';
  }
}