import { TransactionType } from '@prisma/client';

export const DEFAULT_WALLET_NAME = 'Main Wallet';

export const DEFAULT_CATEGORIES: { name: string; type: TransactionType; color: string }[] = [
  { name: 'Salary', type: 'INCOME', color: '#10b981' },
  { name: 'Freelance', type: 'INCOME', color: '#14b8a6' },
  { name: 'Other Income', type: 'INCOME', color: '#22c55e' },
  { name: 'Groceries', type: 'EXPENSE', color: '#f59e0b' },
  { name: 'Transport', type: 'EXPENSE', color: '#3b82f6' },
  { name: 'Shopping', type: 'EXPENSE', color: '#ec4899' },
  { name: 'Bills', type: 'EXPENSE', color: '#ef4444' },
  { name: 'Food & Dining', type: 'EXPENSE', color: '#f97316' },
  { name: 'Health', type: 'EXPENSE', color: '#06b6d4' },
  { name: 'Entertainment', type: 'EXPENSE', color: '#8b5cf6' },
  { name: 'Other Expense', type: 'EXPENSE', color: '#64748b' },
];
