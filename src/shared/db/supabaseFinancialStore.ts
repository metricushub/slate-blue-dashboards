import { supabase } from '@/integrations/supabase/client';

export interface FinancialEntry {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  due_date?: string;
  status: 'pending' | 'paid' | 'cancelled';
  client_id?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  month: string;
  type: 'revenue' | 'clients';
  target_amount: number;
  created_at: string;
  updated_at: string;
}

export interface PendingExpense {
  id: string;
  user_id: string;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid';
  created_at: string;
  updated_at: string;
}

export interface FinancialCategory {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  name: string;
  is_default: boolean;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const supabaseFinancialStore = {
  // Financial Entries
  async getFinancialEntries(startDate?: string, endDate?: string): Promise<FinancialEntry[]> {
    let query = supabase
      .from('financial_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (startDate && endDate) {
      query = query.gte('due_date', startDate).lte('due_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FinancialEntry[];
  },

  async addFinancialEntry(entry: Omit<FinancialEntry, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FinancialEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_entries')
      .insert({
        ...entry,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FinancialEntry;
  },

  async updateFinancialEntry(id: string, updates: Partial<FinancialEntry>): Promise<FinancialEntry> {
    const { data, error } = await supabase
      .from('financial_entries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialEntry;
  },

  async deleteFinancialEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Financial Goals
  async getFinancialGoals(month?: string): Promise<FinancialGoal[]> {
    let query = supabase
      .from('financial_goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (month) {
      query = query.eq('month', month);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FinancialGoal[];
  },

  async addFinancialGoal(goal: Omit<FinancialGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<FinancialGoal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Try to update existing goal first, then insert if not exists
    const { data: existingGoal } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', goal.month)
      .eq('type', goal.type)
      .maybeSingle();

    if (existingGoal) {
      // Update existing goal
      const { data, error } = await supabase
        .from('financial_goals')
        .update({
          target_amount: goal.target_amount,
        })
        .eq('id', existingGoal.id)
        .select()
        .single();

      if (error) throw error;
      return data as FinancialGoal;
    } else {
      // Create new goal
      const { data, error } = await supabase
        .from('financial_goals')
        .insert({
          ...goal,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FinancialGoal;
    }
  },

  async updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<FinancialGoal> {
    const { data, error } = await supabase
      .from('financial_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialGoal;
  },

  async deleteFinancialGoal(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Pending Expenses
  async getPendingExpenses(): Promise<PendingExpense[]> {
    const { data, error } = await supabase
      .from('pending_expenses')
      .select('*')
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    if (error) throw error;
    return (data || []) as PendingExpense[];
  },

  async addPendingExpense(expense: Omit<PendingExpense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<PendingExpense> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pending_expenses')
      .insert({
        ...expense,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PendingExpense;
  },

  async updatePendingExpense(id: string, updates: Partial<PendingExpense>): Promise<PendingExpense> {
    const { data, error } = await supabase
      .from('pending_expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as PendingExpense;
  },

  async deletePendingExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('pending_expenses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Financial Categories
  async getFinancialCategories(type?: 'income' | 'expense'): Promise<FinancialCategory[]> {
    let query = supabase
      .from('financial_categories')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true });

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FinancialCategory[];
  },

  async addFinancialCategory(category: Omit<FinancialCategory, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'is_default'>): Promise<FinancialCategory> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('financial_categories')
      .insert({
        ...category,
        user_id: user.id,
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FinancialCategory;
  },

  async updateFinancialCategory(id: string, updates: Partial<FinancialCategory>): Promise<FinancialCategory> {
    const { data, error } = await supabase
      .from('financial_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as FinancialCategory;
  },

  async deleteFinancialCategory(id: string): Promise<void> {
    // Check if category is in use
    const { data: entries } = await supabase
      .from('financial_entries')
      .select('id')
      .eq('category', (await supabase.from('financial_categories').select('name').eq('id', id).single()).data?.name)
      .limit(1);

    if (entries && entries.length > 0) {
      throw new Error('Cannot delete category that is in use');
    }

    const { error } = await supabase
      .from('financial_categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Financial calculations (same as before but adapted for Supabase data)
export const financialCalculations = {
  calculateNetProfit: (entries: FinancialEntry[]) => {
    const confirmedIncome = entries
      .filter(entry => entry.type === 'income' && entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalExpenses = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    return confirmedIncome - totalExpenses;
  },

  calculateTotalIncome: (entries: FinancialEntry[]) => {
    return entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculateConfirmedIncome: (entries: FinancialEntry[]) => {
    return entries
      .filter(entry => entry.type === 'income' && entry.status === 'paid')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculatePendingIncome: (entries: FinancialEntry[]) => {
    return entries
      .filter(entry => entry.type === 'income' && entry.status === 'pending')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  calculateTotalExpenses: (entries: FinancialEntry[]) => {
    return entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
  },

  getCategorySummary: (entries: FinancialEntry[]) => {
    const summary: Record<string, { income: number; expense: number }> = {};
    
    entries.forEach(entry => {
      if (!summary[entry.category]) {
        summary[entry.category] = { income: 0, expense: 0};
      }
      summary[entry.category][entry.type] += entry.amount;
    });
    
    return summary;
  },

  getDaysUntilDue: (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  getAlertSeverity: (daysUntil: number) => {
    if (daysUntil < 0) return 'overdue';
    if (daysUntil === 0) return 'due-today';
    if (daysUntil <= 3) return 'high';
    if (daysUntil <= 7) return 'medium';
    return 'normal';
  },
};