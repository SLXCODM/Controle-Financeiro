import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction,
  Category,
  FinancialGoal,
  SavingsGoal,
  UserSettings,
  MonthlyStats,
  IncomeSource,
  Wallet,
  WalletTransaction,
  RecurringTransaction,
} from '@/types/finance';
import * as storage from '@/lib/storage';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  financialGoals: FinancialGoal[];
  savingsGoals: SavingsGoal[];
  settings: UserSettings;
  incomeSources: IncomeSource[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  recurringTransactions: RecurringTransaction[];
  
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  monthlyStats: MonthlyStats;
  
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | undefined;
  
  addFinancialGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateFinancialGoal: (id: string, updates: Partial<FinancialGoal>) => void;
  deleteFinancialGoal: (id: string) => void;
  
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  
  addIncomeSource: (source: Omit<IncomeSource, 'id'>) => void;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => void;
  deleteIncomeSource: (id: string) => void;
  
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, updates: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addWalletTransaction: (transaction: Omit<WalletTransaction, 'id'>) => void;
  
  // Recurring
  addRecurring: (item: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  
  updateSettings: (settings: Partial<UserSettings>) => void;
  formatCurrency: (value: number) => string;
  refreshData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<UserSettings>(storage.getSettings());
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  const refreshData = useCallback(() => {
    // Process recurring transactions first
    const processedTransactions = storage.processRecurringTransactions();
    setTransactions(processedTransactions);
    setCategories(storage.getCategories());
    setFinancialGoals(storage.getFinancialGoals());
    setSavingsGoals(storage.getSavingsGoals());
    setSettings(storage.getSettings());
    setIncomeSources(storage.getIncomeSources());
    setWallets(storage.getWallets());
    setWalletTransactions(storage.getWalletTransactions());
    setRecurringTransactions(storage.getRecurringTransactions());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const monthlyStats = React.useMemo((): MonthlyStats => {
    const monthDate = parseISO(`${currentMonth}-01`);
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    const monthTransactions = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start, end });
    });
    
    const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = monthTransactions.filter(t => t.type === 'investment').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpenses - totalInvestments;
    
    const expensesByCategory = monthTransactions.filter(t => t.type === 'expense').reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const categoryBreakdown = Object.entries(expensesByCategory)
      .map(([categoryId, amount]) => ({ categoryId, amount, percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
    
    const incomeByCategory = monthTransactions.filter(t => t.type === 'income').reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const incomeBreakdown = Object.entries(incomeByCategory)
      .map(([categoryId, amount]) => ({ categoryId, amount, percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount);
    
    return { totalIncome, totalExpenses, totalInvestments, netProfit, categoryBreakdown, incomeBreakdown };
  }, [transactions, currentMonth]);

  const formatCurrency = useCallback((value: number) => {
    if (settings.privacyMode) return '••••••';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: settings.currency }).format(value);
  }, [settings.currency, settings.privacyMode]);

  // Transaction actions
  const addTransactionHandler = useCallback((data: Omit<Transaction, 'id' | 'createdAt'>) => {
    const transaction: Transaction = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const updated = storage.addTransaction(transaction);
    setTransactions(updated);
    
    if (data.savingsGoalId && data.savingsContribution && data.savingsContribution > 0) {
      const goal = savingsGoals.find(g => g.id === data.savingsGoalId);
      if (goal) {
        const updatedGoals = storage.updateSavingsGoal(data.savingsGoalId, { currentAmount: goal.currentAmount + data.savingsContribution });
        setSavingsGoals(updatedGoals);
      }
    }
  }, [savingsGoals]);

  const updateTransactionHandler = useCallback((id: string, updates: Partial<Transaction>) => {
    setTransactions(storage.updateTransaction(id, updates));
  }, []);

  const deleteTransactionHandler = useCallback((id: string) => {
    setTransactions(storage.deleteTransaction(id));
  }, []);

  const addCategoryHandler = useCallback((data: Omit<Category, 'id'>) => {
    setCategories(storage.addCategory({ ...data, id: crypto.randomUUID() }));
  }, []);

  const updateCategoryHandler = useCallback((id: string, updates: Partial<Category>) => {
    setCategories(storage.updateCategory(id, updates));
  }, []);

  const deleteCategoryHandler = useCallback((id: string) => {
    setCategories(storage.deleteCategory(id));
  }, []);

  const addFinancialGoalHandler = useCallback((data: Omit<FinancialGoal, 'id'>) => {
    setFinancialGoals(storage.addFinancialGoal({ ...data, id: crypto.randomUUID() }));
  }, []);

  const updateFinancialGoalHandler = useCallback((id: string, updates: Partial<FinancialGoal>) => {
    setFinancialGoals(storage.updateFinancialGoal(id, updates));
  }, []);

  const deleteFinancialGoalHandler = useCallback((id: string) => {
    setFinancialGoals(storage.deleteFinancialGoal(id));
  }, []);

  const addSavingsGoalHandler = useCallback((data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    setSavingsGoals(storage.addSavingsGoal({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }));
  }, []);

  const updateSavingsGoalHandler = useCallback((id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals(storage.updateSavingsGoal(id, updates));
  }, []);

  const deleteSavingsGoalHandler = useCallback((id: string) => {
    setSavingsGoals(storage.deleteSavingsGoal(id));
  }, []);

  const addIncomeSourceHandler = useCallback((data: Omit<IncomeSource, 'id'>) => {
    setIncomeSources(storage.addIncomeSource({ ...data, id: crypto.randomUUID() }));
  }, []);

  const updateIncomeSourceHandler = useCallback((id: string, updates: Partial<IncomeSource>) => {
    setIncomeSources(storage.updateIncomeSource(id, updates));
  }, []);

  const deleteIncomeSourceHandler = useCallback((id: string) => {
    setIncomeSources(storage.deleteIncomeSource(id));
  }, []);

  const addWalletHandler = useCallback((data: Omit<Wallet, 'id'>) => {
    setWallets(storage.addWallet({ ...data, id: crypto.randomUUID() }));
  }, []);

  const updateWalletHandler = useCallback((id: string, updates: Partial<Wallet>) => {
    setWallets(storage.updateWallet(id, updates));
  }, []);

  const deleteWalletHandler = useCallback((id: string) => {
    setWallets(storage.deleteWallet(id));
  }, []);

  const addWalletTransactionHandler = useCallback((data: Omit<WalletTransaction, 'id'>) => {
    setWalletTransactions(storage.addWalletTransaction({ ...data, id: crypto.randomUUID() }));
  }, []);

  // Recurring transaction actions
  const addRecurringHandler = useCallback((data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    const item: RecurringTransaction = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setRecurringTransactions(storage.addRecurringTransaction(item));
  }, []);

  const updateRecurringHandler = useCallback((id: string, updates: Partial<RecurringTransaction>) => {
    setRecurringTransactions(storage.updateRecurringTransaction(id, updates));
  }, []);

  const deleteRecurringHandler = useCallback((id: string) => {
    setRecurringTransactions(storage.deleteRecurringTransaction(id));
  }, []);

  const updateSettingsHandler = useCallback((updates: Partial<UserSettings>) => {
    const updated = { ...settings, ...updates };
    storage.saveSettings(updated);
    setSettings(updated);
  }, [settings]);

  return (
    <FinanceContext.Provider
      value={{
        transactions, categories, financialGoals, savingsGoals, settings, currentMonth, setCurrentMonth,
        monthlyStats, incomeSources, wallets, walletTransactions, recurringTransactions,
        addTransaction: addTransactionHandler, updateTransaction: updateTransactionHandler, deleteTransaction: deleteTransactionHandler,
        addCategory: addCategoryHandler, updateCategory: updateCategoryHandler, deleteCategory: deleteCategoryHandler, getCategoryById,
        addFinancialGoal: addFinancialGoalHandler, updateFinancialGoal: updateFinancialGoalHandler, deleteFinancialGoal: deleteFinancialGoalHandler,
        addSavingsGoal: addSavingsGoalHandler, updateSavingsGoal: updateSavingsGoalHandler, deleteSavingsGoal: deleteSavingsGoalHandler,
        addIncomeSource: addIncomeSourceHandler, updateIncomeSource: updateIncomeSourceHandler, deleteIncomeSource: deleteIncomeSourceHandler,
        addWallet: addWalletHandler, updateWallet: updateWalletHandler, deleteWallet: deleteWalletHandler,
        addWalletTransaction: addWalletTransactionHandler,
        addRecurring: addRecurringHandler, updateRecurring: updateRecurringHandler, deleteRecurring: deleteRecurringHandler,
        updateSettings: updateSettingsHandler, formatCurrency, refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
