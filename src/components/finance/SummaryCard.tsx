import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  variant: 'income' | 'expense' | 'profit' | 'investment';
  subtitle?: string;
}

const variantStyles = {
  income: 'summary-card-income',
  expense: 'summary-card-expense',
  profit: 'summary-card-profit',
  investment: 'bg-gradient-to-br from-investment to-blue-600 shadow-[0_4px_20px_-4px_hsl(217_91%_60%/0.3)]',
};

export function SummaryCard({ title, value, icon: Icon, variant, subtitle }: SummaryCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 text-white',
        'transition-all duration-300 hover:scale-[1.02]',
        'animate-slide-up',
        variantStyles[variant]
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-black/10 blur-xl" />
      
      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium opacity-90">{title}</span>
          <div className="rounded-lg bg-white/20 p-2">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        
        <p className="truncate text-xl font-bold tracking-tight sm:text-2xl">{value}</p>
        
        {subtitle && (
          <p className="mt-1 text-xs font-medium opacity-75">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
