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

async function saveAndSharePdf(pdf: jsPDF, fileName: string) {
  try {
    const pdfBase64 = pdf.output('datauristring').split(',')[1];
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: pdfBase64,
      directory: Directory.Cache
    });

    await Share.share({
      title: 'Exportar Relatório SLX',
      text: `Aqui está o seu relatório financeiro: ${fileName}`,
      url: savedFile.uri,
      dialogTitle: 'Compartilhar Relatório'
    });
  } catch (error) {
    console.error('Erro ao compartilhar PDF:', error);
    // Fallback para download em navegador se falhar (útil para testes)
    pdf.save(fileName);
  }
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

function drawCategoryChart(pdf: jsPDF, breakdown: any[], categories: Category[], y: number, total: number): number {
  if (breakdown.length === 0) return y;
  
  const centerX = 50;
  const centerY = y + 35;
  const radius = 25;
  
  pdf.setFontSize(12);
  pdf.setTextColor(106, 27, 154);
  pdf.text("Distribuição Visual", 15, y + 5);

  // Desenhar Legenda e Simular Gráfico
  let currentY = y + 15;
  const colors: [number, number, number][] = [
    [106, 27, 154], [156, 39, 176], [186, 104, 200], 
    [225, 190, 231], [74, 20, 140], [123, 31, 162]
  ];

  breakdown.slice(0, 6).forEach((item, index) => {
    const cat = categories.find(c => c.id === item.categoryId);
    const color = colors[index % colors.length];
    
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(100, currentY, 4, 4, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(`${cat?.name || 'Outros'}: ${item.percentage.toFixed(1)}%`, 106, currentY + 3.5);
    currentY += 7;
  });

  // Círculo Decorativo (Gráfico Simulado)
  pdf.setDrawColor(106, 27, 154);
  pdf.setLineWidth(0.5);
  pdf.circle(centerX, centerY, radius, 'D');
  pdf.setFontSize(10);
  pdf.text("Gráfico de", centerX, centerY - 2, { align: 'center' });
  pdf.text("Gastos", centerX, centerY + 4, { align: 'center' });

  return Math.max(currentY, centerY + radius) + 10;
}

export async function exportMonthlyPdf({ month, transactions, categories, stats, formatCurrency }: ExportMonthlyPdfParams) {
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

  // Gráfico
  if (stats.categoryBreakdown.length > 0) {
    y = drawCategoryChart(pdf, stats.categoryBreakdown, categories, y, stats.totalExpenses);
  }

  // Transactions list
  y = addSectionTitle(pdf, 'Transações do Período', y);
  
  if (y > 260) { pdf.addPage(); y = 20; }
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Data', 15, y);
  pdf.text('Descrição', 45, y);
  pdf.text('Categoria', 110, y);
  pdf.text('Valor', 195, y, { align: 'right' });
  y += 2;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(15, y, 195, y);
  y += 5;

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  for (const t of sorted) {
    if (y > 275) { pdf.addPage(); y = 20; }
    const cat = categories.find(c => c.id === t.categoryId);
    const color: [number, number, number] = t.type === 'income' ? [16, 185, 129] : t.type === 'expense' ? [239, 68, 68] : [59, 130, 246];
    
    pdf.setFontSize(9);
    pdf.setTextColor(60, 60, 60);
    pdf.text(t.date.split('-').reverse().join('/'), 15, y);
    pdf.text((t.description || '-').substring(0, 30), 45, y);
    pdf.text((cat?.name || '-').substring(0, 20), 110, y);
    pdf.setTextColor(...color);
    pdf.text(formatCurrency(t.amount), 195, y, { align: 'right' });
    y += 6;
  }

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado por SLX Finance em ${new Date().toLocaleDateString('pt-BR')}`, 15, 285);

  await saveAndSharePdf(pdf, `SLX-Finance-${monthName}-${yearStr}.pdf`);
}

export async function exportAnnualPdf({ year, transactions, categories, formatCurrency }: ExportAnnualPdfParams) {
  const pdf = new jsPDF();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  let y = addHeader(pdf, 'SLX Finance', `Relatório Anual - ${year}`, 20);

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

  y = addSectionTitle(pdf, 'Resumo Mensal', y);
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text('Mês', 15, y);
  pdf.text('Entradas', 70, y, { align: 'right' });
  pdf.text('Saídas', 110, y, { align: 'right' });
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
    pdf.setTextColor(mProfit >= 0 ? 16 : 239, mProfit >= 0 ? 185 : 68, mProfit >= 0 ? 129 : 68);
    pdf.text(formatCurrency(mProfit), 195, y, { align: 'right' });
    y += 6;
  }

  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Gerado por SLX Finance em ${new Date().toLocaleDateString('pt-BR')}`, 15, 285);

  await saveAndSharePdf(pdf, `SLX-Finance-Anual-${year}.pdf`);
}
