import Link from 'next/link';
import { CategoryDot } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { formatDate, formatSignedMoney } from '@/lib/format';
import type { Transaction } from '@/lib/types';

/** Compact row used on the dashboard "Recent transactions" list. */
export function TransactionRow({ tx }: { tx: Transaction }) {
  return (
    <li>
      <Link
        href={`/transactions/${tx.id}/edit`}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-50"
      >
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-semibold"
          style={{ backgroundColor: `${tx.category.color ?? '#a8a29e'}1f`, color: tx.category.color ?? '#57534e' }}
          aria-hidden
        >
          {tx.category.name.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-stone-900">{tx.description || tx.category.name}</span>
          <span className="flex items-center gap-1.5 text-xs text-stone-500">
            <CategoryDot color={tx.category.color} />
            {tx.category.name} · {tx.wallet.name} · {formatDate(tx.transactionDate, { day: 'numeric', month: 'short' })}
          </span>
        </span>
        <span className={cn('tabular shrink-0 text-sm font-semibold', tx.type === 'INCOME' ? 'text-income' : 'text-stone-900')}>
          {formatSignedMoney(tx.amount, tx.type)}
        </span>
      </Link>
    </li>
  );
}
