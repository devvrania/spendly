'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { currentMonth, shiftMonth } from '@/lib/dates';
import { formatMonth } from '@/lib/format';

export function MonthPicker({ value, onChange }: { value: string; onChange: (m: string) => void }) {
  const isCurrent = value >= currentMonth();
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-stone-200 bg-white p-1 shadow-xs">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(shiftMonth(value, -1))} aria-label="Previous month">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-32 text-center text-sm font-medium" aria-live="polite">
        {formatMonth(value, 'long')}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={isCurrent}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
