import { useFinance } from '@/context/FinanceContext';
import { SummaryCard } from '@/components/finance/SummaryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { parseISO, format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Investments() {
  const { transactions, formatCurrency } = useFinance();

  // Get last 6 months data
  const monthsData = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    
    const monthTransactions = transactions.filter(t => {
      const tDate = parseISO(t.date);
      return t.type === 'investment' && isWithinInterval(tDate, { start, end });
    });
    
    const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      month: format(date, 'MMM', { locale: ptBR }),
      aportes: total,
    };
  });

  // Calculate totals
  const totalInvestments = transactions
    .filter(t => t.type === 'investment')
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthInvestments = transactions
    .filter(t => {
      const date = parseISO(t.date);
      return t.type === 'investment' && isWithinInterval(date, {
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
      });
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthInvestments = transactions
    .filter(t => {
      const date = parseISO(t.date);
      const lastMonth = subMonths(new Date(), 1);
      return t.type === 'investment' && isWithinInterval(date, {
        start: startOfMonth(lastMonth),
        end: endOfMonth(lastMonth),
      });
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const changePercentage = lastMonthInvestments > 0
    ? ((thisMonthInvestments - lastMonthInvestments) / lastMonthInvestments) * 100
    : 0;

  return (
    <div className="safe-top safe-bottom min-h-full p-4 pb-24 lg:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Investimentos</h1>
        <p className="text-muted-foreground">Acompanhe seus aportes</p>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Investido"
          value={formatCurrency(totalInvestments)}
          icon={Wallet}
          variant="investment"
        />
        <SummaryCard
          title="Este Mês"
          value={formatCurrency(thisMonthInvestments)}
          icon={TrendingUp}
          variant="profit"
        />
        <SummaryCard
          title="Variação Mensal"
          value={`${changePercentage >= 0 ? '+' : ''}${changePercentage.toFixed(1)}%`}
          icon={changePercentage >= 0 ? TrendingUp : TrendingDown}
          variant={changePercentage >= 0 ? 'income' : 'expense'}
          subtitle="vs mês anterior"
        />
      </div>

      {/* Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Aportes nos Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent>
          {totalInvestments > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Aportes']}
                  />
                  <Bar 
                    dataKey="aportes" 
                    fill="hsl(var(--investment))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-muted-foreground">
              <p className="text-center">
                Nenhum investimento registrado ainda.<br />
                Adicione transações do tipo "Investimento".
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Investment Transactions */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Últimos Aportes</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.filter(t => t.type === 'investment').length > 0 ? (
            <div className="space-y-3">
              {transactions
                .filter(t => t.type === 'investment')
                .slice(0, 5)
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg bg-muted p-4"
                  >
                    <div>
                      <p className="font-semibold">{transaction.description || 'Investimento'}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(transaction.date), "d 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-investment">
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Nenhum aporte registrado
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
