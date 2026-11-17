import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/page-header';
import { TransactionForm } from '@/features/transactions/transaction-form';

export const metadata: Metadata = { title: 'Add transaction' };

export default function NewTransactionPage() {
  return (
    <>
      <PageHeader title="Add transaction" description="Record money coming in or going out." />
      <TransactionForm />
    </>
  );
}
