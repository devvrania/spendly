import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/feedback';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';

interface Props {
  income?: string;
  expense?: string;
  net?: string;
  balance?: string;
  balanceLabel: string;
  periodLabel: string;
  loading: boolean;
}

export function SummaryCards({ income, expense, net, balance, balanceLabel, periodLabel, loading }: Props) {
  const netNum = Number(net ?? 0);
  const cards = [
    { label: 'Income', value: income, hint: periodLabel, icon: ArrowDownLeft, tone: 'text-income bg-income-soft' },
    { label: 'Expenses', value: expense, hint: periodLabel, icon: ArrowUpRight, tone: 'text-expense bg-expense-soft' },
    {
      label: 'Period net',
      value: net,
      hint: 'Income − expenses this period',
      icon: Scale,
      tone: 'text-sky-700 bg-sky-50',
      valueClass: netNum < 0 ? 'text-expense' : netNum > 0 ? 'text-income' : undefined,
    },
    { label: 'Wallet balance', value: balance, hint: balanceLabel, icon: Wallet, tone: 'text-brand-700 bg-brand-50' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {cards.map(({ label, value, hint, icon: Icon, tone, valueClass }) => (
        <Card key={label} className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-stone-500">{label}</span>
            <span className={cn('grid h-8 w-8 place-items-center rounded-lg', tone)} aria-hidden>
              <Icon className="h-4 w-4" />
            </span>
          </div>
          {loading || value === undefined ? (
            <Skeleton className="mt-3 h-7 w-28" />
          ) : (
            <p className={cn('tabular mt-2 truncate text-lg font-semibold tracking-tight sm:text-2xl', valueClass)}>
              {formatMoney(value)}
            </p>
          )}
          <p className="mt-1 truncate text-xs text-stone-400">{hint}</p>
        </Card>
      ))}
    </div>
  );
}
