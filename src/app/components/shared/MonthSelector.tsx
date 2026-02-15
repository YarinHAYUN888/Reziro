import React from 'react';
import { useTranslation } from 'react-i18next';
import { format, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { useAppStore } from '../../../store/useAppStore';

export function MonthSelector() {
  const { t } = useTranslation();
  const selectedMonthKey = useAppStore((state) => state.selectedMonthKey);
  const setSelectedMonthKey = useAppStore((state) => state.setSelectedMonthKey);

  const currentDate = parseISO(selectedMonthKey + '-01');

  const handlePrevious = () => {
    const newDate = subMonths(currentDate, 1);
    setSelectedMonthKey(format(newDate, 'yyyy-MM'));
  };

  const handleNext = () => {
    const newDate = addMonths(currentDate, 1);
    setSelectedMonthKey(format(newDate, 'yyyy-MM'));
  };

  const handleToday = () => {
    setSelectedMonthKey(format(new Date(), 'yyyy-MM'));
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        className="glass-button border-0 hover:text-primary"
        title="Previous month"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <button
        onClick={handleToday}
        className="glass-card px-4 py-2 min-w-[180px] text-center border-0 hover:bg-primary/10 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">
            {format(currentDate, 'MMMM yyyy')}
          </span>
        </div>
      </button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        className="glass-button border-0 hover:text-primary"
        title="Next month"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleToday}
        className="glass-button border-0 hover:text-primary ml-2"
      >
        {t('common.today')}
      </Button>
    </div>
  );
}