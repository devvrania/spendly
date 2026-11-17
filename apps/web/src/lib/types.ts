export type TransactionType = 'INCOME' | 'EXPENSE';

export interface User {
  id: string;
  name: string;
  email: string;
  /** A short-lived "Try the demo" account (deleted after 24 hours). */
  isDemo: boolean;
  createdAt: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: string;
  isArchived: boolean;
  createdAt: string;
  balance: string;
  transactionCount: number;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string | null;
  isArchived: boolean;
  createdAt: string;
  transactionCount?: number;
}

export interface Transaction {
  id: string;
  amount: string;
  type: TransactionType;
  description: string | null;
  transactionDate: string;
  wallet: { id: string; name: string; isArchived: boolean };
  category: { id: string; name: string; type: TransactionType; color: string | null; isArchived: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface Summary {
  startDate: string;
  endDate: string;
  totalIncome: string;
  totalExpense: string;
  net: string;
  transactionCount: number;
}

export interface CategoryBreakdown {
  startDate: string;
  endDate: string;
  type: TransactionType;
  categories: {
    categoryId: string;
    name: string;
    color: string | null;
    total: string;
    transactionCount: number;
    percentage: number;
  }[];
}

export interface MonthlyPoint {
  month: string;
  income: string;
  expense: string;
  net: string;
}

export interface WalletBalances {
  totalBalance: string;
  currency: string;
  wallets: Wallet[];
}
