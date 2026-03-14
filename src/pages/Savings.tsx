import { useState } from 'react';
import { Plus, Trash2, Target, TrendingUp } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { CurrencyInput } from '@/components/finance/CurrencyInput';
import { ConfirmDialog } from '@/components/finance/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { parseISO, differenceInDays } from 'date-fns';

export default function Savings() {
  const { savingsGoals, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, formatCurrency } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) return;
    addSavingsGoal({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      deadline: formData.deadline || undefined,
    });
    setFormData({ name: '', targetAmount: '', deadline: '' });
    setDialogOpen(false);
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !depositAmount) return;
    const goal = savingsGoals.find(g => g.id === selectedGoalId);
    if (goal) {
      updateSavingsGoal(selectedGoalId, { currentAmount: goal.currentAmount + parseFloat(depositAmount) });
    }
    setDepositAmount('');
    setDepositDialogOpen(false);
  };

  const openDepositDialog = (goalId: string) => {
    setSelectedGoalId(goalId);
    setDepositAmount('');
    setDepositDialogOpen(true);
  };

  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.currentAmount, 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas de Poupança</h1>
          <p className="text-muted-foreground">Economize para seus objetivos</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova Meta
        </Button>
      </div>

      {savingsGoals.length > 0 && (
        <Card className="mb-6 summary-card-profit">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">Total Economizado</p>
                <p className="truncate text-xl font-bold sm:text-2xl">{formatCurrency(totalSaved)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-80">Meta Total</p>
                <p className="truncate text-lg font-semibold sm:text-xl">{formatCurrency(totalTarget)}</p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0} className="h-2 bg-white/20 [&>div]:bg-white" />
            </div>
          </CardContent>
        </Card>
      )}

      {savingsGoals.length > 0 ? (
        <div className="space-y-4">
          {savingsGoals.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysLeft = goal.deadline ? differenceInDays(parseISO(goal.deadline), new Date()) : null;

            return (
              <Card key={goal.id} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                        <Target className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-sm text-muted-foreground">
                            {daysLeft !== null && daysLeft > 0 ? `${daysLeft} dias restantes` : daysLeft === 0 ? 'Prazo é hoje!' : 'Prazo expirado'}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(goal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">{formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}</span>
                      <span className="font-semibold text-primary">{percentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Faltam: <span className="font-semibold text-foreground">{formatCurrency(Math.max(0, remaining))}</span>
                    </p>
                    <Button size="sm" variant="outline" onClick={() => openDepositDialog(goal.id)}>
                      <TrendingUp className="mr-2 h-4 w-4" /> Depositar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-border bg-card">
          <CardContent className="py-12 text-center">
            <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma meta de poupança definida</p>
            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Meta de Poupança</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Meta</Label>
              <Input id="name" placeholder="Ex: Viagem de férias" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Valor Alvo</Label>
              <CurrencyInput value={formData.targetAmount} onChange={(val) => setFormData({ ...formData, targetAmount: val })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo (opcional)</Label>
              <Input id="deadline" type="date" value={formData.deadline} onChange={(e) => setFormData({ ...formData, deadline: e.target.value })} />
            </div>
            <Button type="submit" className="w-full">Criar Meta</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={depositDialogOpen} onOpenChange={setDepositDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fazer Depósito</DialogTitle></DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-5">
            <div className="space-y-2">
              <Label>Valor do Depósito</Label>
              <CurrencyInput value={depositAmount} onChange={setDepositAmount} required />
            </div>
            <Button type="submit" className="w-full">Confirmar Depósito</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteSavingsGoal(deleteId); setDeleteId(null); } }}
        title="Remover meta?"
        description="Deseja remover esta meta de poupança?"
      />
    </div>
  );
}
