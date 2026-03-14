import { useState } from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { Transaction, Category } from '@/types/finance';
import { useFinance } from '@/context/FinanceContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from './DynamicIcon';
import { ConfirmDialog } from './ConfirmDialog';

interface TransactionItemProps {
  transaction: Transaction;
  category?: Category;
  onEdit?: (transaction: Transaction) => void;
}

export function TransactionItem({ transaction, category, onEdit }: TransactionItemProps) {
  const { formatCurrency, deleteTransaction } = useFinance();
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const amountClass = {
    income: 'amount-income',
    expense: 'amount-expense',
    investment: 'amount-investment',
  }[transaction.type];
  
  const prefix = transaction.type === 'income' ? '+' : '-';
  
  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl bg-card p-4 transition-all duration-200 hover:bg-card-elevated animate-fade-in">
        {/* Category Icon */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12"
          style={{ backgroundColor: `${category?.color}20` }}
        >
          <DynamicIcon 
            name={category?.icon || 'CircleDot'} 
            className="h-5 w-5 sm:h-6 sm:w-6"
            style={{ color: category?.color }}
          />
        </div>
        
        {/* Details */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground text-sm">
            {transaction.description || category?.name || 'Transação'}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(parseISO(transaction.date), "d 'de' MMM", { locale: ptBR })}
          </p>
        </div>
        
        {/* Amount */}
        <div className="shrink-0 text-right">
          <p className={cn('text-sm font-bold sm:text-base', amountClass)}>
            {prefix} {formatCurrency(transaction.amount)}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex shrink-0 gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(transaction)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => deleteTransaction(transaction.id)}
        title="Remover transação?"
        description={`Deseja remover "${transaction.description || category?.name || 'esta transação'}"?`}
      />
    </>
  );
}
