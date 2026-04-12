import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useFinance } from '@/context/FinanceContext';

export function ExpenseChart() {
  const { monthlyStats, categories, formatCurrency } = useFinance();
  
  const data = monthlyStats.categoryBreakdown.slice(0, 6).map(item => {
    const category = categories.find(c => c.id === item.categoryId);
    return {
      name: category?.name || 'Outros',
      value: item.amount,
      color: category?.color || '#6A0DAD',
      percentage: item.percentage,
    };
  });
  
  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        <p className="text-center text-sm">
          Nenhuma despesa registrada<br />neste mês
        </p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-[180px] w-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg bg-popover px-3 py-2 shadow-lg">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-2 sm:flex-col sm:gap-1.5">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-sm text-muted-foreground">
              {item.name} ({item.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
