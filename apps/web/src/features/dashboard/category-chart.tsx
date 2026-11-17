'use client';

import { PieChart as PieIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader } from '@/components/ui/card';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { formatMoney } from '@/lib/format';
import type { CategoryBreakdown } from '@/lib/types';

const FALLBACK = ['#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#f97316', '#06b6d4', '#8b5cf6', '#64748b'];

export function CategoryChart({ data, loading, error, onRetry }: { data?: CategoryBreakdown; loading: boolean; error?: string; onRetry: () => void }) {
  const rows = (data?.categories ?? []).map((c, i) => ({ ...c, value: Number(c.total), fill: c.color ?? FALLBACK[i % FALLBACK.length] }));

  return (
    <Card className="lg:col-span-2">
      <CardHeader title="Spending by category" description="Expenses this period" />
      <div className="px-5 pb-5 pt-4">
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          <Skeleton className="h-64" />
        ) : rows.length === 0 ? (
          <EmptyState icon={PieIcon} title="No expenses this period" description="Add an expense to see where your money goes." />
        ) : (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={rows} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
                    {rows.map((r) => (
                      <Cell key={r.categoryId} fill={r.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatMoney(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e7e5e4', fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-4 space-y-2.5">
              {rows.slice(0, 6).map((r) => (
                <li key={r.categoryId} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.fill }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-stone-700">{r.name}</span>
                  <span className="tabular text-xs text-stone-400">{r.percentage.toFixed(1)}%</span>
                  <span className="tabular w-28 text-right font-medium text-stone-900">{formatMoney(r.total)}</span>
                </li>
              ))}
              {rows.length > 6 && <li className="text-xs text-stone-400">+ {rows.length - 6} more categories</li>}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
