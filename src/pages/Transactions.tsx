import { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { TransactionItem } from '@/components/finance/TransactionItem';
import { AddTransactionDialog } from '@/components/finance/AddTransactionDialog';
import { MonthSelector } from '@/components/finance/MonthSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Transactions() {
  const { transactions, categories, currentMonth } = useFinance();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions for current month
  const monthDate = parseISO(`${currentMonth}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const filteredTransactions = useMemo(() => 
    transactions
      .filter(t => {
        const date = parseISO(t.date);
        const inMonth = isWithinInterval(date, { start, end });
        if (!inMonth) return false;
        if (searchQuery) {
          const category = categories.find(c => c.id === t.categoryId);
          const searchLower = searchQuery.toLowerCase();
          return t.description.toLowerCase().includes(searchLower) || category?.name.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions, categories, start, end, searchQuery]
  );

  const groupedTransactions = useMemo(() => 
    filteredTransactions.reduce((groups, transaction) => {
      const date = format(parseISO(transaction.date), 'yyyy-MM-dd');
      if (!groups[date]) groups[date] = [];
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, typeof filteredTransactions>),
    [filteredTransactions]
  );

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transações</h1>
        <p className="text-muted-foreground">Gerencie suas receitas e despesas</p>
      </div>

      {/* Month Selector */}
      <div className="mb-4">
        <MonthSelector />
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar transações..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-6">
        {Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
            <div key={date}>
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h3>
              <div className="space-y-2">
                {dayTransactions.map((transaction) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    category={categories.find(c => c.id === transaction.categoryId)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Nenhuma transação encontrada'
                : 'Nenhuma transação neste mês'}
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
      </div>

      {/* FAB - elevated to stay above AdMob banner */}
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
