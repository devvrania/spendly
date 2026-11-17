import { cn } from '@/lib/cn';
import type { TransactionType } from '@/lib/types';

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      {children}
    </span>
  );
}

export function TypeBadge({ type }: { type: TransactionType }) {
  return (
    <Badge className={type === 'INCOME' ? 'bg-income-soft text-income' : 'bg-expense-soft text-expense'}>
      {type === 'INCOME' ? 'Income' : 'Expense'}
    </Badge>
  );
}

export function CategoryDot({ color }: { color: string | null }) {
  return <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color ?? '#a8a29e' }} />;
}
