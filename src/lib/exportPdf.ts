import { jsPDF } from 'jspdf';
import { Transaction, Category, MonthlyStats } from '@/types/finance';

interface ExportMonthlyPdfParams {
  month: string; // YYYY-MM
  transactions: Transaction[];
  categories: Category[];
  stats: MonthlyStats;
  formatCurrency: (v: number) => string;
  currency: string;
}

interface ExportAnnualPdfParams {
  year: number;
  transactions: Transaction[];
  categories: Category[];
  formatCurrency: (v: number) => string;
  currency: string;
}

function addHeader(pdf: jsPDF, title: string, subtitle: string, y: number): number {
  pdf.setFontSize(20);
  pdf.setTextColor(106, 27, 154); // Purple
  pdf.text(title, 15, y);
  pdf.setFontSize(11);
  pdf.setTextColor(120, 120, 120);
  pdf.text(subtitle, 15, y + 8);
  pdf.setDrawColor(106, 27, 154);
  pdf.setLineWidth(0.5);
  pdf.line(15, y + 12, 195, y + 12);
  return y + 20;
}

function addSectionTitle(pdf: jsPDF, title: string, y: number): number {
  if (y > 260) { pdf.addPage(); y = 20; }
  pdf.setFontSize(14);
  pdf.setTextColor(106, 27, 154);
  pdf.text(title, 15, y);
  return y + 8;
}

function addStatRow(pdf: jsPDF, label: string, value: string, y: number, color?: [number, number, number]): number {
  if (y > 275) { pdf.addPage(); y = 20; }
  pdf.setFontSize(11);
  pdf.setTextColor(60, 60, 60);
  pdf.text(label, 20, y);
  if (color) pdf.setTextColor(...color);
  else pdf.setTextColor(30, 30, 30);
  pdf.text(value, 195, y, { align: 'right' });
  return y + 7;
}

