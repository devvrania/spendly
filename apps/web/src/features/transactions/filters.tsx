'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import type { TransactionFilters } from '@/lib/queries';
import type { Category, Wallet } from '@/lib/types';

interface Props {
  value: TransactionFilters;
  onChange: (patch: Partial<TransactionFilters>) => void;
  onReset: () => void;
  categories: Category[];
  wallets: Wallet[];
}

export function TransactionFiltersBar({ value, onChange, onReset, categories, wallets }: Props) {
  const [search, setSearch] = useState(value.search ?? '');

  // Debounce free-text search so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      if ((value.search ?? '') !== search) onChange({ search: search || undefined });
    }, 300);
    return () => clearTimeout(t);
  }, [search, value.search, onChange]);

  const visibleCategories = categories.filter((c) => !value.type || c.type === value.type);
  const active =
    Boolean(value.search || value.type || value.categoryId || value.walletId || value.startDate || value.endDate);

  return (
    <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-6">
      <div className="relative col-span-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden />
        <Input
          aria-label="Search descriptions"
          placeholder="Search descriptions"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        aria-label="Type" wrapperClassName="min-w-0"
        value={value.type ?? ''}
        onChange={(e) => {
          const type = (e.target.value || undefined) as TransactionFilters['type'];
          const keepCategory = categories.find((c) => c.id === value.categoryId)?.type === type;
          onChange({ type, ...(!keepCategory && { categoryId: undefined }) });
        }}
      >
        <option value="">All types</option>
        <option value="INCOME">Income</option>
        <option value="EXPENSE">Expense</option>
      </Select>
      <Select aria-label="Category" wrapperClassName="min-w-0" value={value.categoryId ?? ''} onChange={(e) => onChange({ categoryId: e.target.value || undefined })}>
        <option value="">All categories</option>
        {visibleCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
            {c.isArchived ? ' (archived)' : ''}
          </option>
        ))}
      </Select>
      <Select aria-label="Wallet" wrapperClassName="min-w-0" value={value.walletId ?? ''} onChange={(e) => onChange({ walletId: e.target.value || undefined })}>
        <option value="">All wallets</option>
        {wallets.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
            {w.isArchived ? ' (archived)' : ''}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Sort" wrapperClassName="min-w-0"
        value={`${value.sortBy}:${value.sortOrder}`}
        onChange={(e) => {
          const [sortBy, sortOrder] = e.target.value.split(':') as [TransactionFilters['sortBy'], TransactionFilters['sortOrder']];
          onChange({ sortBy, sortOrder });
        }}
      >
        <option value="transactionDate:desc">Newest first</option>
        <option value="transactionDate:asc">Oldest first</option>
        <option value="amount:desc">Largest amount</option>
        <option value="amount:asc">Smallest amount</option>
      </Select>

      {/* Phone: two stacked date fields side by side. Wider screens: one inline row. */}
      <div className="col-span-2 grid grid-cols-2 gap-3 sm:flex sm:items-center lg:col-span-6">
        <label className="flex min-w-0 flex-col gap-1 text-xs text-stone-600 sm:flex-row sm:items-center sm:gap-2 sm:text-sm">
          <span className="shrink-0">From</span>
          <Input
            type="date"
            aria-label="From date"
            value={value.startDate ?? ''}
            max={value.endDate}
            onChange={(e) => onChange({ startDate: e.target.value || undefined })}
            className="h-9 w-full min-w-0 sm:w-auto"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-stone-600 sm:flex-row sm:items-center sm:gap-2 sm:text-sm">
          <span className="shrink-0">To</span>
          <Input
            type="date"
            aria-label="To date"
            value={value.endDate ?? ''}
            min={value.startDate}
            onChange={(e) => onChange({ endDate: e.target.value || undefined })}
            className="h-9 w-full min-w-0 sm:w-auto"
          />
        </label>
        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="col-span-2 justify-self-start sm:ml-auto"
            onClick={() => {
              setSearch('');
              onReset();
            }}
          >
            <X className="h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
