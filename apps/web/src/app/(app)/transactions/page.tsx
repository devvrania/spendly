'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { CategoryDot, TypeBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { TransactionFiltersBar } from '@/features/transactions/filters';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatDate, formatSignedMoney } from '@/lib/format';
import { useCategories, useTransactionMutations, useTransactions, useWallets, type TransactionFilters } from '@/lib/queries';
import type { Transaction } from '@/lib/types';

const DEFAULTS: TransactionFilters = { page: 1, limit: 15, sortBy: 'transactionDate', sortOrder: 'desc' };

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULTS);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);
  const list = useTransactions(filters);
  const categories = useCategories(true);
  const wallets = useWallets(true);
  const { remove } = useTransactionMutations();

  // Any filter change returns to page 1.
  const update = useCallback((patch: Partial<TransactionFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 })), []);
  const reset = useCallback(() => setFilters(DEFAULTS), []);

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await remove.mutateAsync(toDelete.id);
      toast.success('Transaction deleted');
      setToDelete(null);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const meta = list.data?.meta;
  const rows = list.data?.data ?? [];
  const filtered = Boolean(filters.search || filters.type || filters.categoryId || filters.walletId || filters.startDate || filters.endDate);

  return (
    <>
      <PageHeader
        title="Transactions"
        description={meta ? `${meta.total} ${meta.total === 1 ? 'transaction' : 'transactions'}${filtered ? ' match your filters' : ''}` : ' '}
        actions={
          <Link href="/transactions/new" className="hidden h-10 sm:inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700">
            <Plus className="h-4 w-4" /> Add transaction
          </Link>
        }
      />

      <Card>
        <TransactionFiltersBar
          value={filters}
          onChange={update}
          onReset={reset}
          categories={categories.data ?? []}
          wallets={wallets.data ?? []}
        />
        <div className="border-t border-stone-100">
          {list.isError ? (
            <ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} />
          ) : list.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            filtered ? (
              <EmptyState title="No matching transactions" description="Try widening the date range or clearing filters." action={<Button variant="secondary" size="sm" onClick={reset}>Clear filters</Button>} />
            ) : (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Add your first income or expense and it will show up here."
                action={
                  <Link href="/transactions/new" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700">
                    <Plus className="h-4 w-4" /> Add transaction
                  </Link>
                }
              />
            )
          ) : (
            <div className={cn('transition-opacity', list.isPlaceholderData && 'opacity-60')}>
              {/* Desktop table */}
              <table className="hidden w-full text-sm md:table">
                <caption className="sr-only">Transactions</caption>
                <thead>
                  <tr className="text-left text-xs font-medium uppercase tracking-wide text-stone-400">
                    <th scope="col" className="px-5 py-3 font-medium">Date</th>
                    <th scope="col" className="px-3 py-3 font-medium">Description</th>
                    <th scope="col" className="px-3 py-3 font-medium">Category</th>
                    <th scope="col" className="px-3 py-3 font-medium">Wallet</th>
                    <th scope="col" className="px-3 py-3 font-medium">Type</th>
                    <th scope="col" className="px-3 py-3 text-right font-medium">Amount</th>
                    <th scope="col" className="px-5 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((tx) => (
                    <tr key={tx.id} className="group hover:bg-stone-50/70">
                      <td className="tabular whitespace-nowrap px-5 py-3 text-stone-500">{formatDate(tx.transactionDate)}</td>
                      <td className="max-w-56 truncate px-3 py-3 font-medium text-stone-900">{tx.description || <span className="text-stone-400">—</span>}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-2 text-stone-700">
                          <CategoryDot color={tx.category.color} />
                          {tx.category.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-stone-600">{tx.wallet.name}</td>
                      <td className="px-3 py-3"><TypeBadge type={tx.type} /></td>
                      <td className={cn('tabular whitespace-nowrap px-3 py-3 text-right font-semibold', tx.type === 'INCOME' ? 'text-income' : 'text-stone-900')}>
                        {formatSignedMoney(tx.amount, tx.type)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <RowActions tx={tx} onDelete={() => setToDelete(tx)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile list */}
              <ul className="divide-y divide-stone-100 md:hidden">
                {rows.map((tx) => (
                  <li key={tx.id} className="flex items-center gap-1 py-1 pl-2 pr-2">
                    {/* Tapping the row edits it; delete stays a separate button. */}
                    <Link
                      href={`/transactions/${tx.id}/edit`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2.5 active:bg-stone-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">{tx.description || tx.category.name}</p>
                        <p className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-stone-500">
                          <CategoryDot color={tx.category.color} />
                          <span className="truncate">
                            {tx.category.name} · {tx.wallet.name}
                          </span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn('tabular whitespace-nowrap text-sm font-semibold', tx.type === 'INCOME' ? 'text-income' : 'text-stone-900')}>
                          {formatSignedMoney(tx.amount, tx.type)}
                        </p>
                        <p className="mt-0.5 text-xs text-stone-400">{formatDate(tx.transactionDate, { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </Link>
                    <button
                      onClick={() => setToDelete(tx)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                      aria-label={`Delete ${tx.description || tx.category.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {meta && meta.total > 0 && (
          <nav aria-label="Pagination" className="flex items-center justify-between border-t border-stone-100 px-5 py-3 text-sm">
            <span className="text-stone-500">
              Page <span className="font-medium text-stone-900">{meta.page}</span> of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={meta.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: meta.page - 1 }))}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button variant="secondary" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setFilters((f) => ({ ...f, page: meta.page + 1 }))}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title="Delete this transaction?"
        description={
          toDelete
            ? `${formatSignedMoney(toDelete.amount, toDelete.type)} · ${toDelete.category.name} on ${formatDate(toDelete.transactionDate)}. Totals and balances will update. This can't be undone.`
            : ''
        }
      />
    </>
  );
}

function RowActions({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  return (
    <span className="inline-flex gap-1">
      <Link
        href={`/transactions/${tx.id}/edit`}
        className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        aria-label={`Edit ${tx.description || tx.category.name}`}
      >
        <Pencil className="h-4 w-4" />
      </Link>
      <button
        onClick={onDelete}
        className="grid h-8 w-8 place-items-center rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-600"
        aria-label={`Delete ${tx.description || tx.category.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </span>
  );
}
