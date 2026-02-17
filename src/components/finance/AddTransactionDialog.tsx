import { useState, useCallback } from 'react';
import { useFinance } from '@/context/FinanceContext';
import { TransactionType } from '@/types/finance';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DynamicIcon } from './DynamicIcon';
import { CurrencyInput } from './CurrencyInput';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { showRewardedAd } from '@/lib/admob';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const transactionTypes: { value: TransactionType; label: string; color: string }[] = [
  { value: 'income', label: 'Entrada', color: 'bg-income' },
  { value: 'expense', label: 'Saída', color: 'bg-expense' },
  { value: 'investment', label: 'Investimento', color: 'bg-investment' },
];

export function AddTransactionDialog({ open, onOpenChange }: AddTransactionDialogProps) {
  const { categories, savingsGoals, addTransaction, formatCurrency } = useFinance();
  
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Savings goal linking (only for income)
  const [linkToGoal, setLinkToGoal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [goalContribution, setGoalContribution] = useState('');
  
  const filteredCategories = categories.filter(c => c.type === type);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !categoryId) return;
    
    const parsedAmount = parseFloat(amount);
    const parsedContribution = linkToGoal && goalContribution ? parseFloat(goalContribution) : 0;
    
    if (parsedContribution > parsedAmount) {
      alert('A contribuição para a meta não pode ser maior que o valor da entrada');
      return;
    }
    
    addTransaction({
      amount: parsedAmount,
      type,
      categoryId,
      description,
      date,
      savingsGoalId: linkToGoal && selectedGoalId ? selectedGoalId : undefined,
      savingsContribution: parsedContribution > 0 ? parsedContribution : undefined,
    });
    
    // Reset form
    setAmount('');
    setCategoryId('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setLinkToGoal(false);
    setSelectedGoalId('');
    setGoalContribution('');
    onOpenChange(false);

    // Show rewarded ad after completing transaction
    showRewardedAd();
  };

  const selectedGoal = savingsGoals.find(g => g.id === selectedGoalId);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Nova Transação</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Type selector */}
          <div className="flex gap-2">
            {transactionTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setType(t.value);
                  setCategoryId('');
                  if (t.value !== 'income') {
                    setLinkToGoal(false);
                    setSelectedGoalId('');
                    setGoalContribution('');
                  }
                }}
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
          
          {/* Amount with currency formatting */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              required
            />
          </div>
          
          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded"
                        style={{ backgroundColor: `${cat.color}20` }}
                      >
                        <DynamicIcon
                          name={cat.icon}
                          className="h-4 w-4"
                          style={{ color: cat.color }}
                        />
                      </div>
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Link to Savings Goal (only for income) */}
          {type === 'income' && savingsGoals.length > 0 && (
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="linkGoal"
                  checked={linkToGoal}
                  onCheckedChange={(checked) => {
                    setLinkToGoal(checked === true);
                    if (!checked) {
                      setSelectedGoalId('');
                      setGoalContribution('');
                    }
                  }}
                />
                <Label htmlFor="linkGoal" className="flex items-center gap-2 font-medium">
                  <Target className="h-4 w-4 text-primary" />
                  Vincular a uma meta de poupança
                </Label>
              </div>
              
              {linkToGoal && (
                <>
                  <div className="space-y-2">
                    <Label>Selecionar Meta</Label>
                    <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha uma meta" />
                      </SelectTrigger>
                      <SelectContent>
                        {savingsGoals.map((goal) => (
                          <SelectItem key={goal.id} value={goal.id}>
                            <div className="flex items-center justify-between gap-4">
                              <span>{goal.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedGoalId && (
                    <div className="space-y-2">
                      <Label htmlFor="goalContribution">
                        Quanto dessa entrada vai para a meta?
                      </Label>
                      <CurrencyInput
                        id="goalContribution"
                        value={goalContribution}
                        onChange={setGoalContribution}
                        placeholder="0,00"
                      />
                      {selectedGoal && (
                        <p className="text-xs text-muted-foreground">
                          Faltam {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount)} para completar "{selectedGoal.name}"
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              placeholder="Ex: Almoço no restaurante"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          {/* Submit */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary-light"
            disabled={!amount || !categoryId}
          >
            Adicionar Transação
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
