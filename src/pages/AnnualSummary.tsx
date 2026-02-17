import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet, BarChart3, FileDown } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicIcon } from '@/components/finance/DynamicIcon';
import { parseISO, format, getYear, startOfYear, endOfYear, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { exportAnnualPdf, exportMonthlyPdf } from '@/lib/exportPdf';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AnnualSummary() {
  const { transactions, categories, formatCurrency, settings, monthlyStats, currentMonth } = useFinance();
  const [selectedYear, setSelectedYear] = useState(getYear(new Date()));
  const { toast } = useToast();

  const yearStart = startOfYear(new Date(selectedYear, 0, 1));
  const yearEnd = endOfYear(new Date(selectedYear, 0, 1));

  const yearTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: yearStart, end: yearEnd });
    });
  }, [transactions, yearStart, yearEnd]);

  const annualStats = useMemo(() => {
    const totalIncome = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalInvestments = yearTransactions
      .filter(t => t.type === 'investment')
      .reduce((sum, t) => sum + t.amount, 0);

    const netProfit = totalIncome - totalExpenses - totalInvestments;

    return { totalIncome, totalExpenses, totalInvestments, netProfit };
  }, [yearTransactions]);

  const incomeByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        category: categories.find(c => c.id === categoryId),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearTransactions, categories]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return Object.entries(map)
      .map(([categoryId, amount]) => ({
        categoryId,
        amount,
        category: categories.find(c => c.id === categoryId),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearTransactions, categories]);

  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthStr = format(new Date(selectedYear, i, 1), 'MMM', { locale: ptBR });
      return { month: monthStr, income: 0, expense: 0 };
    });

    yearTransactions.forEach(t => {
      const monthIndex = parseISO(t.date).getMonth();
      if (t.type === 'income') {
        months[monthIndex].income += t.amount;
      } else if (t.type === 'expense') {
        months[monthIndex].expense += t.amount;
      }
    });

    return months;
  }, [yearTransactions, selectedYear]);

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      {/* Header with Year Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Resumo Anual</h1>
          <p className="text-muted-foreground">Visão geral do ano {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[60px] text-center font-semibold">{selectedYear}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSelectedYear(y => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            exportAnnualPdf({
              year: selectedYear,
              transactions,
              categories,
              formatCurrency,
              currency: settings.currency,
            });
            toast({ title: 'PDF exportado!', description: `Relatório anual de ${selectedYear} gerado com sucesso.` });
          }}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Anual (PDF)
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const monthDate = parseISO(`${currentMonth}-01`);
            const mStart = startOfMonth(monthDate);
            const mEnd = endOfMonth(monthDate);
            const monthTransactions = transactions.filter(t => {
              const d = parseISO(t.date);
              return isWithinInterval(d, { start: mStart, end: mEnd });
            });
            exportMonthlyPdf({
              month: currentMonth,
              transactions: monthTransactions,
              categories,
              stats: monthlyStats,
              formatCurrency,
              currency: settings.currency,
            });
            toast({ title: 'PDF exportado!', description: `Relatório mensal gerado com sucesso.` });
          }}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Exportar Mês Atual (PDF)
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="summary-card-income">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">Total Entradas</p>
                <p className="text-2xl font-bold">{formatCurrency(annualStats.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="summary-card-expense">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">Total Saídas</p>
                <p className="text-2xl font-bold">{formatCurrency(annualStats.totalExpenses)}</p>
              </div>
              <TrendingDown className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-investment to-blue-600 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">Investimentos</p>
                <p className="text-2xl font-bold">{formatCurrency(annualStats.totalInvestments)}</p>
              </div>
              <BarChart3 className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="summary-card-profit">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">Lucro Líquido</p>
                <p className="text-2xl font-bold">{formatCurrency(annualStats.netProfit)}</p>
              </div>
              <Wallet className="h-8 w-8 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Entradas vs Saídas por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="income" name="Entradas" fill="hsl(var(--income))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Saídas" fill="hsl(var(--expense))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Income by Category */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-income">Entradas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {incomeByCategory.length > 0 ? (
              <div className="space-y-3">
                {incomeByCategory.map(({ categoryId, amount, category }) => (
                  <div key={categoryId} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${category?.color || '#94A3B8'}20` }}
                      >
                        <DynamicIcon
                          name={category?.icon || 'Plus'}
                          className="h-4 w-4"
                          style={{ color: category?.color || '#94A3B8' }}
                        />
                      </div>
                      <span className="font-medium">{category?.name || 'Outros'}</span>
                    </div>
                    <span className="font-semibold text-income">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">Nenhuma entrada registrada</p>
            )}
          </CardContent>
        </Card>

        {/* Expense by Category */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-expense">Saídas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length > 0 ? (
              <div className="space-y-3">
                {expenseByCategory.map(({ categoryId, amount, category }) => (
                  <div key={categoryId} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${category?.color || '#94A3B8'}20` }}
                      >
                        <DynamicIcon
                          name={category?.icon || 'MoreHorizontal'}
                          className="h-4 w-4"
                          style={{ color: category?.color || '#94A3B8' }}
                        />
                      </div>
                      <span className="font-medium">{category?.name || 'Outros'}</span>
                    </div>
                    <span className="font-semibold text-expense">{formatCurrency(amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-muted-foreground">Nenhuma saída registrada</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
