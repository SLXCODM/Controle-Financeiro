import { useState } from 'react';
import { Plus, Repeat, Trash2, Pause, Play } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DynamicIcon } from '@/components/finance/DynamicIcon';
import { CurrencyInput } from '@/components/finance/CurrencyInput';
import { TransactionType } from '@/types/finance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const transactionTypes: { value: TransactionType; label: string; color: string }[] = [
  { value: 'income', label: 'Entrada', color: 'bg-income' },
  { value: 'expense', label: 'Saída', color: 'bg-expense' },
  { value: 'investment', label: 'Investimento', color: 'bg-investment' },
];

export default function RecurringTransactions() {
  const { categories, recurringTransactions, addRecurring, updateRecurring, deleteRecurring, formatCurrency } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');

  const filteredCategories = categories.filter(c => c.type === type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    addRecurring({
      amount: parseFloat(amount),
      type,
      categoryId,
      description,
      dayOfMonth: Math.min(Math.max(parseInt(dayOfMonth) || 1, 1), 28),
      isActive: true,
    });

    setAmount('');
    setCategoryId('');
    setDescription('');
    setDayOfMonth('1');
    setDialogOpen(false);
  };

  const toggleActive = (id: string, isActive: boolean) => {
    updateRecurring(id, { isActive: !isActive });
  };

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transações Recorrentes</h1>
        <p className="text-muted-foreground">Contas fixas mensais automáticas</p>
      </div>

      {recurringTransactions.length > 0 ? (
        <div className="space-y-3">
          {recurringTransactions.map((item) => {
            const cat = categories.find(c => c.id === item.categoryId);
            const typeLabel = item.type === 'income' ? 'Entrada' : item.type === 'expense' ? 'Saída' : 'Investimento';
            return (
              <Card key={item.id} className={cn('border-border bg-card', !item.isActive && 'opacity-50')}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${cat?.color || '#94A3B8'}20` }}
                    >
                      <DynamicIcon
                        name={cat?.icon || 'Repeat'}
                        className="h-5 w-5"
                        style={{ color: cat?.color || '#94A3B8' }}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{item.description || cat?.name || 'Sem descrição'}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeLabel} · Dia {item.dayOfMonth} de cada mês
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'font-bold',
                      item.type === 'income' ? 'text-income' : item.type === 'expense' ? 'text-expense' : 'text-investment'
                    )}>
                      {formatCurrency(item.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleActive(item.id, item.isActive)}
                      title={item.isActive ? 'Pausar' : 'Ativar'}
                    >
                      {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteRecurring(item.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Repeat className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhuma transação recorrente cadastrada</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Recorrente
          </Button>
        </div>
      )}

      {/* FAB */}
      <Button
        className="fab fixed bottom-6 right-6 h-14 w-14 rounded-full p-0 lg:bottom-8 lg:right-8"
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="h-6 w-6" />
      </Button>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Transação Recorrente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type */}
            <div className="flex gap-2">
              {transactionTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => { setType(t.value); setCategoryId(''); }}
                  className={cn(
                    'flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all',
                    type === t.value
                      ? `${t.color} text-white shadow-lg`
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Valor Mensal</Label>
              <CurrencyInput value={amount} onChange={setAmount} required />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <DynamicIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Internet, Aluguel..." />
            </div>

            <div className="space-y-2">
              <Label>Dia do Mês (1-28)</Label>
              <Input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} />
            </div>

            <Button type="submit" className="w-full" disabled={!amount || !categoryId}>
              Adicionar Recorrente
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
