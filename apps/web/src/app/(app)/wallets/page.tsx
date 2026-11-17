'use client';

import { useState } from 'react';
import { Archive, Plus, Wallet as WalletIcon } from 'lucide-react';
import { toast } from 'sonner';
import { NameDialog } from '@/components/name-dialog';
import { RowMenu } from '@/components/row-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useWalletMutations, useWallets } from '@/lib/queries';
import type { Wallet } from '@/lib/types';

export default function WalletsPage() {
  const [showArchived, setShowArchived] = useState(false);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<Wallet | null>(null);
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const wallets = useWallets(true);
  const m = useWalletMutations();

  const all = wallets.data ?? [];
  const active = all.filter((w) => !w.isArchived);
  const archived = all.filter((w) => w.isArchived);
  const total = active.reduce((s, w) => s + Number(w.balance), 0);

  const run = async (p: Promise<unknown>, success: string) => {
    try {
      await p;
      toast.success(success);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const card = (w: Wallet) => (
    <Card key={w.id} className={cn('flex flex-col p-5', w.isArchived && 'bg-stone-50/60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl', w.isArchived ? 'bg-stone-100 text-stone-400' : 'bg-brand-50 text-brand-700')}>
            <WalletIcon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-stone-900">{w.name}</h2>
            <p className="text-xs text-stone-500">
              {w.transactionCount} {w.transactionCount === 1 ? 'transaction' : 'transactions'} · {w.currency}
            </p>
          </div>
        </div>
        <RowMenu
          label={`Actions for ${w.name}`}
          items={[
            { label: 'Rename', onSelect: () => setRenaming(w) },
            w.isArchived
              ? { label: 'Restore', onSelect: () => run(m.setArchived.mutateAsync({ id: w.id, archived: false }), `${w.name} restored`) }
              : { label: 'Archive', onSelect: () => run(m.setArchived.mutateAsync({ id: w.id, archived: true }), `${w.name} archived`) },
            {
              label: 'Delete',
              danger: true,
              disabled: w.transactionCount > 0,
              hint: w.transactionCount > 0 ? 'Has transactions — archive instead' : undefined,
              onSelect: () => setDeleting(w),
            },
          ]}
        />
      </div>
      <p className={cn('tabular mt-5 text-2xl font-semibold tracking-tight', Number(w.balance) < 0 ? 'text-expense' : 'text-stone-900')}>
        {formatMoney(w.balance)}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-stone-400">
        All-time balance
        {w.isArchived && <Badge className="bg-stone-200/70 text-stone-600">Archived</Badge>}
      </div>
    </Card>
  );

  return (
    <>
      <PageHeader
        title="Wallets"
        description="Balances are calculated from your transactions, so they're always up to date."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New wallet
          </Button>
        }
      />

      {wallets.isError ? (
        <Card><ErrorState message={errorMessage(wallets.error)} onRetry={() => wallets.refetch()} /></Card>
      ) : wallets.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <Card className="mb-6 flex items-center justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-5 text-white">
            <div>
              <p className="text-sm text-brand-100">Total across active wallets</p>
              <p className="tabular mt-1 text-3xl font-semibold tracking-tight">{formatMoney(total)}</p>
            </div>
            <p className="text-sm text-brand-100">{active.length} active</p>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{active.map(card)}</div>

          {archived.length > 0 && (
            <div className="mt-8">
              <button onClick={() => setShowArchived((s) => !s)} aria-expanded={showArchived} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-stone-900">
                <Archive className="h-4 w-4" /> {showArchived ? 'Hide' : 'Show'} archived wallets ({archived.length})
              </button>
              {showArchived && <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{archived.map(card)}</div>}
            </div>
          )}
          {all.length === 0 && <EmptyState title="No wallets" description="Create a wallet to start recording transactions." />}
        </>
      )}

      <NameDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New wallet"
        label="Wallet name"
        submitLabel="Create wallet"
        onSubmit={async (name) => {
          await m.create.mutateAsync(name);
          toast.success(`${name} created`);
        }}
      />
      <NameDialog
        open={Boolean(renaming)}
        onClose={() => setRenaming(null)}
        title="Rename wallet"
        label="Wallet name"
        initial={renaming?.name}
        submitLabel="Save"
        onSubmit={async (name) => {
          await m.rename.mutateAsync({ id: renaming!.id, name });
          toast.success('Wallet renamed');
        }}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={m.remove.isPending}
        title={`Delete ${deleting?.name}?`}
        description="This wallet has no transactions, so it can be removed permanently."
        onConfirm={async () => {
          await run(m.remove.mutateAsync(deleting!.id), 'Wallet deleted');
          setDeleting(null);
        }}
      />
    </>
  );
}
