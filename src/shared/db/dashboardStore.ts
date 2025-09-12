import Dexie, { Table } from 'dexie';
import { Optimization, Task, AlertRule } from '@/types';

export interface DashboardDatabase extends Dexie {
  optimizations: Table<Optimization>;
  tasks: Table<Task>;
  alerts: Table<AlertRule>;
  meta: Table<{ key: string; value: any }>;
}

export const dashboardDb = new Dexie('ClientDashboard') as DashboardDatabase;

dashboardDb.version(1).stores({
  optimizations: 'id, client_id, status, start_date, created_at',
  tasks: 'id, client_id, status, priority, due_date, created_at',
  alerts: 'id, client_id, enabled, severity, created_at',
  meta: 'key'
});

// Optimization operations
export const optimizationOperations = {
  async create(optimization: Omit<Optimization, 'id' | 'created_at'>): Promise<Optimization> {
    const newOptimization: Optimization = {
      ...optimization,
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await dashboardDb.optimizations.add(newOptimization);
    return newOptimization;
  },

  async update(id: string, updates: Partial<Optimization>): Promise<void> {
    await dashboardDb.optimizations.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  },

  async getByClient(clientId: string): Promise<Optimization[]> {
    return await dashboardDb.optimizations
      .where('client_id')
      .equals(clientId)
      .reverse()
      .toArray();
  },

  async delete(id: string): Promise<void> {
    await dashboardDb.optimizations.delete(id);
  }
};

// Task operations
export const taskOperations = {
  async create(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await dashboardDb.tasks.add(newTask);
    return newTask;
  },

  async update(id: string, updates: Partial<Task>): Promise<void> {
    await dashboardDb.tasks.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  },

  async getByClient(clientId: string): Promise<Task[]> {
    return await dashboardDb.tasks
      .where('client_id')
      .equals(clientId)
      .reverse()
      .toArray();
  },

  async delete(id: string): Promise<void> {
    await dashboardDb.tasks.delete(id);
  }
};

// Alert rule operations
export const alertOperations = {
  async create(alert: Omit<AlertRule, 'id' | 'created_at'>): Promise<AlertRule> {
    const newAlert: AlertRule = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await dashboardDb.alerts.add(newAlert);
    return newAlert;
  },

  async update(id: string, updates: Partial<AlertRule>): Promise<void> {
    await dashboardDb.alerts.update(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });
  },

  async getByClient(clientId: string): Promise<AlertRule[]> {
    return await dashboardDb.alerts
      .where('client_id')
      .equals(clientId)
      .reverse()
      .toArray();
  },

  async delete(id: string): Promise<void> {
    await dashboardDb.alerts.delete(id);
  }
};

// Utility functions
export const dashboardUtils = {
  async exportData(clientId: string) {
    const [optimizations, tasks, alerts] = await Promise.all([
      optimizationOperations.getByClient(clientId),
      taskOperations.getByClient(clientId),
      alertOperations.getByClient(clientId)
    ]);

    return {
      optimizations,
      tasks,
      alerts,
      exportedAt: new Date().toISOString()
    };
  },

  async importData(clientId: string, data: any) {
    const { optimizations = [], tasks = [], alerts = [] } = data;
    
    // Clear existing data
    await dashboardDb.optimizations.where('client_id').equals(clientId).delete();
    await dashboardDb.tasks.where('client_id').equals(clientId).delete();
    await dashboardDb.alerts.where('client_id').equals(clientId).delete();
    
    // Import new data
    await Promise.all([
      dashboardDb.optimizations.bulkAdd(optimizations),
      dashboardDb.tasks.bulkAdd(tasks),
      dashboardDb.alerts.bulkAdd(alerts)
    ]);
  }
};