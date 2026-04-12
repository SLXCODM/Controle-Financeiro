import { Transaction, Category, FinancialGoal, SavingsGoal, UserSettings, DEFAULT_CATEGORIES, IncomeSource, Wallet, WalletTransaction, DEFAULT_WALLETS, RecurringTransaction } from '@/types/finance';

const STORAGE_KEYS = {
  TRANSACTIONS: 'slx_transactions',
  CATEGORIES: 'slx_categories',
  GOALS: 'slx_goals',
  SAVINGS_GOALS: 'slx_savings_goals',
  SETTINGS: 'slx_settings',
  INCOME_SOURCES: 'slx_income_sources',
  WALLETS: 'slx_wallets',
  WALLET_TRANSACTIONS: 'slx_wallet_transactions',
  RECURRING_TRANSACTIONS: 'slx_recurring_transactions',
  LAST_RECURRING_CHECK: 'slx_last_recurring_check',
};

// Generic storage functions
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
}

// Transactions
export function getTransactions(): Transaction[] {
  return getItem(STORAGE_KEYS.TRANSACTIONS, []);
}

export function saveTransactions(transactions: Transaction[]): void {
  setItem(STORAGE_KEYS.TRANSACTIONS, transactions);
}

export function addTransaction(transaction: Transaction): Transaction[] {
  const transactions = getTransactions();
  transactions.unshift(transaction);
  saveTransactions(transactions);
  return transactions;
}

export function updateTransaction(id: string, updates: Partial<Transaction>): Transaction[] {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    saveTransactions(transactions);
  }
  return transactions;
}

export function deleteTransaction(id: string): Transaction[] {
  const transactions = getTransactions().filter(t => t.id !== id);
  saveTransactions(transactions);
  return transactions;
}

// Categories
export function getCategories(): Category[] {
  const saved = getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  return saved.length > 0 ? saved : DEFAULT_CATEGORIES;
}

export function saveCategories(categories: Category[]): void {
  setItem(STORAGE_KEYS.CATEGORIES, categories);
}

export function addCategory(category: Category): Category[] {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
  return categories;
}

export function updateCategory(id: string, updates: Partial<Category>): Category[] {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates };
    saveCategories(categories);
  }
  return categories;
}

export function deleteCategory(id: string): Category[] {
  const categories = getCategories().filter(c => c.id !== id);
  saveCategories(categories);
  return categories;
}

// Financial Goals
export function getFinancialGoals(): FinancialGoal[] {
  return getItem(STORAGE_KEYS.GOALS, []);
}

export function saveFinancialGoals(goals: FinancialGoal[]): void {
  setItem(STORAGE_KEYS.GOALS, goals);
}

export function addFinancialGoal(goal: FinancialGoal): FinancialGoal[] {
  const goals = getFinancialGoals();
  goals.push(goal);
  saveFinancialGoals(goals);
  return goals;
}

export function updateFinancialGoal(id: string, updates: Partial<FinancialGoal>): FinancialGoal[] {
  const goals = getFinancialGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates };
    saveFinancialGoals(goals);
  }
  return goals;
}

export function deleteFinancialGoal(id: string): FinancialGoal[] {
  const goals = getFinancialGoals().filter(g => g.id !== id);
  saveFinancialGoals(goals);
  return goals;
}

// Savings Goals
export function getSavingsGoals(): SavingsGoal[] {
  return getItem(STORAGE_KEYS.SAVINGS_GOALS, []);
}

export function saveSavingsGoals(goals: SavingsGoal[]): void {
  setItem(STORAGE_KEYS.SAVINGS_GOALS, goals);
}

export function addSavingsGoal(goal: SavingsGoal): SavingsGoal[] {
  const goals = getSavingsGoals();
  goals.push(goal);
  saveSavingsGoals(goals);
  return goals;
}

export function updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): SavingsGoal[] {
  const goals = getSavingsGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates };
    saveSavingsGoals(goals);
  }
  return goals;
}

export function deleteSavingsGoal(id: string): SavingsGoal[] {
  const goals = getSavingsGoals().filter(g => g.id !== id);
  saveSavingsGoals(goals);
  return goals;
}

// Income Sources
export function getIncomeSources(): IncomeSource[] {
  return getItem(STORAGE_KEYS.INCOME_SOURCES, []);
}

export function saveIncomeSources(sources: IncomeSource[]): void {
  setItem(STORAGE_KEYS.INCOME_SOURCES, sources);
}

export function addIncomeSource(source: IncomeSource): IncomeSource[] {
  const sources = getIncomeSources();
  sources.push(source);
  saveIncomeSources(sources);
  return sources;
}

export function updateIncomeSource(id: string, updates: Partial<IncomeSource>): IncomeSource[] {
  const sources = getIncomeSources();
  const index = sources.findIndex(s => s.id === id);
  if (index !== -1) {
    sources[index] = { ...sources[index], ...updates };
    saveIncomeSources(sources);
  }
  return sources;
}

