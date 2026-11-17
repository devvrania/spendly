'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { formatCompact, formatMoney, formatMonth } from '@/lib/format';
import type { MonthlyPoint } from '@/lib/types';
import { BarChart3 } from 'lucide-react';

export function TrendChart({ data, loading, error, onRetry }: { data?: MonthlyPoint[]; loading: boolean; error?: string; onRetry: () => void }) {
  const points = (data ?? []).map((p) => ({ month: p.month, Income: Number(p.income), Expenses: Number(p.expense) }));
  const empty = points.every((p) => p.Income === 0 && p.Expenses === 0);

  return (
    <Card className="lg:col-span-3">
      <CardHeader title="Income vs expenses" description="Last 6 months" />
      <div className="h-72 px-2 pb-4 pt-4">
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          <Skeleton className="mx-3 h-full" />
        ) : empty ? (
          <EmptyState icon={BarChart3} title="No activity yet" description="Your monthly trend will appear once you add transactions." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} barGap={4} margin={{ left: 4, right: 12 }}>
              <CartesianGrid vertical={false} stroke="#e7e5e4" strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={(m) => formatMonth(m)} tickLine={false} axisLine={false} fontSize={12} stroke="#78716c" />
              <YAxis tickFormatter={formatCompact} tickLine={false} axisLine={false} fontSize={12} stroke="#78716c" width={44} />
              <Tooltip
                cursor={{ fill: '#f5f5f4' }}
                formatter={(v) => formatMoney(Number(v))}
                labelFormatter={(m) => formatMonth(String(m), 'long')}
                contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 13 }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="Income" fill="#14a37f" radius={[6, 6, 0, 0]} maxBarSize={28} />
              <Bar dataKey="Expenses" fill="#e8798d" radius={[6, 6, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
