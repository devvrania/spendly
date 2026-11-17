'use client';

import { use } from 'react';
import { ErrorState, Skeleton } from '@/components/ui/feedback';
import { PageHeader } from '@/components/ui/page-header';
import { TransactionForm } from '@/features/transactions/transaction-form';
import { errorMessage } from '@/lib/api';
import { useTransaction } from '@/lib/queries';

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const tx = useTransaction(id);

  return (
    <>
      <PageHeader title="Edit transaction" description="Changes update every total and balance automatically." />
      {tx.isError ? (
        <ErrorState message={errorMessage(tx.error)} />
      ) : tx.data ? (
        <TransactionForm key={tx.data.id} existing={tx.data} />
      ) : (
        <Skeleton className="h-96 max-w-xl" />
      )}
    </>
  );
}
