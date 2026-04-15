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
    // Carrega dados mesmo se o usuário estiver offline ou deslogado inicialmente
    try {
      if (user) {
        await db.processRecurringTransactions(user.id);
      }
      
      const [t, c, fg, sg, s, is, w, wt, rt] = await Promise.all([
        db.getTransactions(),
        db.getCategories(user?.id || ''),
        db.getFinancialGoals(),
        db.getSavingsGoals(),
        db.getUserSettings(),
        db.getIncomeSources(),
        db.getWallets(user?.id || ''),
        db.getWalletTransactions(),
        db.getRecurringTransactions(),
      ]);

      setTransactions(t || []);
      setCategories(c || []);
      setFinancialGoals(fg || []);
      setSavingsGoals(sg || []);
      setSettings(s || { displayName: 'Usuário', currency: 'BRL', privacyMode: false });
      setIncomeSources(is || []);
      setWallets(w || []);
      setWalletTransactions(wt || []);
      setRecurringTransactions(rt || []);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
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

  // Handlers for data actions (add, update, delete)
  const addTransactionHandler = useCallback(async (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const transaction: Transaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
      
      // Salva transação
      await db.addTransaction(transaction, user?.id || '');

      // Recalcula divisões se for receita
      if (data.type === 'income') {
        const category = categories.find(c => c.id === data.categoryId);
        if (category) {
          // Busca fonte de renda pelo nome da categoria (ignorando espaços e case)
          const categoryNameLower = category.name.toLowerCase().trim();
          const matchedSource = incomeSources.find(
            s => s.name.toLowerCase().trim() === categoryNameLower
          );
          
          if (matchedSource && matchedSource.distributions && matchedSource.distributions.length > 0) {
            for (const dist of matchedSource.distributions) {
              const creditAmount = (data.amount * dist.percentage) / 100;
              if (creditAmount <= 0) continue;

              const walletTx: WalletTransaction = {
                id: generateId(),
                walletId: dist.walletId,
                amount: creditAmount,
                type: 'credit',
                description: `${category.name} - distribuição automática`,
                date: data.date,
                linkedTransactionId: transaction.id,
              };
              
              await db.addWalletTransaction(walletTx, user?.id || '');
              
              // Atualiza saldo da carteira
              const wallet = wallets.find(w => w.id === dist.walletId);
              if (wallet) {
                await db.updateWallet(dist.walletId, { 
                  balance: Number(wallet.balance) + creditAmount 
                });
              }
            }
          }
        }
      }
      
      await refreshData();
      toast({ title: 'Sucesso', description: 'Transação salva e divisões aplicadas.' });
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      // Tenta atualizar a UI mesmo em erro para mostrar o que foi salvo localmente
      refreshData();
    }
  }, [user, categories, incomeSources, wallets, refreshData]);

  const updateTransactionHandler = useCallback(async (id: string, updates: Partial<Transaction>) => {
    await db.updateTransaction(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteTransactionHandler = useCallback(async (id: string) => {
    await db.deleteTransaction(id);
    refreshData();
  }, [refreshData]);

  const addCategoryHandler = useCallback(async (data: Omit<Category, 'id'>) => {
    const category: Category = { ...data, id: generateId() };
    await db.addCategory(category, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const updateCategoryHandler = useCallback(async (id: string, updates: Partial<Category>) => {
    await db.updateCategory(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteCategoryHandler = useCallback(async (id: string) => {
    await db.deleteCategory(id);
    refreshData();
  }, [refreshData]);

  const addFinancialGoalHandler = useCallback(async (data: Omit<FinancialGoal, 'id'>) => {
    const goal: FinancialGoal = { ...data, id: generateId() };
    await db.addFinancialGoal(goal, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const updateFinancialGoalHandler = useCallback(async (id: string, updates: Partial<FinancialGoal>) => {
    await db.updateFinancialGoal(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteFinancialGoalHandler = useCallback(async (id: string) => {
    await db.deleteFinancialGoal(id);
    refreshData();
  }, [refreshData]);

  const addSavingsGoalHandler = useCallback(async (data: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
    const goal: SavingsGoal = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.addSavingsGoal(goal, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const updateSavingsGoalHandler = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
    await db.updateSavingsGoal(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteSavingsGoalHandler = useCallback(async (id: string) => {
    await db.deleteSavingsGoal(id);
    refreshData();
  }, [refreshData]);

  const addIncomeSourceHandler = useCallback(async (data: Omit<IncomeSource, 'id'>) => {
    const source: IncomeSource = { ...data, id: generateId() };
    await db.addIncomeSource(source, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const updateIncomeSourceHandler = useCallback(async (id: string, updates: Partial<IncomeSource>) => {
    await db.updateIncomeSource(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteIncomeSourceHandler = useCallback(async (id: string) => {
    await db.deleteIncomeSource(id);
    refreshData();
  }, [refreshData]);

  const addWalletHandler = useCallback(async (data: Omit<Wallet, 'id'>) => {
    const wallet: Wallet = { ...data, id: generateId() };
    await db.addWallet(wallet, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const updateWalletHandler = useCallback(async (id: string, updates: Partial<Wallet>) => {
    await db.updateWallet(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteWalletHandler = useCallback(async (id: string) => {
    await db.deleteWallet(id);
    refreshData();
  }, [refreshData]);

  const addWalletTransactionHandler = useCallback(async (data: Omit<WalletTransaction, 'id'>) => {
    const transaction: WalletTransaction = { ...data, id: generateId() };
    await db.addWalletTransaction(transaction, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const addRecurringHandler = useCallback(async (data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
    const item: RecurringTransaction = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    await db.addRecurringTransaction(item, user?.id || '');
    refreshData();
  }, [user, refreshData]);

  const updateRecurringHandler = useCallback(async (id: string, updates: Partial<RecurringTransaction>) => {
    await db.updateRecurringTransaction(id, updates);
    refreshData();
  }, [refreshData]);

  const deleteRecurringHandler = useCallback(async (id: string) => {
    await db.deleteRecurringTransaction(id);
    refreshData();
  }, [refreshData]);

  const updateSettingsHandler = useCallback(async (newSettings: Partial<UserSettings>) => {
    await db.updateUserSettings(newSettings);
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <FinanceContext.Provider value={{
      transactions, categories, financialGoals, savingsGoals, settings,
      incomeSources, wallets, walletTransactions, recurringTransactions,
      currentMonth, setCurrentMonth, monthlyStats,
      addTransaction: addTransactionHandler,
      updateTransaction: updateTransactionHandler,
      deleteTransaction: deleteTransactionHandler,
      addCategory: addCategoryHandler,
      updateCategory: updateCategoryHandler,
      deleteCategory: deleteCategoryHandler,
      getCategoryById,
      addFinancialGoal: addFinancialGoalHandler,
      updateFinancialGoal: updateFinancialGoalHandler,
      deleteFinancialGoal: deleteFinancialGoalHandler,
      addSavingsGoal: addSavingsGoalHandler,
      updateSavingsGoal: updateSavingsGoalHandler,
      deleteSavingsGoal: deleteSavingsGoalHandler,
      addIncomeSource: addIncomeSourceHandler,
      updateIncomeSource: updateIncomeSourceHandler,
      deleteIncomeSource: deleteIncomeSourceHandler,
      addWallet: addWalletHandler,
      updateWallet: updateWalletHandler,
      deleteWallet: deleteWalletHandler,
      addWalletTransaction: addWalletTransactionHandler,
      addRecurring: addRecurringHandler,
      updateRecurring: updateRecurringHandler,
      deleteRecurring: deleteRecurringHandler,
      updateSettings: updateSettingsHandler,
      formatCurrency,
      refreshData
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
