'use client';

import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from './api';
import type {
  Category,
  CategoryBreakdown,
  MonthlyPoint,
  Paginated,
  Summary,
  Transaction,
  TransactionType,
  User,
  Wallet,
  WalletBalances,
} from './types';

// ----- keys -----------------------------------------------------------------
export const keys = {
  me: ['me'] as const,
  wallets: (includeArchived: boolean) => ['wallets', { includeArchived }] as const,
  categories: (includeArchived: boolean) => ['categories', { includeArchived }] as const,
  transactions: (filters: TransactionFilters) => ['transactions', 'list', filters] as const,
  transaction: (id: string) => ['transactions', 'one', id] as const,
  analytics: (name: string, params: object) => ['analytics', name, params] as const,
};

/**
 * Anything that changes money invalidates every derived view. Totals and
 * balances are recomputed by the API from the database, never patched locally.
 */
function useInvalidateMoney() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['transactions'] }),
      qc.invalidateQueries({ queryKey: ['analytics'] }),
      qc.invalidateQueries({ queryKey: ['wallets'] }),
      qc.invalidateQueries({ queryKey: ['categories'] }),
    ]);
}

// ----- auth / profile -------------------------------------------------------
export function useMe() {
  return useQuery({
    queryKey: keys.me,
    queryFn: () => api<User>('/auth/me', { skipAuthRedirect: true }),
    retry: false,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api<User>('/users/me', { method: 'PATCH', body: { name } }),
    onSuccess: (user) => qc.setQueryData(keys.me, user),
  });
}

// ----- wallets --------------------------------------------------------------
export function useWallets(includeArchived = false) {
  return useQuery({
    queryKey: keys.wallets(includeArchived),
    queryFn: () => api<Wallet[]>('/wallets', { query: { includeArchived } }),
  });
}

export function useWalletMutations() {
  const invalidate = useInvalidateMoney();
  const opts = { onSuccess: invalidate };
  return {
    create: useMutation({ mutationFn: (name: string) => api<Wallet>('/wallets', { method: 'POST', body: { name } }), ...opts }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => api<Wallet>(`/wallets/${id}`, { method: 'PATCH', body: { name } }),
      ...opts,
    }),
    setArchived: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        api<Wallet>(`/wallets/${id}/${archived ? 'archive' : 'unarchive'}`, { method: 'PATCH' }),
      ...opts,
    }),
    remove: useMutation({ mutationFn: (id: string) => api<void>(`/wallets/${id}`, { method: 'DELETE' }), ...opts }),
  };
}

// ----- categories -----------------------------------------------------------
export function useCategories(includeArchived = false) {
  return useQuery({
    queryKey: keys.categories(includeArchived),
    queryFn: () => api<Category[]>('/categories', { query: { includeArchived } }),
  });
}

export interface CategoryInput {
  name: string;
  type: TransactionType;
  color?: string;
}

export function useCategoryMutations() {
  const invalidate = useInvalidateMoney();
  const opts = { onSuccess: invalidate };
  return {
    create: useMutation({ mutationFn: (body: CategoryInput) => api<Category>('/categories', { method: 'POST', body }), ...opts }),
    update: useMutation({
      mutationFn: ({ id, ...body }: { id: string; name?: string; color?: string }) =>
        api<Category>(`/categories/${id}`, { method: 'PATCH', body }),
      ...opts,
    }),
    setArchived: useMutation({
      mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
        api<Category>(`/categories/${id}/${archived ? 'archive' : 'unarchive'}`, { method: 'PATCH' }),
      ...opts,
    }),
    remove: useMutation({ mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: 'DELETE' }), ...opts }),
  };
}

// ----- transactions ---------------------------------------------------------
export interface TransactionFilters {
  page?: number;
  limit?: number;
  sortBy?: 'transactionDate' | 'amount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  type?: TransactionType;
  categoryId?: string;
  walletId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: keys.transactions(filters),
    queryFn: () => api<Paginated<Transaction>>('/transactions', { query: { ...filters } }),
    placeholderData: keepPreviousData,
  });
}

export function useTransaction(id: string) {
  return useQuery({ queryKey: keys.transaction(id), queryFn: () => api<Transaction>(`/transactions/${id}`) });
}

export interface TransactionInput {
  amount: string;
  type: TransactionType;
  categoryId: string;
  walletId: string;
  transactionDate: string;
  description?: string | null;
}

export function useTransactionMutations() {
  const invalidate = useInvalidateMoney();
  const opts = { onSuccess: invalidate };
  return {
    create: useMutation({
      mutationFn: (body: TransactionInput) => api<Transaction>('/transactions', { method: 'POST', body }),
      ...opts,
    }),
    update: useMutation({
      mutationFn: ({ id, ...body }: TransactionInput & { id: string }) =>
        api<Transaction>(`/transactions/${id}`, { method: 'PATCH', body }),
      ...opts,
    }),
    remove: useMutation({ mutationFn: (id: string) => api<void>(`/transactions/${id}`, { method: 'DELETE' }), ...opts }),
  };
}

// ----- analytics ------------------------------------------------------------
type Range = { startDate: string; endDate: string; walletId?: string };

export function useSummary(params: Range) {
  return useQuery({
    queryKey: keys.analytics('summary', params),
    queryFn: () => api<Summary>('/analytics/summary', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useCategoryBreakdown(params: Range & { type?: TransactionType }) {
  return useQuery({
    queryKey: keys.analytics('category-breakdown', params),
    queryFn: () => api<CategoryBreakdown>('/analytics/category-breakdown', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useMonthlyTrend(params: { months: number; endMonth: string; walletId?: string }) {
  return useQuery({
    queryKey: keys.analytics('monthly-trend', params),
    queryFn: () => api<MonthlyPoint[]>('/analytics/monthly-trend', { query: params }),
    placeholderData: keepPreviousData,
  });
}

export function useWalletBalances() {
  return useQuery({
    queryKey: keys.analytics('wallet-balances', {}),
    queryFn: () => api<WalletBalances>('/analytics/wallet-balances'),
  });
}
