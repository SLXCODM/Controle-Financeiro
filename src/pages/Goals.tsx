import { useState } from 'react';
import { Plus, Trash2, AlertTriangle, Check } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { DynamicIcon } from '@/components/finance/DynamicIcon';
import { CurrencyInput } from '@/components/finance/CurrencyInput';
import { ConfirmDialog } from '@/components/finance/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function Goals() {
  const {
    financialGoals, categories, transactions, currentMonth,
    addFinancialGoal, deleteFinancialGoal, formatCurrency,
  } = useFinance();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ categoryId: '', monthlyLimit: '' });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const monthDate = parseISO(`${currentMonth}-01`);
  const start = startOfMonth(monthDate);
  const end = endOfMonth(monthDate);

  const expensesByCategory = transactions
    .filter(t => {
      const date = parseISO(t.date);
      return t.type === 'expense' && isWithinInterval(date, { start, end });
    })
    .reduce((acc, t) => {
      acc[t.categoryId] = (acc[t.categoryId] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const categoriesWithGoals = financialGoals.map(g => g.categoryId);
  const availableCategories = expenseCategories.filter(c => !categoriesWithGoals.includes(c.id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.monthlyLimit) return;
    addFinancialGoal({
      categoryId: formData.categoryId,
      monthlyLimit: parseFloat(formData.monthlyLimit),
      month: currentMonth,
    });
    setFormData({ categoryId: '', monthlyLimit: '' });
    setDialogOpen(false);
  };

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas de Gastos</h1>
          <p className="text-muted-foreground">Defina limites por categoria</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} disabled={availableCategories.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Meta
        </Button>
      </div>

      {financialGoals.length > 0 ? (
        <div className="space-y-4">
          {financialGoals.map((goal) => {
            const category = categories.find(c => c.id === goal.categoryId);
            const spent = expensesByCategory[goal.categoryId] || 0;
            const percentage = Math.min((spent / goal.monthlyLimit) * 100, 100);
            const isOverBudget = spent > goal.monthlyLimit;
            const isNearLimit = percentage >= 80 && !isOverBudget;

            return (
              <Card key={goal.id} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${category?.color}20` }}
                      >
                        <DynamicIcon name={category?.icon || 'CircleDot'} className="h-6 w-6" style={{ color: category?.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{category?.name}</h3>
                        <p className="text-sm text-muted-foreground">Limite: {formatCurrency(goal.monthlyLimit)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverBudget && (
                        <div className="flex items-center gap-1 rounded-lg bg-destructive/20 px-2 py-1 text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4" /> Excedido
                        </div>
                      )}
                      {isNearLimit && (
                        <div className="flex items-center gap-1 rounded-lg bg-yellow-500/20 px-2 py-1 text-sm text-yellow-500">
                          <AlertTriangle className="h-4 w-4" /> Atenção
                        </div>
                      )}
                      {!isOverBudget && !isNearLimit && (
                        <div className="flex items-center gap-1 rounded-lg bg-income/20 px-2 py-1 text-sm text-income">
                          <Check className="h-4 w-4" /> OK
                        </div>
                      )}
                      <Button
                        variant="ghost" size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(goal.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className={cn(isOverBudget ? 'text-destructive' : 'text-muted-foreground')}>
                        Gasto: {formatCurrency(spent)}
                      </span>
                      <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress
                      value={percentage}
                      className={cn('h-3', isOverBudget && '[&>div]:bg-destructive', isNearLimit && '[&>div]:bg-yellow-500')}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Nenhuma meta definida ainda</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta de Gastos</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <DynamicIcon name={cat.icon} className="h-4 w-4" style={{ color: cat.color }} />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Limite Mensal</Label>
              <CurrencyInput
                value={formData.monthlyLimit}
                onChange={(val) => setFormData({ ...formData, monthlyLimit: val })}
                required
              />
            </div>

            <Button type="submit" className="w-full">Criar Meta</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteFinancialGoal(deleteId); setDeleteId(null); } }}
        title="Remover meta?"
        description="Deseja remover esta meta de gastos?"
      />
    </div>
  );
}
