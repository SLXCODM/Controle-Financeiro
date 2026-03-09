import { supabase } from '@/integrations/supabase/client';
import {
  Transaction, Category, FinancialGoal, SavingsGoal,
  UserSettings, IncomeSource, Wallet, WalletTransaction,
  RecurringTransaction, DEFAULT_CATEGORIES, DEFAULT_WALLETS,
} from '@/types/finance';

// ============ Transactions ============
export async function getTransactions(): Promise<Transaction[]> {
  const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id,
    amount: Number(r.amount),
    type: r.type as Transaction['type'],
    categoryId: r.category_id,
    description: r.description,
    date: r.date,
    createdAt: r.created_at,
    savingsGoalId: r.savings_goal_id || undefined,
    savingsContribution: r.savings_contribution ? Number(r.savings_contribution) : undefined,
    isRecurring: r.is_recurring || false,
    recurrenceId: r.recurrence_id || undefined,
  }));
}

export async function addTransaction(t: Transaction, userId: string): Promise<void> {
  await supabase.from('transactions').insert({
    id: t.id,
    user_id: userId,
    amount: t.amount,
    type: t.type,
    category_id: t.categoryId,
    description: t.description,
    date: t.date,
    savings_goal_id: t.savingsGoalId || null,
    savings_contribution: t.savingsContribution || null,
    is_recurring: t.isRecurring || false,
    recurrence_id: t.recurrenceId || null,
  });
}

export async function updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.amount !== undefined) mapped.amount = updates.amount;
  if (updates.type !== undefined) mapped.type = updates.type;
  if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.date !== undefined) mapped.date = updates.date;
  await supabase.from('transactions').update(mapped).eq('id', id);
}

export async function deleteTransaction(id: string): Promise<void> {
  await supabase.from('transactions').delete().eq('id', id);
}

// ============ Categories ============
export async function getCategories(userId: string): Promise<Category[]> {
  const { data } = await supabase.from('categories').select('*').order('created_at');
  if (!data || data.length === 0) {
    // Seed default categories for new user
    const inserts = DEFAULT_CATEGORIES.map(c => ({
      user_id: userId,
      name: c.name,
      icon: c.icon,
      color: c.color,
      type: c.type,
      is_default: true,
    }));
    const { data: seeded } = await supabase.from('categories').insert(inserts).select();
    return (seeded || []).map(mapCategory);
  }
  return data.map(mapCategory);
}

function mapCategory(r: any): Category {
  return { id: r.id, name: r.name, icon: r.icon, color: r.color, type: r.type };
}

export async function addCategory(c: Category, userId: string): Promise<void> {
  await supabase.from('categories').insert({
    id: c.id, user_id: userId, name: c.name, icon: c.icon, color: c.color, type: c.type,
  });
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  await supabase.from('categories').update(updates).eq('id', id);
}

export async function deleteCategory(id: string): Promise<void> {
  await supabase.from('categories').delete().eq('id', id);
}

// ============ Financial Goals ============
export async function getFinancialGoals(): Promise<FinancialGoal[]> {
  const { data } = await supabase.from('financial_goals').select('*');
  return (data || []).map(r => ({
    id: r.id, categoryId: r.category_id, monthlyLimit: Number(r.monthly_limit), month: r.month,
  }));
}

export async function addFinancialGoal(g: FinancialGoal, userId: string): Promise<void> {
  await supabase.from('financial_goals').insert({
    id: g.id, user_id: userId, category_id: g.categoryId, monthly_limit: g.monthlyLimit, month: g.month,
  });
}

export async function updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
  if (updates.monthlyLimit !== undefined) mapped.monthly_limit = updates.monthlyLimit;
  if (updates.month !== undefined) mapped.month = updates.month;
  await supabase.from('financial_goals').update(mapped).eq('id', id);
}

export async function deleteFinancialGoal(id: string): Promise<void> {
  await supabase.from('financial_goals').delete().eq('id', id);
}

// ============ Savings Goals ============
export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  const { data } = await supabase.from('savings_goals').select('*');
  return (data || []).map(r => ({
    id: r.id, name: r.name, targetAmount: Number(r.target_amount),
    currentAmount: Number(r.current_amount), deadline: r.deadline || undefined, createdAt: r.created_at,
  }));
}

export async function addSavingsGoal(g: SavingsGoal, userId: string): Promise<void> {
  await supabase.from('savings_goals').insert({
    id: g.id, user_id: userId, name: g.name, target_amount: g.targetAmount,
    current_amount: g.currentAmount, deadline: g.deadline || null,
  });
}

export async function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.targetAmount !== undefined) mapped.target_amount = updates.targetAmount;
  if (updates.currentAmount !== undefined) mapped.current_amount = updates.currentAmount;
  if (updates.deadline !== undefined) mapped.deadline = updates.deadline;
  await supabase.from('savings_goals').update(mapped).eq('id', id);
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  await supabase.from('savings_goals').delete().eq('id', id);
}

// ============ Income Sources ============
export async function getIncomeSources(): Promise<IncomeSource[]> {
  const { data } = await supabase.from('income_sources').select('*');
  return (data || []).map(r => ({
    id: r.id, name: r.name, distributions: r.distributions as any || [],
  }));
}

export async function addIncomeSource(s: IncomeSource, userId: string): Promise<void> {
  await supabase.from('income_sources').insert({
    id: s.id, user_id: userId, name: s.name, distributions: s.distributions as any,
  });
}

