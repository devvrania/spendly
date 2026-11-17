'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input, Select, Textarea } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { ApiError, errorMessage } from '@/lib/api';
import { todayIso } from '@/lib/dates';
import { useCategories, useTransactionMutations, useWallets } from '@/lib/queries';
import type { Transaction, TransactionType } from '@/lib/types';

const schema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  amount: z
    .string()
    .trim()
    .min(1, 'Enter an amount')
    .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Use a number with up to 2 decimals, e.g. 1250.50')
    .refine((v) => Number(v) > 0, 'Amount must be greater than zero'),
  categoryId: z.string().min(1, 'Choose a category'),
  walletId: z.string().min(1, 'Choose a wallet'),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
  description: z.string().trim().max(500, 'Keep it under 500 characters').optional(),
});
type Values = z.infer<typeof schema>;

export function TransactionForm({ existing }: { existing?: Transaction }) {
  const router = useRouter();
  const { create, update } = useTransactionMutations();
  const categories = useCategories(true);
  const wallets = useWallets(true);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          type: existing.type,
          amount: existing.amount,
          categoryId: existing.category.id,
          walletId: existing.wallet.id,
          transactionDate: existing.transactionDate,
          description: existing.description ?? '',
        }
      : { type: 'EXPENSE', amount: '', categoryId: '', walletId: '', transactionDate: todayIso(), description: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const type = form.watch('type');
  const categoryId = form.watch('categoryId');

  // Only active options are selectable, except the record's CURRENT wallet or
  // category, which stays visible on edit even after being archived.
  const categoryOptions = useMemo(
    () => (categories.data ?? []).filter((c) => c.type === type && (!c.isArchived || c.id === existing?.category.id)),
    [categories.data, type, existing],
  );
  const walletOptions = useMemo(
    () => (wallets.data ?? []).filter((w) => !w.isArchived || w.id === existing?.wallet.id),
    [wallets.data, existing],
  );

  // Switching Income/Expense clears a category of the wrong type.
  useEffect(() => {
    if (categoryId && categories.data && !categoryOptions.some((c) => c.id === categoryId)) {
      form.setValue('categoryId', '');
    }
  }, [categoryId, categoryOptions, categories.data, form]);

  // Preselect the first active wallet for new transactions.
  useEffect(() => {
    if (!existing && !form.getValues('walletId') && walletOptions.length) form.setValue('walletId', walletOptions[0].id);
  }, [existing, walletOptions, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const body = { ...values, description: values.description || null };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, ...body });
      else await create.mutateAsync(body);
      toast.success(existing ? 'Transaction updated' : 'Transaction added');
      router.push('/transactions');
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) {
        for (const fe of e.errors) form.setError(fe.field as keyof Values, { message: fe.messages[0] });
      } else {
        toast.error(errorMessage(e));
      }
    }
  });

  return (
    <Card className="max-w-xl p-5 sm:p-6">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Segmented<TransactionType>
              name="type"
              label="Transaction type"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: 'EXPENSE', label: 'Expense', activeClass: 'text-expense' },
                { value: 'INCOME', label: 'Income', activeClass: 'text-income' },
              ]}
            />
          )}
        />

        <Field label="Amount (PKR)" error={errors.amount?.message}>
          <Input inputMode="decimal" placeholder="0.00" autoFocus={!existing} className="tabular text-base" {...form.register('amount')} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Category"
            error={errors.categoryId?.message}
            hint={categoryOptions.length === 0 && !categories.isLoading ? `No active ${type.toLowerCase()} categories` : undefined}
          >
            <Select disabled={categories.isLoading} {...form.register('categoryId')}>
              <option value="">Select a category</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.isArchived ? ' (archived)' : ''}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Wallet" error={errors.walletId?.message}>
            <Select disabled={wallets.isLoading} {...form.register('walletId')}>
              <option value="">Select a wallet</option>
              {walletOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.isArchived ? ' (archived)' : ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Date" error={errors.transactionDate?.message}>
          <Input type="date" {...form.register('transactionDate')} />
        </Field>

        <Field label="Description" error={errors.description?.message} hint="Optional">
          <Textarea rows={2} placeholder="e.g. Weekly groceries at Imtiaz" {...form.register('description')} />
        </Field>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {existing ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
