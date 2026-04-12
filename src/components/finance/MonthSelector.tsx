import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFinance } from '@/context/FinanceContext';
import { format, parseISO, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

export function MonthSelector() {
  const { currentMonth, setCurrentMonth } = useFinance();
  
  const monthDate = parseISO(`${currentMonth}-01`);
  const formattedMonth = format(monthDate, "MMMM 'de' yyyy", { locale: ptBR });
  
  const goToPreviousMonth = () => {
    setCurrentMonth(format(subMonths(monthDate, 1), 'yyyy-MM'));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(format(addMonths(monthDate, 1), 'yyyy-MM'));
  };
  
  const goToCurrentMonth = () => {
    setCurrentMonth(format(new Date(), 'yyyy-MM'));
  };

  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: goToNextMonth,
    onSwipeRight: goToPreviousMonth,
  });
  
  return (
    <div
      className="flex items-center justify-between rounded-xl bg-card p-3"
      {...swipeHandlers}
    >
      <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="h-9 w-9">
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <button
        onClick={goToCurrentMonth}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 font-semibold capitalize transition-colors hover:bg-muted"
      >
        <Calendar className="h-4 w-4 text-primary" />
        {formattedMonth}
      </button>
      
      <Button variant="ghost" size="icon" onClick={goToNextMonth} className="h-9 w-9">
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
