'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Plus, Receipt } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { Select } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { CategoryChart } from '@/features/dashboard/category-chart';
import { MonthPicker } from '@/features/dashboard/month-picker';
import { SummaryCards } from '@/features/dashboard/summary-cards';
import { TrendChart } from '@/features/dashboard/trend-chart';
import { TransactionRow } from '@/features/transactions/transaction-row';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { currentMonth, monthRange } from '@/lib/dates';
import { formatMoney, formatMonth } from '@/lib/format';
import { useCategoryBreakdown, useMe, useMonthlyTrend, useSummary, useTransactions, useWalletBalances } from '@/lib/queries';

export default function DashboardPage() {
  const { data: me } = useMe();
  const [month, setMonth] = useState(currentMonth);
  const [walletId, setWalletId] = useState('');
  const range = { ...monthRange(month), walletId: walletId || undefined };

  const summary = useSummary(range);
  const breakdown = useCategoryBreakdown({ ...range, type: 'EXPENSE' });
  const trend = useMonthlyTrend({ months: 6, endMonth: month, walletId: walletId || undefined });
  const balances = useWalletBalances();
  const recent = useTransactions({ page: 1, limit: 6, walletId: walletId || undefined });

  const selectedWallet = balances.data?.wallets.find((w) => w.id === walletId);
  const activeWallets = balances.data?.wallets.filter((w) => !w.isArchived) ?? [];

  return (
    <>
      <PageHeader
        title={`Hi, ${me?.name.split(' ')[0] ?? 'there'}`}
        description="Here's how your money moved this period."
        actions={
          <>
            <label className="sr-only" htmlFor="wallet-filter">
              Wallet
            </label>
            <Select id="wallet-filter" value={walletId} onChange={(e) => setWalletId(e.target.value)} wrapperClassName="w-auto min-w-44">
              <option value="">All wallets</option>
              {balances.data?.wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.isArchived ? ' (archived)' : ''}
                </option>
              ))}
            </Select>
            <MonthPicker value={month} onChange={setMonth} />
          </>
        }
      />

      <SummaryCards
        income={summary.data?.totalIncome}
        expense={summary.data?.totalExpense}
        net={summary.data?.net}
        balance={selectedWallet ? selectedWallet.balance : balances.data?.totalBalance}
        balanceLabel={selectedWallet ? `${selectedWallet.name}, all-time` : 'All wallets, all-time'}
        periodLabel={formatMonth(month, 'long')}
        loading={summary.isLoading || balances.isLoading}
      />
      {summary.isError && <p className="mt-3 text-sm text-rose-600">{errorMessage(summary.error)}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
        <TrendChart data={trend.data} loading={trend.isLoading} error={trend.isError ? errorMessage(trend.error) : undefined} onRetry={() => trend.refetch()} />
        <CategoryChart
          data={breakdown.data}
          loading={breakdown.isLoading}
          error={breakdown.isError ? errorMessage(breakdown.error) : undefined}
          onRetry={() => breakdown.refetch()}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5 [&>*]:min-w-0">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Recent transactions"
            action={
              <Link href="/transactions" className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="p-2 pt-3">
            {recent.isError ? (
              <ErrorState message={errorMessage(recent.error)} onRetry={() => recent.refetch()} />
            ) : recent.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11" />
                ))}
              </div>
            ) : recent.data?.data.length ? (
              <ul>{recent.data.data.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}</ul>
            ) : (
              <EmptyState
                icon={Receipt}
                title="No transactions yet"
                description="Record your first income or expense to get started."
                action={
                  <Link href="/transactions/new" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-600 px-3 text-sm font-medium text-white hover:bg-brand-700">
                    <Plus className="h-4 w-4" /> Add transaction
                  </Link>
                }
              />
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Wallets"
            description="All-time balances"
            action={
              <Link href="/wallets" className="text-sm font-medium text-brand-700 hover:underline">
                Manage
              </Link>
            }
          />
          <ul className="space-y-1 p-2 pt-3">
            {balances.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="m-2 h-10" />)
              : activeWallets.map((w) => (
                  <li key={w.id}>
                    <button
                      onClick={() => setWalletId(w.id === walletId ? '' : w.id)}
                      aria-pressed={w.id === walletId}
                      className={cn(
                        'flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                        w.id === walletId ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-stone-50',
                      )}
                    >
                      <span className="font-medium text-stone-800">{w.name}</span>
                      <span className={cn('tabular font-semibold', Number(w.balance) < 0 ? 'text-expense' : 'text-stone-900')}>
                        {formatMoney(w.balance)}
                      </span>
                    </button>
                  </li>
                ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
