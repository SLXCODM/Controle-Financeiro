import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Transaction, Category, FinancialGoal, SavingsGoal,
  UserSettings, MonthlyStats, IncomeSource, Wallet,
  WalletTransaction, RecurringTransaction,
} from '@/types/finance';
import * as db from '@/lib/supabaseStorage';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from '@/hooks/use-toast';

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
  addRecurring: (item: Omit<RecurringTransaction, 'id' | 'createdAt'>) => void;
  updateRecurring: (id: string, updates: Partial<RecurringTransaction>) => void;
  deleteRecurring: (id: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  formatCurrency: (value: number) => string;
  refreshData: () => void;
}

const generateId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [financialGoals, setFinancialGoals] = useState<FinancialGoal[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ displayName: 'Usuário', currency: 'BRL', privacyMode: false });
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  const refreshData = useCallback(async () => {
    if (!user) return;
    try {
      await db.processRecurringTransactions(user.id);
      const [t, c, fg, sg, s, is, w, wt, rt] = await Promise.all([
        db.getTransactions(),
        db.getCategories(user.id),
        db.getFinancialGoals(),
        db.getSavingsGoals(),
        db.getUserSettings(),
        db.getIncomeSources(),
        db.getWallets(user.id),
        db.getWalletTransactions(),
        db.getRecurringTransactions(),
      ]);
      setTransactions(t);
      setCategories(c);
      setFinancialGoals(fg);
      setSavingsGoals(sg);
      setSettings(s);
      setIncomeSources(is);
      setWallets(w);
      setWalletTransactions(wt);
      setRecurringTransactions(rt);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshData();
  }, [user, refreshData]);

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
  const addTransactionHandler = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const transaction: Transaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
      await db.addTransaction(transaction, user.id);

      // Savings goal contribution
      if (data.savingsGoalId && data.savingsContribution && data.savingsContribution > 0) {
        const goal = savingsGoals.find(g => g.id === data.savingsGoalId);
        if (goal) {
          await db.updateSavingsGoal(data.savingsGoalId, { currentAmount: goal.currentAmount + data.savingsContribution });
        }
      }

      // Auto-distribute income to wallets based on income sources
      if (data.type === 'income') {
        const category = categories.find(c => c.id === data.categoryId);
        if (category) {
          const matchedSource = incomeSources.find(
            s => s.name.toLowerCase().trim() === category.name.toLowerCase().trim()
          );
          if (matchedSource && matchedSource.distributions.length > 0) {
            for (const dist of matchedSource.distributions) {
              if (dist.percentage > 0) {
                const creditAmount = (data.amount * dist.percentage) / 100;
                const walletTx: WalletTransaction = {
                  id: generateId(),
                  walletId: dist.walletId,
                  amount: creditAmount,
                  type: 'credit',
                  description: `${category.name} - distribuição automática`,
                  date: data.date,
                  linkedTransactionId: transaction.id,
                };
                await db.addWalletTransaction(walletTx, user.id);
                const wallet = wallets.find(w => w.id === dist.walletId);
                if (wallet) {
                  await db.updateWallet(dist.walletId, { balance: wallet.balance + creditAmount });
                }
              }
            }
          }
        }
      }

      // Auto-debit from wallet when expense matches a wallet name
      if (data.type === 'expense') {
        const category = categories.find(c => c.id === data.categoryId);
        if (category) {
          const matchedWallet = wallets.find(
            w => w.name.toLowerCase().trim() === category.name.toLowerCase().trim()
          );
          if (matchedWallet) {
            const walletTx: WalletTransaction = {
              id: generateId(),
              walletId: matchedWallet.id,
              amount: data.amount,
              type: 'debit',
              description: `${data.description || category.name} - saída`,
              date: data.date,
              linkedTransactionId: transaction.id,
            };
            await db.addWalletTransaction(walletTx, user.id);
            await db.updateWallet(matchedWallet.id, { balance: matchedWallet.balance - data.amount });
          }
        }
      }

      refreshData();
    } catch (error: any) {
      console.error('Erro de Matemática/Persistência:', error);
      toast({
        title: 'Erro de Banco de Dados',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [user, savingsGoals, categories, incomeSources, wallets, refreshData]);

  const updateTransactionHandler = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      await db.updateTransaction(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteTransactionHandler = useCallback(async (id: string) => {
    if (!user) return;
    try {
      // Find the transaction being deleted to reverse wallet distributions
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        // Find all wallet transactions linked to this transaction
        const linkedWalletTxs = walletTransactions.filter(wt => wt.linkedTransactionId === id);
        
        for (const wt of linkedWalletTxs) {
          // Reverse the balance change
          const wallet = wallets.find(w => w.id === wt.walletId);
          if (wallet) {
            const reverseAmount = wt.type === 'credit' 
              ? wallet.balance - wt.amount 
              : wallet.balance + wt.amount;
            await db.updateWallet(wt.walletId, { balance: reverseAmount });
          }
          // Delete the wallet transaction
          await db.deleteWalletTransaction(wt.id);
        }

        // Reverse savings goal contribution
        if (transaction.savingsGoalId && transaction.savingsContribution && transaction.savingsContribution > 0) {
          const goal = savingsGoals.find(g => g.id === transaction.savingsGoalId);
          if (goal) {
            await db.updateSavingsGoal(transaction.savingsGoalId, {
              currentAmount: Math.max(0, goal.currentAmount - transaction.savingsContribution),
            });
          }
        }
      }
      
      await db.deleteTransaction(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, transactions, walletTransactions, wallets, savingsGoals, refreshData]);

  const addCategoryHandler = useCallback(async (data: Omit<Category, 'id'>) => {
    if (!user) return;
    try {
      await db.addCategory({ ...data, id: generateId() }, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const updateCategoryHandler = useCallback(async (id: string, updates: Partial<Category>) => {
    try {
      await db.updateCategory(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteCategoryHandler = useCallback(async (id: string) => {
    try {
      await db.deleteCategory(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const addFinancialGoalHandler = useCallback(async (data: Omit<FinancialGoal, 'id'>) => {
    if (!user) return;
    try {
      await db.addFinancialGoal({ ...data, id: generateId() }, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const updateFinancialGoalHandler = useCallback(async (id: string, updates: Partial<FinancialGoal>) => {
    try {
      await db.updateFinancialGoal(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteFinancialGoalHandler = useCallback(async (id: string) => {
    try {
      await db.deleteFinancialGoal(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const addSavingsGoalHandler = useCallback(async (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      await db.addSavingsGoal({ ...data, id: generateId(), createdAt: new Date().toISOString() }, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const updateSavingsGoalHandler = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    try {
      await db.updateSavingsGoal(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteSavingsGoalHandler = useCallback(async (id: string) => {
    try {
      await db.deleteSavingsGoal(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const addIncomeSourceHandler = useCallback(async (data: Omit<IncomeSource, 'id'>) => {
    if (!user) return;
    try {
      await db.addIncomeSource({ ...data, id: generateId() }, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const updateIncomeSourceHandler = useCallback(async (id: string, updates: Partial<IncomeSource>) => {
    try {
      await db.updateIncomeSource(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteIncomeSourceHandler = useCallback(async (id: string) => {
    try {
      await db.deleteIncomeSource(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const addWalletHandler = useCallback(async (data: Omit<Wallet, 'id'>) => {
    if (!user) return;
    try {
      await db.addWallet({ ...data, id: generateId() }, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const updateWalletHandler = useCallback(async (id: string, updates: Partial<Wallet>) => {
    try {
      await db.updateWallet(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteWalletHandler = useCallback(async (id: string) => {
    try {
      await db.deleteWallet(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const addWalletTransactionHandler = useCallback(async (data: Omit<WalletTransaction, 'id'>) => {
    if (!user) return;
    try {
      await db.addWalletTransaction({ ...data, id: generateId() }, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const addRecurringHandler = useCallback(async (data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    if (!user) return;
    try {
      const item: RecurringTransaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
      await db.addRecurringTransaction(item, user.id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [user, refreshData]);

  const updateRecurringHandler = useCallback(async (id: string, updates: Partial<RecurringTransaction>) => {
    try {
      await db.updateRecurringTransaction(id, updates);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const deleteRecurringHandler = useCallback(async (id: string) => {
    try {
      await db.deleteRecurringTransaction(id);
      refreshData();
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
  }, [refreshData]);

  const updateSettingsHandler = useCallback(async (updates: Partial<UserSettings>) => {
    try {
      const updated = { ...settings, ...updates };
      setSettings(updated);
      await db.updateUserSettings(updates);
    } catch (error: any) {
      toast({ title: 'Erro de Banco de Dados', description: error.message, variant: 'destructive' });
    }
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
  if (!context) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}
