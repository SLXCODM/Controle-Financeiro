import { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { useFinance } from '@/context/FinanceContext';
import { DynamicIcon } from '@/components/finance/DynamicIcon';
import { ConfirmDialog } from '@/components/finance/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { TransactionType, Category } from '@/types/finance';
import { cn } from '@/lib/utils';

const ICON_OPTIONS = [
  'Briefcase', 'Laptop', 'TrendingUp', 'Plus', 'Utensils', 'Car', 'Home', 'Heart',
  'GraduationCap', 'Gamepad2', 'ShoppingBag', 'Receipt', 'Coffee', 'Plane', 'Gift',
  'Phone', 'Wifi', 'Tv', 'Music', 'Book', 'Dumbbell', 'Pill', 'Scissors', 'Sparkles',
];

const COLOR_OPTIONS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#10B981', '#14B8A6',
  '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E', '#64748B',
];

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, transactions } = useFinance();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasTransactions: boolean } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '', icon: 'CircleDot', color: '#6A0DAD', type: 'expense' as TransactionType,
  });

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');
  const investmentCategories = categories.filter(c => c.type === 'investment');

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: 'CircleDot', color: '#6A0DAD', type: 'expense' });
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, icon: category.icon, color: category.color, type: category.type });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (editingCategory) { updateCategory(editingCategory.id, formData); }
    else { addCategory(formData); }
    setDialogOpen(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    const hasTransactions = transactions.some(t => t.categoryId === id);
    if (hasTransactions) {
      alert('Esta categoria possui transações associadas e não pode ser excluída.');
      return;
    }
    setDeleteTarget({ id, name, hasTransactions: false });
  };

  const CategorySection = ({ title, items, color }: { title: string; items: Category[]; color: string }) => (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className={`h-3 w-3 rounded-full ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((category) => {
            const count = transactions.filter(t => t.categoryId === category.id).length;
            return (
              <div key={category.id} className="group flex items-center gap-3 rounded-xl bg-muted p-4 transition-all hover:bg-muted/80">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${category.color}20` }}>
                  <DynamicIcon name={category.icon} className="h-5 w-5" style={{ color: category.color }} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-sm text-muted-foreground">{count} transação{count !== 1 ? 'ões' : ''}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(category)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(category.id, category.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorias</h1>
          <p className="text-muted-foreground">Organize suas transações</p>
        </div>
        <Button onClick={openAddDialog}><Plus className="mr-2 h-4 w-4" />Nova</Button>
      </div>

      <div className="space-y-6">
        <CategorySection title="Receitas" items={incomeCategories} color="bg-income" />
        <CategorySection title="Despesas" items={expenseCategories} color="bg-expense" />
        <CategorySection title="Investimentos" items={investmentCategories} color="bg-investment" />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Alimentação" required />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(value: TransactionType) => setFormData({ ...formData, type: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="investment">Investimento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-8 gap-2">
                {ICON_OPTIONS.map((icon) => (
                  <button key={icon} type="button" onClick={() => setFormData({ ...formData, icon })}
                    className={cn('flex h-10 w-10 items-center justify-center rounded-lg transition-all', formData.icon === icon ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80')}>
                    <DynamicIcon name={icon} className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button key={color} type="button" onClick={() => setFormData({ ...formData, color })}
                    className={cn('h-8 w-8 rounded-full transition-all', formData.color === color && 'ring-2 ring-white ring-offset-2 ring-offset-background')}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <Label className="mb-2 block text-sm">Prévia</Label>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${formData.color}20` }}>
                  <DynamicIcon name={formData.icon} className="h-5 w-5" style={{ color: formData.color }} />
                </div>
                <span className="font-semibold">{formData.name || 'Nome da categoria'}</span>
              </div>
            </div>
            <Button type="submit" className="w-full">{editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { deleteCategory(deleteTarget.id); setDeleteTarget(null); } }}
        title="Remover categoria?"
        description={`Deseja remover "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
