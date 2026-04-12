import { useFinance } from '@/context/FinanceContext';
import { DynamicIcon } from './DynamicIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export function IncomeBreakdownChart() {
  const { monthlyStats, categories, formatCurrency } = useFinance();
  
  const incomeBreakdown = monthlyStats.incomeBreakdown || [];
  
  const chartData = incomeBreakdown.map((item) => {
    const category = categories.find(c => c.id === item.categoryId);
    return {
      name: category?.name || 'Outros',
      value: item.amount,
      color: category?.color || '#94A3B8',
      icon: category?.icon || 'Plus',
      percentage: item.percentage,
    };
  });

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <p className="text-muted-foreground">Nenhuma entrada registrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="space-y-2">
        {chartData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <DynamicIcon
                  name={item.icon}
                  className="h-4 w-4"
                  style={{ color: item.color }}
                />
              </div>
              <span className="font-medium">{item.name}</span>
            </div>
            <div className="text-right">
              <p className="font-semibold text-income">{formatCurrency(item.value)}</p>
              <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
