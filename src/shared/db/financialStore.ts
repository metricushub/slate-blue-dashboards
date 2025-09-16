import Dexie, { Table } from 'dexie';

export interface FinancialEntry {
  id?: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  clientId?: string;
  created_at: string;
}

export interface FinancialGoal {
  id?: string;
  type: 'revenue' | 'clients';
  target: number;
  current: number;
  month: string; // YYYY-MM
  created_at: string;
}

interface FinancialDatabase extends Dexie {
  entries: Table<FinancialEntry>;
  goals: Table<FinancialGoal>;
}

const db = new Dexie('FinancialDatabase') as FinancialDatabase;

db.version(1).stores({
  entries: '++id, type, category, date, clientId, created_at',
  goals: '++id, type, month, created_at'
});

// Financial Entries Operations
export const financialStore = {
  // Entries
  async createEntry(entry: Omit<FinancialEntry, 'id' | 'created_at'>): Promise<FinancialEntry> {
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const newEntry = { ...entry, id, created_at };
    await db.entries.add(newEntry);
    return newEntry;
  },

  async updateEntry(id: string, updates: Partial<FinancialEntry>): Promise<void> {
    await db.entries.update(id, updates);
  },

  async deleteEntry(id: string): Promise<void> {
    await db.entries.delete(id);
  },

  async getEntries(): Promise<FinancialEntry[]> {
    return await db.entries.orderBy('date').reverse().toArray();
  },

  async getEntriesByDateRange(startDate: string, endDate: string): Promise<FinancialEntry[]> {
    return await db.entries
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async getEntriesByMonth(month: string): Promise<FinancialEntry[]> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    return await this.getEntriesByDateRange(startDate, endDate);
  },

  // Goals
  async createGoal(goal: Omit<FinancialGoal, 'id' | 'created_at'>): Promise<FinancialGoal> {
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const newGoal = { ...goal, id, created_at };
    await db.goals.add(newGoal);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<FinancialGoal>): Promise<void> {
    await db.goals.update(id, updates);
  },

  async getGoalsByMonth(month: string): Promise<FinancialGoal[]> {
    return await db.goals.where('month').equals(month).toArray();
  },

  async getCurrentGoals(): Promise<FinancialGoal[]> {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    return await this.getGoalsByMonth(currentMonth);
  }
};

// Financial calculations
export const financialCalculations = {
  calculateNetProfit: (entries: FinancialEntry[]): number => {
    const income = entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const expenses = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    return income - expenses;
  },

  calculateTotalIncome: (entries: FinancialEntry[]): number => {
    return entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculateTotalExpenses: (entries: FinancialEntry[]): number => {
    return entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  getCategorySummary: (entries: FinancialEntry[]): { category: string; amount: number; type: 'income' | 'expense' }[] => {
    const summary = new Map<string, { amount: number; type: 'income' | 'expense' }>();
    
    entries.forEach(entry => {
      const key = `${entry.category}_${entry.type}`;
      if (summary.has(key)) {
        summary.get(key)!.amount += entry.amount;
      } else {
        summary.set(key, { amount: entry.amount, type: entry.type });
      }
    });

    return Array.from(summary.entries()).map(([key, data]) => ({
      category: key.split('_')[0],
      amount: data.amount,
      type: data.type
    }));
  }
};

export default db;