export function deleteIncomeSource(id: string): IncomeSource[] {
  const sources = getIncomeSources().filter(s => s.id !== id);
  saveIncomeSources(sources);
  return sources;
}

// Wallets
export function getWallets(): Wallet[] {
  const saved = getItem<Wallet[]>(STORAGE_KEYS.WALLETS, []);
  return saved.length > 0 ? saved : DEFAULT_WALLETS;
}

export function saveWallets(wallets: Wallet[]): void {
  setItem(STORAGE_KEYS.WALLETS, wallets);
}

export function addWallet(wallet: Wallet): Wallet[] {
  const wallets = getWallets();
  wallets.push(wallet);
  saveWallets(wallets);
  return wallets;
}

export function updateWallet(id: string, updates: Partial<Wallet>): Wallet[] {
  const wallets = getWallets();
  const index = wallets.findIndex(w => w.id === id);
  if (index !== -1) {
    wallets[index] = { ...wallets[index], ...updates };
    saveWallets(wallets);
  }
  return wallets;
}

export function deleteWallet(id: string): Wallet[] {
  const wallets = getWallets().filter(w => w.id !== id);
  saveWallets(wallets);
  return wallets;
}

// Wallet Transactions
export function getWalletTransactions(): WalletTransaction[] {
  return getItem(STORAGE_KEYS.WALLET_TRANSACTIONS, []);
}

export function saveWalletTransactions(transactions: WalletTransaction[]): void {
  setItem(STORAGE_KEYS.WALLET_TRANSACTIONS, transactions);
}

export function addWalletTransaction(transaction: WalletTransaction): WalletTransaction[] {
  const transactions = getWalletTransactions();
  transactions.unshift(transaction);
  saveWalletTransactions(transactions);
  return transactions;
}

// Recurring Transactions
export function getRecurringTransactions(): RecurringTransaction[] {
  return getItem(STORAGE_KEYS.RECURRING_TRANSACTIONS, []);
}

export function saveRecurringTransactions(items: RecurringTransaction[]): void {
  setItem(STORAGE_KEYS.RECURRING_TRANSACTIONS, items);
}

export function addRecurringTransaction(item: RecurringTransaction): RecurringTransaction[] {
  const items = getRecurringTransactions();
  items.push(item);
  saveRecurringTransactions(items);
  return items;
}

export function updateRecurringTransaction(id: string, updates: Partial<RecurringTransaction>): RecurringTransaction[] {
  const items = getRecurringTransactions();
  const index = items.findIndex(i => i.id === id);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveRecurringTransactions(items);
  }
  return items;
}

export function deleteRecurringTransaction(id: string): RecurringTransaction[] {
  const items = getRecurringTransactions().filter(i => i.id !== id);
  saveRecurringTransactions(items);
  return items;
}

/**
 * Process recurring transactions for the current month.
 * Creates transactions for active recurring items that haven't been generated yet this month.
 */
export function processRecurringTransactions(): Transaction[] {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastCheck = localStorage.getItem(STORAGE_KEYS.LAST_RECURRING_CHECK);
  
  if (lastCheck === currentMonthKey) {
    return getTransactions(); // Already processed this month
  }

  const recurring = getRecurringTransactions().filter(r => r.isActive);
  const existingTransactions = getTransactions();
  
  let hasNew = false;

  for (const item of recurring) {
    // Check if transaction already exists for this recurrence + month
    const alreadyExists = existingTransactions.some(
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
      
      existingTransactions.unshift(transaction);
      hasNew = true;
    }
  }

  if (hasNew) {
    saveTransactions(existingTransactions);
  }
  
  localStorage.setItem(STORAGE_KEYS.LAST_RECURRING_CHECK, currentMonthKey);
  return existingTransactions;
}

// User Settings
export function getSettings(): UserSettings {
  return getItem(STORAGE_KEYS.SETTINGS, {
    displayName: 'Usuário',
    currency: 'BRL',
    privacyMode: false,
  });
}

export function saveSettings(settings: UserSettings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings);
}

// Export/Import for backup
export function exportAllData(): string {
  const data = {
    transactions: getTransactions(),
    categories: getCategories(),
    goals: getFinancialGoals(),
    savingsGoals: getSavingsGoals(),
    incomeSources: getIncomeSources(),
    wallets: getWallets(),
    walletTransactions: getWalletTransactions(),
    recurringTransactions: getRecurringTransactions(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data.transactions) saveTransactions(data.transactions);
    if (data.categories) saveCategories(data.categories);
    if (data.goals) saveFinancialGoals(data.goals);
    if (data.savingsGoals) saveSavingsGoals(data.savingsGoals);
    if (data.incomeSources) saveIncomeSources(data.incomeSources);
    if (data.wallets) saveWallets(data.wallets);
    if (data.walletTransactions) saveWalletTransactions(data.walletTransactions);
    if (data.recurringTransactions) saveRecurringTransactions(data.recurringTransactions);
    if (data.settings) saveSettings(data.settings);
    return true;
  } catch {
    return false;
  }
}
