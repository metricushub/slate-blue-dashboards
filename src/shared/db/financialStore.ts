import Dexie, { Table } from 'dexie';

export interface FinancialEntry {
  id?: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  category: string;
  date: string;
  clientId?: string;
  status?: 'pending' | 'paid' | 'cancelled'; // For income tracking
  dueDate?: string; // Expected payment date for income
  paidDate?: string; // Actual payment date
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

export interface PendingExpense {
  id?: string;
  description: string;
  amount: number;
  category: string;
  dueDate: string;
  recurring: 'monthly' | 'quarterly' | 'yearly' | 'none';
  status: 'pending' | 'paid' | 'overdue';
  clientId?: string;
  created_at: string;
}

interface FinancialDatabase extends Dexie {
  entries: Table<FinancialEntry>;
  goals: Table<FinancialGoal>;
  pendingExpenses: Table<PendingExpense>;
}

const db = new Dexie('FinancialDatabase') as FinancialDatabase;

db.version(1).stores({
  entries: '++id, type, category, date, status, dueDate, clientId, created_at',
  goals: '++id, type, month, created_at',
  pendingExpenses: '++id, category, dueDate, status, clientId, created_at'
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
  },

  // Pending Expenses
  async createPendingExpense(expense: Omit<PendingExpense, 'id' | 'created_at'>): Promise<PendingExpense> {
    const id = crypto.randomUUID();
    const created_at = new Date().toISOString();
    const newExpense = { ...expense, id, created_at };
    await db.pendingExpenses.add(newExpense);
    return newExpense;
  },

  async updatePendingExpense(id: string, updates: Partial<PendingExpense>): Promise<void> {
    await db.pendingExpenses.update(id, updates);
  },

  async deletePendingExpense(id: string): Promise<void> {
    await db.pendingExpenses.delete(id);
  },

  async getPendingExpenses(): Promise<PendingExpense[]> {
    return await db.pendingExpenses.orderBy('dueDate').toArray();
  },

  async getOverdueExpenses(): Promise<PendingExpense[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.pendingExpenses
      .where('dueDate')
      .below(today)
      .and(expense => expense.status === 'pending')
      .toArray();
  },

  async getDueSoonExpenses(days: number = 7): Promise<PendingExpense[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    return await db.pendingExpenses
      .where('dueDate')
      .between(todayStr, futureDateStr, true, true)
      .and(expense => expense.status === 'pending')
      .toArray();
  },

  async markExpenseAsPaid(id: string): Promise<void> {
    await this.updatePendingExpense(id, { status: 'paid' });
  },

  // Income status management
  async markIncomeAsPaid(id: string, paidDate?: string): Promise<void> {
    const actualPaidDate = paidDate || new Date().toISOString().split('T')[0];
    await this.updateEntry(id, { 
      status: 'paid', 
      paidDate: actualPaidDate,
      date: actualPaidDate // Update main date to paid date for calculations
    });
  },

  async markIncomeAsCancelled(id: string): Promise<void> {
    await this.updateEntry(id, { status: 'cancelled' });
  },

  async getPendingIncomes(): Promise<FinancialEntry[]> {
    return await db.entries
      .where('type')
      .equals('income')
      .and(entry => entry.status === 'pending')
      .toArray();
  },

  async getOverdueIncomes(): Promise<FinancialEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db.entries
      .where('type')
      .equals('income')
      .and(entry => entry.status === 'pending' && entry.dueDate && entry.dueDate < today)
      .toArray();
  }
};

// Financial calculations
export const financialCalculations = {
  calculateNetProfit: (entries: FinancialEntry[]): number => {
    const income = entries
      .filter(entry => entry.type === 'income' && entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const expenses = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    return income - expenses;
  },

  calculateTotalIncome: (entries: FinancialEntry[]): number => {
    return entries
      .filter(entry => entry.type === 'income' && entry.status !== 'cancelled')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculateConfirmedIncome: (entries: FinancialEntry[]): number => {
    return entries
      .filter(entry => entry.type === 'income' && entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculatePendingIncome: (entries: FinancialEntry[]): number => {
    return entries
      .filter(entry => entry.type === 'income' && entry.status === 'pending')
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
  },

  // Alert calculations
  getDaysUntilDue: (dueDate: string): number => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  getAlertSeverity: (daysUntil: number): 'high' | 'medium' | 'low' => {
    if (daysUntil < 0) return 'high'; // Overdue
    if (daysUntil <= 3) return 'high'; // Due in 3 days or less
    if (daysUntil <= 7) return 'medium'; // Due in a week
    return 'low'; // Due later
  }
};

export default db;