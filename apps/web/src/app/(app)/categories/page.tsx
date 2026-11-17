'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { NameDialog } from '@/components/name-dialog';
import { RowMenu } from '@/components/row-menu';
import { Badge, CategoryDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { Segmented } from '@/components/ui/segmented';
import { errorMessage } from '@/lib/api';
import { cn } from '@/lib/cn';
import { useCategories, useCategoryMutations } from '@/lib/queries';
import type { Category, TransactionType } from '@/lib/types';

const COLORS = ['#10b981', '#14b8a6', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#f59e0b', '#64748b'];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-stone-700">Color</legend>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((c) => (
          <label key={c} className="cursor-pointer">
            <input type="radio" name="color" value={c} checked={value === c} onChange={() => onChange(c)} className="peer sr-only" aria-label={c} />
            <span
              className="block h-7 w-7 rounded-full ring-offset-2 transition peer-checked:ring-2 peer-checked:ring-stone-900 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500"
              style={{ backgroundColor: c }}
            />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function CategoriesPage() {
  const categories = useCategories(true);
  const m = useCategoryMutations();
  const [creating, setCreating] = useState(false);
  const [newType, setNewType] = useState<TransactionType>('EXPENSE');
  const [color, setColor] = useState(COLORS[0]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const run = async (p: Promise<unknown>, success: string) => {
    try {
      await p;
      toast.success(success);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const openCreate = (type: TransactionType) => {
    setNewType(type);
    setColor(COLORS[type === 'INCOME' ? 0 : 6]);
    setCreating(true);
  };

  const column = (type: TransactionType) => {
    const list = (categories.data ?? []).filter((c) => c.type === type);
    return (
      <Card>
        <CardHeader
          title={type === 'INCOME' ? 'Income' : 'Expenses'}
          description={`${list.filter((c) => !c.isArchived).length} active`}
          action={
            <Button variant="secondary" size="sm" onClick={() => openCreate(type)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          }
        />
        <ul className="divide-y divide-stone-100 p-2 pt-3">
          {categories.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="m-2 h-9" />)
            : list.length === 0
              ? <EmptyState title="No categories" />
              : list.map((c) => (
                  <li key={c.id} className={cn('flex items-center gap-3 px-3 py-2.5', c.isArchived && 'opacity-60')}>
                    <CategoryDot color={c.color} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800">{c.name}</span>
                    {c.isArchived && <Badge className="bg-stone-100 text-stone-500">Archived</Badge>}
                    <span className="tabular text-xs text-stone-400">{c.transactionCount ?? 0} used</span>
                    <RowMenu
                      label={`Actions for ${c.name}`}
                      items={[
                        { label: 'Edit', onSelect: () => { setEditing(c); setColor(c.color ?? COLORS[0]); } },
                        c.isArchived
                          ? { label: 'Restore', onSelect: () => run(m.setArchived.mutateAsync({ id: c.id, archived: false }), `${c.name} restored`) }
                          : { label: 'Archive', onSelect: () => run(m.setArchived.mutateAsync({ id: c.id, archived: true }), `${c.name} archived`) },
                        {
                          label: 'Delete',
                          danger: true,
                          disabled: (c.transactionCount ?? 0) > 0,
                          hint: (c.transactionCount ?? 0) > 0 ? 'In use — archive instead' : undefined,
                          onSelect: () => setDeleting(c),
                        },
                      ]}
                    />
                  </li>
                ))}
        </ul>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Archived categories stay on past transactions but can't be picked for new ones."
        actions={
          <Button onClick={() => openCreate('EXPENSE')}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />
      {categories.isError ? (
        <Card><ErrorState message={errorMessage(categories.error)} onRetry={() => categories.refetch()} /></Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {column('EXPENSE')}
          {column('INCOME')}
        </div>
      )}

      <NameDialog
        open={creating}
        onClose={() => setCreating(false)}
        title="New category"
        label="Name"
        submitLabel="Create category"
        onSubmit={async (name) => {
          await m.create.mutateAsync({ name, type: newType, color });
          toast.success(`${name} created`);
        }}
      >
        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-stone-700">Type</span>
          <Segmented<TransactionType>
            name="new-category-type"
            label="Category type"
            value={newType}
            onChange={setNewType}
            options={[
              { value: 'EXPENSE', label: 'Expense', activeClass: 'text-expense' },
              { value: 'INCOME', label: 'Income', activeClass: 'text-income' },
            ]}
          />
        </div>
        <ColorPicker value={color} onChange={setColor} />
      </NameDialog>

      <NameDialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title="Edit category"
        label="Name"
        initial={editing?.name}
        submitLabel="Save"
        onSubmit={async (name) => {
          await m.update.mutateAsync({ id: editing!.id, name, color });
          toast.success('Category updated');
        }}
      >
        <ColorPicker value={color} onChange={setColor} />
        <p className="text-xs text-stone-500">The type can&apos;t be changed because transactions depend on it.</p>
      </NameDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        loading={m.remove.isPending}
        title={`Delete ${deleting?.name}?`}
        description="This category isn't used by any transaction, so it can be removed permanently."
        onConfirm={async () => {
          await run(m.remove.mutateAsync(deleting!.id), 'Category deleted');
          setDeleting(null);
        }}
      />
    </>
  );
}
