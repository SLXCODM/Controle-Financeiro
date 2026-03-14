import { useState, useMemo } from 'react';
import { Plus, Trash2, Settings2, Calculator, Palette } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '@/components/finance/ConfirmDialog';
import { PercentageInput } from '@/components/finance/PercentageInput';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DynamicIcon } from '@/components/finance/DynamicIcon';
import { parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Wallet } from '@/types/finance';

const ICON_OPTIONS = [
  'Megaphone', 'Cpu', 'Wallet', 'PiggyBank', 'CreditCard', 'DollarSign',
  'Building', 'Briefcase', 'Target', 'TrendingUp', 'ShoppingBag', 'Gift',
  'Car', 'Home', 'Heart', 'Star', 'Zap', 'Shield'
];

const COLOR_OPTIONS = [
  '#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#EF4444',
  '#F59E0B', '#06B6D4', '#6366F1', '#84CC16', '#14B8A6', '#A855F7'
];

export default function IncomeDistribution() {
  const {
    transactions, categories, incomeSources, wallets, walletTransactions,
    addIncomeSource, updateIncomeSource, deleteIncomeSource,
    addWallet, updateWallet, deleteWallet, formatCurrency, currentMonth,
  } = useFinance();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<string | null>(null);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'wallet' | 'source'; id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    distributions: wallets.map(w => ({ walletId: w.id, percentage: 0 })),
  });
  const [walletFormData, setWalletFormData] = useState({
    name: '', icon: 'Wallet', color: '#10B981',
  });

  const monthDate = parseISO(`${currentMonth}-01`);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const walletStats = useMemo(() => {
    const monthWalletTx = walletTransactions.filter(wt => {
      const date = parseISO(wt.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });
    return wallets.map(wallet => {
      const credits = monthWalletTx.filter(wt => wt.walletId === wallet.id && wt.type === 'credit').reduce((sum, wt) => sum + wt.amount, 0);
      const debits = monthWalletTx.filter(wt => wt.walletId === wallet.id && wt.type === 'debit').reduce((sum, wt) => sum + wt.amount, 0);
      return { ...wallet, monthlyCredits: credits, monthlyDebits: debits, monthlyBalance: credits - debits };
    });
  }, [wallets, walletTransactions, monthStart, monthEnd]);

  const marketingROI = useMemo(() => {
    const monthTx = transactions.filter(t => {
      const date = parseISO(t.date);
      return isWithinInterval(date, { start: monthStart, end: monthEnd });
    });
    const digitalIncomeCategories = categories.filter(c => c.type === 'income' && (c.id.includes('digital') || c.id.includes('streaming')));
    const digitalIncome = monthTx.filter(t => t.type === 'income' && digitalIncomeCategories.some(c => c.id === t.categoryId)).reduce((sum, t) => sum + t.amount, 0);
    const marketingExpenses = monthTx.filter(t => t.type === 'expense' && t.categoryId === 'marketing').reduce((sum, t) => sum + t.amount, 0);
    return { digitalIncome, marketingExpenses, roi: marketingExpenses > 0 ? digitalIncome / marketingExpenses : 0 };
  }, [transactions, categories, monthStart, monthEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const activeDistributions = formData.distributions.filter(d => d.percentage > 0);
    const totalPercentage = activeDistributions.reduce((sum, d) => sum + d.percentage, 0);
    if (totalPercentage !== 100) { alert('As porcentagens devem somar 100%'); return; }
    if (editingSource) {
      updateIncomeSource(editingSource, { name: formData.name, distributions: activeDistributions });
    } else {
      addIncomeSource({ name: formData.name, distributions: activeDistributions });
    }
    resetForm(); setDialogOpen(false);
  };

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletFormData.name) return;
    if (editingWallet) { updateWallet(editingWallet.id, walletFormData); }
    else { addWallet({ ...walletFormData, balance: 0 }); }
    setWalletFormData({ name: '', icon: 'Wallet', color: '#10B981' });
    setEditingWallet(null); setWalletDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({ name: '', distributions: wallets.map(w => ({ walletId: w.id, percentage: 0 })) });
    setEditingSource(null);
  };

  const openEditDialog = (source: typeof incomeSources[0]) => {
    setEditingSource(source.id);
    setFormData({
      name: source.name,
      distributions: wallets.map(w => ({ walletId: w.id, percentage: source.distributions.find(d => d.walletId === w.id)?.percentage || 0 })),
    });
    setDialogOpen(true);
  };

  const openNewSourceDialog = () => {
    resetForm();
    setFormData({ name: '', distributions: wallets.map(w => ({ walletId: w.id, percentage: 0 })) });
    setDialogOpen(true);
  };

  const openEditWalletDialog = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setWalletFormData({ name: wallet.name, icon: wallet.icon, color: wallet.color });
    setWalletDialogOpen(true);
  };

  const openNewWalletDialog = () => {
    setEditingWallet(null);
    setWalletFormData({ name: '', icon: 'Wallet', color: '#10B981' });
    setWalletDialogOpen(true);
  };

  const updateDistribution = (walletId: string, percentage: number) => {
    setFormData(prev => ({
      ...prev,
      distributions: prev.distributions.map(d => d.walletId === walletId ? { ...d, percentage } : d),
    }));
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'wallet') deleteWallet(deleteTarget.id);
    else deleteIncomeSource(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Divisão de Renda</h1>
          <p className="text-muted-foreground">Configure como sua renda é distribuída</p>
        </div>
        <Button onClick={openNewSourceDialog}><Plus className="mr-2 h-4 w-4" />Nova Fonte</Button>
      </div>

      {marketingROI.marketingExpenses > 0 && (
        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Calculator className="h-5 w-5 text-primary" />Retorno do Marketing (ROI)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm text-muted-foreground">Investido em Marketing</p><p className="truncate text-xl font-bold text-expense">{formatCurrency(marketingROI.marketingExpenses)}</p></div>
              <div className="rounded-lg bg-muted/50 p-4"><p className="text-sm text-muted-foreground">Receita Digital</p><p className="truncate text-xl font-bold text-income">{formatCurrency(marketingROI.digitalIncome)}</p></div>
              <div className="rounded-lg bg-primary/20 p-4"><p className="text-sm text-muted-foreground">Multiplicador</p><p className="text-2xl font-bold text-primary">{marketingROI.roi.toFixed(1)}x</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6 border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg"><Palette className="h-5 w-5" />Categorias de Carteira</CardTitle>
          <Button size="sm" onClick={openNewWalletDialog}><Plus className="mr-2 h-4 w-4" />Nova Carteira</Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wallets.map(wallet => (
              <div key={wallet.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${wallet.color}20` }}>
                    <DynamicIcon name={wallet.icon} className="h-5 w-5" style={{ color: wallet.color }} />
                  </div>
                  <span className="font-medium">{wallet.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditWalletDialog(wallet)}><Settings2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget({ type: 'wallet', id: wallet.id, name: wallet.name })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {wallets.length === 0 && <p className="py-4 text-center text-muted-foreground">Nenhuma carteira criada. Crie uma para começar!</p>}
        </CardContent>
      </Card>

      {walletStats.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {walletStats.map(wallet => {
            const usagePercentage = wallet.monthlyCredits > 0 ? (wallet.monthlyDebits / wallet.monthlyCredits) * 100 : 0;
            return (
              <Card key={wallet.id} className="border-border bg-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${wallet.color}20` }}>
                      <DynamicIcon name={wallet.icon} className="h-6 w-6" style={{ color: wallet.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{wallet.name}</h3>
                      <p className="truncate text-sm text-muted-foreground">Recebido: {formatCurrency(wallet.monthlyCredits)}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-muted-foreground">Usado: {formatCurrency(wallet.monthlyDebits)}</span>
                      <span className="font-semibold" style={{ color: wallet.color }}>{usagePercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(usagePercentage, 100)} className="h-2" />
                  </div>
                  <div className="mt-3 flex justify-between rounded-lg bg-muted/50 p-3">
                    <span className="text-sm text-muted-foreground">Saldo Restante</span>
                    <span className="font-bold" style={{ color: wallet.color }}>{formatCurrency(wallet.monthlyBalance)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-lg">Fontes de Renda Configuradas</CardTitle></CardHeader>
        <CardContent>
          {incomeSources.length > 0 ? (
            <div className="space-y-4">
              {incomeSources.map(source => (
                <div key={source.id} className="rounded-lg border border-border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="font-semibold">{source.name}</h4>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(source)}><Settings2 className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteTarget({ type: 'source', id: source.id, name: source.name })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {source.distributions.map(dist => {
                      const wallet = wallets.find(w => w.id === dist.walletId);
                      if (!wallet) return null;
                      return (
                        <div key={dist.walletId} className="flex items-center justify-between rounded-lg bg-muted/50 p-2">
                          <span className="text-sm">{wallet.name}</span>
                          <span className="font-semibold" style={{ color: wallet.color }}>{dist.percentage}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Settings2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma fonte de renda configurada</p>
              <Button className="mt-4" onClick={openNewSourceDialog}><Plus className="mr-2 h-4 w-4" />Criar Primeira Fonte</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Income Source Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSource ? 'Editar Fonte de Renda' : 'Nova Fonte de Renda'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sourceName">Nome da Fonte</Label>
              <Input id="sourceName" placeholder="Ex: Renda Digital" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="space-y-3">
              <Label>Distribuição (%)</Label>
              {wallets.map(wallet => {
                const dist = formData.distributions.find(d => d.walletId === wallet.id);
                return (
                  <div key={wallet.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${wallet.color}20` }}>
                      <DynamicIcon name={wallet.icon} className="h-4 w-4" style={{ color: wallet.color }} />
                    </div>
                    <span className="flex-1 text-sm">{wallet.name}</span>
                    <PercentageInput
                      value={dist?.percentage || 0}
                      onChange={(val) => updateDistribution(wallet.id, val)}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">Total: {formData.distributions.reduce((sum, d) => sum + d.percentage, 0)}% (deve ser 100%)</p>
            </div>
            <Button type="submit" className="w-full">{editingSource ? 'Salvar Alterações' : 'Criar Fonte'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Wallet Dialog */}
      <Dialog open={walletDialogOpen} onOpenChange={setWalletDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingWallet ? 'Editar Carteira' : 'Nova Carteira'}</DialogTitle></DialogHeader>
          <form onSubmit={handleWalletSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="walletName">Nome da Carteira</Label>
              <Input id="walletName" placeholder="Ex: Investimentos" value={walletFormData.name} onChange={(e) => setWalletFormData({ ...walletFormData, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-6 gap-2">
                {ICON_OPTIONS.map(icon => (
                  <button key={icon} type="button" className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-colors ${walletFormData.icon === icon ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`} onClick={() => setWalletFormData({ ...walletFormData, icon })}>
                    <DynamicIcon name={icon} className="h-5 w-5" style={{ color: walletFormData.color }} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="grid grid-cols-6 gap-2">
                {COLOR_OPTIONS.map(color => (
                  <button key={color} type="button" className={`h-10 w-10 rounded-lg border-2 transition-transform hover:scale-110 ${walletFormData.color === color ? 'border-white ring-2 ring-primary' : 'border-transparent'}`} style={{ backgroundColor: color }} onClick={() => setWalletFormData({ ...walletFormData, color })} />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="mb-2 text-sm text-muted-foreground">Prévia:</p>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${walletFormData.color}20` }}>
                  <DynamicIcon name={walletFormData.icon} className="h-6 w-6" style={{ color: walletFormData.color }} />
                </div>
                <span className="font-semibold">{walletFormData.name || 'Nome da Carteira'}</span>
              </div>
            </div>
            <Button type="submit" className="w-full">{editingWallet ? 'Salvar Alterações' : 'Criar Carteira'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={`Remover ${deleteTarget?.type === 'wallet' ? 'carteira' : 'fonte'}?`}
        description={`Deseja remover "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
