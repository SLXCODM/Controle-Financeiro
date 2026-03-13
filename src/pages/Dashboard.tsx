import { useState } from 'react';
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { SummaryCard } from '@/components/finance/SummaryCard';
import { MonthSelector } from '@/components/finance/MonthSelector';
import { ExpenseChart } from '@/components/finance/ExpenseChart';
import { IncomeBreakdownChart } from '@/components/finance/IncomeBreakdownChart';
import { TransactionItem } from '@/components/finance/TransactionItem';
import { AddTransactionDialog } from '@/components/finance/AddTransactionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function Dashboard() {
  const { transactions, categories, monthlyStats, formatCurrency, currentMonth } = useFinance();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Get recent transactions for current month
  const monthDate = parseISO(`${currentMonth}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);
  
  const recentTransactions = transactions
    .filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start, end });
    })
    .slice(0, 5);

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      {/* Month Selector */}
      <div className="mb-6">
        <MonthSelector />
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Entradas"
          value={formatCurrency(monthlyStats.totalIncome)}
          icon={TrendingUp}
          variant="income"
        />
        <SummaryCard
          title="Saídas"
          value={formatCurrency(monthlyStats.totalExpenses)}
          icon={TrendingDown}
          variant="expense"
        />
        <SummaryCard
          title="Lucro Líquido"
          value={formatCurrency(monthlyStats.netProfit)}
          icon={Wallet}
          variant="profit"
          subtitle={monthlyStats.netProfit >= 0 ? 'Positivo' : 'Negativo'}
        />
      </div>

      {/* Charts Section */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Income Breakdown Chart - Where you earned more */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-income">De Onde Veio Seu Lucro</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeBreakdownChart />
          </CardContent>
        </Card>

        {/* Expense Chart */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg text-expense">Onde Você Gastou Mais</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseChart />
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <Card className="mb-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Mês</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <span className="text-muted-foreground">Total de Transações</span>
            <span className="text-xl font-bold">{recentTransactions.length}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <span className="text-muted-foreground">Investimentos</span>
            <span className="text-xl font-bold text-investment">
              {formatCurrency(monthlyStats.totalInvestments)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-muted p-4">
            <span className="text-muted-foreground">Taxa de Economia</span>
            <span className="text-xl font-bold text-primary">
              {monthlyStats.totalIncome > 0
                ? ((monthlyStats.netProfit / monthlyStats.totalIncome) * 100).toFixed(1)
                : 0}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Transações Recentes</CardTitle>
          <Link to="/transactions">
            <Button variant="ghost" size="sm" className="text-primary">
              Ver Todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  category={categories.find(c => c.id === transaction.categoryId)}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma transação registrada neste mês
              </p>
              <Button
                className="mt-4"
                onClick={() => setAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Transação
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <Button
        className="fab fixed bottom-6 right-6 h-14 w-14 rounded-full p-0 lg:bottom-8 lg:right-8"
        onClick={() => setAddDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
    </div>
  );
}