export async function updateIncomeSource(id: string, updates: Partial<IncomeSource>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.name !== undefined) mapped.name = updates.name;
  if (updates.distributions !== undefined) mapped.distributions = updates.distributions;
  await supabase.from('income_sources').update(mapped).eq('id', id);
}

export async function deleteIncomeSource(id: string): Promise<void> {
  await supabase.from('income_sources').delete().eq('id', id);
}

// ============ Wallets ============
export async function getWallets(userId: string): Promise<Wallet[]> {
  const { data } = await supabase.from('wallets').select('*');
  if (!data || data.length === 0) {
    const inserts = DEFAULT_WALLETS.map(w => ({
      user_id: userId, name: w.name, icon: w.icon, color: w.color, balance: w.balance, is_default: true,
    }));
    const { data: seeded } = await supabase.from('wallets').insert(inserts).select();
    return (seeded || []).map(mapWallet);
  }
  return data.map(mapWallet);
}

function mapWallet(r: any): Wallet {
  return { id: r.id, name: r.name, icon: r.icon, color: r.color, balance: Number(r.balance) };
}

export async function addWallet(w: Wallet, userId: string): Promise<void> {
  await supabase.from('wallets').insert({
    id: w.id, user_id: userId, name: w.name, icon: w.icon, color: w.color, balance: w.balance,
  });
}

export async function updateWallet(id: string, updates: Partial<Wallet>): Promise<void> {
  await supabase.from('wallets').update(updates).eq('id', id);
}

export async function deleteWallet(id: string): Promise<void> {
  await supabase.from('wallets').delete().eq('id', id);
}

// ============ Wallet Transactions ============
export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const { data } = await supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id, walletId: r.wallet_id, amount: Number(r.amount), type: r.type as 'credit' | 'debit',
    description: r.description, date: r.date, linkedTransactionId: r.linked_transaction_id || undefined,
  }));
}

export async function addWalletTransaction(t: WalletTransaction, userId: string): Promise<void> {
  await supabase.from('wallet_transactions').insert({
    id: t.id, user_id: userId, wallet_id: t.walletId, amount: t.amount,
    type: t.type, description: t.description, date: t.date,
    linked_transaction_id: t.linkedTransactionId || null,
  });
}

// ============ Recurring Transactions ============
export async function getRecurringTransactions(): Promise<RecurringTransaction[]> {
  const { data } = await supabase.from('recurring_transactions').select('*').order('created_at', { ascending: false });
  return (data || []).map(r => ({
    id: r.id, amount: Number(r.amount), type: r.type as RecurringTransaction['type'],
    categoryId: r.category_id, description: r.description, dayOfMonth: r.day_of_month,
    isActive: r.is_active, createdAt: r.created_at,
  }));
}

export async function addRecurringTransaction(item: RecurringTransaction, userId: string): Promise<void> {
  await supabase.from('recurring_transactions').insert({
    id: item.id, user_id: userId, amount: item.amount, type: item.type,
    category_id: item.categoryId, description: item.description,
    day_of_month: item.dayOfMonth, is_active: item.isActive,
  });
}

export async function updateRecurringTransaction(id: string, updates: Partial<RecurringTransaction>): Promise<void> {
  const mapped: Record<string, unknown> = {};
  if (updates.amount !== undefined) mapped.amount = updates.amount;
  if (updates.type !== undefined) mapped.type = updates.type;
  if (updates.categoryId !== undefined) mapped.category_id = updates.categoryId;
  if (updates.description !== undefined) mapped.description = updates.description;
  if (updates.dayOfMonth !== undefined) mapped.day_of_month = updates.dayOfMonth;
  if (updates.isActive !== undefined) mapped.is_active = updates.isActive;
  await supabase.from('recurring_transactions').update(mapped).eq('id', id);
}

export async function deleteRecurringTransaction(id: string): Promise<void> {
  await supabase.from('recurring_transactions').delete().eq('id', id);
}

// ============ User Settings ============
export async function getUserSettings(): Promise<UserSettings> {
  const { data } = await supabase.from('user_settings').select('*').single();
  if (!data) return { displayName: 'Usuário', currency: 'BRL', privacyMode: false };
  return {
    displayName: data.display_name,
    currency: data.currency,
    privacyMode: data.privacy_mode,
  };
}

export async function updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const mapped: Record<string, unknown> = {};
  if (updates.displayName !== undefined) mapped.display_name = updates.displayName;
  if (updates.currency !== undefined) mapped.currency = updates.currency;
  if (updates.privacyMode !== undefined) mapped.privacy_mode = updates.privacyMode;
  await supabase.from('user_settings').update(mapped).eq('user_id', user.id);
}

// ============ Process Recurring ============
export async function processRecurringTransactions(userId: string): Promise<void> {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const recurring = await getRecurringTransactions();
  const activeItems = recurring.filter(r => r.isActive);
  if (activeItems.length === 0) return;

  const transactions = await getTransactions();

  for (const item of activeItems) {
    const alreadyExists = transactions.some(
      t => t.recurrenceId === item.id && t.date.startsWith(currentMonthKey)
    );
    if (!alreadyExists) {
      const day = Math.min(item.dayOfMonth, 28);
      const dateStr = `${currentMonthKey}-${String(day).padStart(2, '0')}`;
      const transaction: Transaction = {
        id: crypto.randomUUID(),
        amount: item.amount,
        type: item.type,
        categoryId: item.categoryId,
        description: `${item.description} (Recorrente)`,
        date: dateStr,
        createdAt: new Date().toISOString(),
        isRecurring: true,
        recurrenceId: item.id,
      };
      await addTransaction(transaction, userId);
    }
  }
}