export function exportMonthlyPdf({ month, transactions, categories, stats, formatCurrency }: ExportMonthlyPdfParams) {
  const pdf = new jsPDF();
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const [yearStr, monthStr] = month.split('-');
  const monthName = monthNames[parseInt(monthStr) - 1];

  let y = addHeader(pdf, 'SLX Finance', `Relatório Mensal - ${monthName} de ${yearStr}`, 20);

  // Summary
  y = addSectionTitle(pdf, 'Resumo Financeiro', y);
  y = addStatRow(pdf, 'Total de Entradas', formatCurrency(stats.totalIncome), y, [16, 185, 129]);
  y = addStatRow(pdf, 'Total de Saídas', formatCurrency(stats.totalExpenses), y, [239, 68, 68]);
  y = addStatRow(pdf, 'Investimentos', formatCurrency(stats.totalInvestments), y, [59, 130, 246]);
  y = addStatRow(pdf, 'Lucro Líquido', formatCurrency(stats.netProfit), y, stats.netProfit >= 0 ? [16, 185, 129] : [239, 68, 68]);
  y += 5;

  // Category breakdown - Expenses
  if (stats.categoryBreakdown.length > 0) {
    y = addSectionTitle(pdf, 'Gastos por Categoria', y);
    for (const item of stats.categoryBreakdown) {
      const cat = categories.find(c => c.id === item.categoryId);
      y = addStatRow(pdf, `  ${cat?.name || 'Outros'} (${item.percentage.toFixed(1)}%)`, formatCurrency(item.amount), y);
    }
    y += 5;
  }

  // Income breakdown
  if (stats.incomeBreakdown.length > 0) {
    y = addSectionTitle(pdf, 'Entradas por Categoria', y);
    for (const item of stats.incomeBreakdown) {
      const cat = categories.find(c => c.id === item.categoryId);
      y = addStatRow(pdf, `  ${cat?.name || 'Outros'} (${item.percentage.toFixed(1)}%)`, formatCurrency(item.amount), y);
    }
    y += 5;
  }

  // Transactions list
  y = addSectionTitle(pdf, 'Transações', y);
  
  // Table header
  if (y > 260) { pdf.addPage(); y = 20; }
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Data', 15, y);
  pdf.text('Descrição', 45, y);
  pdf.text('Categoria', 110, y);
  pdf.text('Tipo', 155, y);
  pdf.text('Valor', 195, y, { align: 'right' });
  y += 2;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(15, y, 195, y);
  y += 5;

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (const t of sorted) {
    if (y > 275) { pdf.addPage(); y = 20; }
    const cat = categories.find(c => c.id === t.categoryId);
    const typeLabel = t.type === 'income' ? 'Entrada' : t.type === 'expense' ? 'Saída' : 'Investimento';
    const color: [number, number, number] = t.type === 'income' ? [16, 185, 129] : t.type === 'expense' ? [239, 68, 68] : [59, 130, 246];
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(t.date.split('-').reverse().join('/'), 15, y);
    pdf.text((t.description || '-').substring(0, 30), 45, y);
    pdf.text((cat?.name || '-').substring(0, 20), 110, y);
    pdf.text(typeLabel, 155, y);
    pdf.setTextColor(...color);
    pdf.text(formatCurrency(t.amount), 195, y, { align: 'right' });
    y += 6;
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado por SLX Finance em ${new Date().toLocaleDateString('pt-BR')}`, 15, 285);

  pdf.save(`SLX-Finance-${monthName}-${yearStr}.pdf`);
}

export function exportAnnualPdf({ year, transactions, categories, formatCurrency }: ExportAnnualPdfParams) {
  const pdf = new jsPDF();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  let y = addHeader(pdf, 'SLX Finance', `Relatório Anual - ${year}`, 20);

  // Annual totals
  const yearTransactions = transactions.filter(t => t.date.startsWith(String(year)));
  const totalIncome = yearTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = yearTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalInvestments = yearTransactions.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpenses - totalInvestments;

  y = addSectionTitle(pdf, 'Resumo Anual', y);
  y = addStatRow(pdf, 'Total de Entradas', formatCurrency(totalIncome), y, [16, 185, 129]);
  y = addStatRow(pdf, 'Total de Saídas', formatCurrency(totalExpenses), y, [239, 68, 68]);
  y = addStatRow(pdf, 'Investimentos', formatCurrency(totalInvestments), y, [59, 130, 246]);
  y = addStatRow(pdf, 'Lucro Líquido', formatCurrency(netProfit), y, netProfit >= 0 ? [16, 185, 129] : [239, 68, 68]);
  y += 8;

  // Monthly breakdown table
  y = addSectionTitle(pdf, 'Resumo Mensal', y);
  
  // Table header
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Mês', 15, y);
  pdf.text('Entradas', 70, y, { align: 'right' });
  pdf.text('Saídas', 110, y, { align: 'right' });
  pdf.text('Invest.', 145, y, { align: 'right' });
  pdf.text('Lucro', 195, y, { align: 'right' });
  y += 2;
  pdf.line(15, y, 195, y);
  y += 5;

  for (let m = 0; m < 12; m++) {
    if (y > 275) { pdf.addPage(); y = 20; }
    const monthKey = `${year}-${String(m + 1).padStart(2, '0')}`;
    const mt = yearTransactions.filter(t => t.date.startsWith(monthKey));
    const mIncome = mt.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const mExpense = mt.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const mInvest = mt.filter(t => t.type === 'investment').reduce((s, t) => s + t.amount, 0);
    const mProfit = mIncome - mExpense - mInvest;

    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(monthNames[m], 15, y);
    pdf.setTextColor(16, 185, 129);
    pdf.text(formatCurrency(mIncome), 70, y, { align: 'right' });
    pdf.setTextColor(239, 68, 68);
    pdf.text(formatCurrency(mExpense), 110, y, { align: 'right' });
    pdf.setTextColor(59, 130, 246);
    pdf.text(formatCurrency(mInvest), 145, y, { align: 'right' });
    pdf.setTextColor(mProfit >= 0 ? 16 : 239, mProfit >= 0 ? 185 : 68, mProfit >= 0 ? 129 : 68);
    pdf.text(formatCurrency(mProfit), 195, y, { align: 'right' });
    y += 6;
  }

  y += 5;

  // Top expense categories
  const expenseMap: Record<string, number> = {};
  yearTransactions.filter(t => t.type === 'expense').forEach(t => {
    expenseMap[t.categoryId] = (expenseMap[t.categoryId] || 0) + t.amount;
  });
  const topExpenses = Object.entries(expenseMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  if (topExpenses.length > 0) {
    y = addSectionTitle(pdf, 'Top Categorias de Gastos', y);
    for (const [catId, amount] of topExpenses) {
      const cat = categories.find(c => c.id === catId);
      const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
      y = addStatRow(pdf, `  ${cat?.name || 'Outros'} (${pct}%)`, formatCurrency(amount), y);
    }
  }

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado por SLX Finance em ${new Date().toLocaleDateString('pt-BR')}`, 15, 285);

  pdf.save(`SLX-Finance-Anual-${year}.pdf`);
}
