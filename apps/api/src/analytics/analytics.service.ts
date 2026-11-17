import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { currentMonthRange } from '../common/utils/date';
import { money } from '../common/utils/money';
import { CategoryBreakdownQueryDto, DateRangeQueryDto, MonthlyTrendQueryDto } from './dto/analytics.dto';

/**
 * All aggregation happens in PostgreSQL over persisted rows, using Prisma's
 * tagged-template $queryRaw, which sends every ${value} as a bind parameter
 * ($1, $2, ...) — never string-interpolated SQL.
 *
 * The SQL here is mirrored and explained in docs/database-design.md.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Income, expenses, and net cash flow for a period (NOT a wallet balance). */
  async summary(userId: string, q: DateRangeQueryDto) {
    const { startDate, endDate } = resolveRange(q);
    const [row] = await this.prisma.$queryRaw<
      { income: Prisma.Decimal; expense: Prisma.Decimal; count: bigint }[]
    >`
      SELECT
        COALESCE(SUM(amount) FILTER (WHERE type = 'INCOME'),  0) AS income,
        COALESCE(SUM(amount) FILTER (WHERE type = 'EXPENSE'), 0) AS expense,
        COUNT(*) AS count
      FROM transactions
      WHERE user_id = ${userId}::uuid
        AND transaction_date BETWEEN ${startDate}::date AND ${endDate}::date
        ${walletFilter(q.walletId)}
    `;
    return {
      startDate,
      endDate,
      totalIncome: money(row.income),
      totalExpense: money(row.expense),
      net: money(row.income.minus(row.expense)),
      transactionCount: Number(row.count),
    };
  }

  /** Totals per category for a period, largest first, with share of the period total. */
  async categoryBreakdown(userId: string, q: CategoryBreakdownQueryDto) {
    const { startDate, endDate } = resolveRange(q);
    const rows = await this.prisma.$queryRaw<
      {
        category_id: string;
        name: string;
        color: string | null;
        total: Prisma.Decimal;
        count: bigint;
        percentage: Prisma.Decimal;
      }[]
    >`
      SELECT
        c.id    AS category_id,
        c.name,
        c.color,
        SUM(t.amount) AS total,
        COUNT(*)      AS count,
        ROUND(100 * SUM(t.amount) / SUM(SUM(t.amount)) OVER (), 2) AS percentage
      FROM transactions t
      JOIN categories c
        ON c.id = t.category_id
       AND c.user_id = t.user_id
      WHERE t.user_id = ${userId}::uuid
        AND t.type = ${q.type}::transaction_type
        AND t.transaction_date BETWEEN ${startDate}::date AND ${endDate}::date
        ${walletFilter(q.walletId, 't')}
      GROUP BY c.id, c.name, c.color
      ORDER BY total DESC, c.name ASC
      ${q.limit ? Prisma.sql`LIMIT ${q.limit}` : Prisma.empty}
    `;
    return {
      startDate,
      endDate,
      type: q.type,
      categories: rows.map((r) => ({
        categoryId: r.category_id,
        name: r.name,
        color: r.color,
        total: money(r.total),
        transactionCount: Number(r.count),
        percentage: Number(r.percentage),
      })),
    };
  }

  /** Income vs expense per month for the last N months, including empty months. */
  async monthlyTrend(userId: string, q: MonthlyTrendQueryDto) {
    const endMonth = q.endMonth ?? currentMonthRange().startDate.slice(0, 7);
    const endMonthStart = `${endMonth}-01`;
    const rows = await this.prisma.$queryRaw<
      { month: string; income: Prisma.Decimal; expense: Prisma.Decimal }[]
    >`
      WITH months AS (
        SELECT generate_series(
                 ${endMonthStart}::date - make_interval(months => ${q.months}::int - 1),
                 ${endMonthStart}::date,
                 interval '1 month'
               )::date AS month_start
      ),
      totals AS (
        -- One index range scan over the whole window, then bucket by month.
        SELECT
          date_trunc('month', transaction_date)::date AS month_start,
          SUM(amount) FILTER (WHERE type = 'INCOME')  AS income,
          SUM(amount) FILTER (WHERE type = 'EXPENSE') AS expense
        FROM transactions
        WHERE user_id = ${userId}::uuid
          AND transaction_date >= (SELECT MIN(month_start) FROM months)
          AND transaction_date <  ${endMonthStart}::date + interval '1 month'
          ${walletFilter(q.walletId)}
        GROUP BY 1
      )
      SELECT
        to_char(m.month_start, 'YYYY-MM') AS month,
        COALESCE(t.income, 0)  AS income,
        COALESCE(t.expense, 0) AS expense
      FROM months m
      LEFT JOIN totals t USING (month_start)
      ORDER BY m.month_start
    `;
    return rows.map((r) => ({
      month: r.month,
      income: money(r.income),
      expense: money(r.expense),
      net: money(r.income.minus(r.expense)),
    }));
  }

  /**
   * All-time balance of every wallet, derived from transactions.
   * balance = SUM(income) - SUM(expense). Nothing is stored, so edits and
   * deletes can never make a balance drift.
   */
  async walletBalances(userId: string, walletId?: string) {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        name: string;
        currency: string;
        is_archived: boolean;
        created_at: Date;
        balance: Prisma.Decimal;
        count: bigint;
      }[]
    >`
      SELECT
        w.id,
        w.name,
        w.currency,
        w.is_archived,
        w.created_at,
        COALESCE(SUM(CASE WHEN t.type = 'INCOME' THEN t.amount ELSE -t.amount END), 0) AS balance,
        COUNT(t.id) AS count
      FROM wallets w
      LEFT JOIN transactions t
        ON t.user_id = w.user_id
       AND t.wallet_id = w.id
      WHERE w.user_id = ${userId}::uuid
        ${walletId ? Prisma.sql`AND w.id = ${walletId}::uuid` : Prisma.empty}
      GROUP BY w.id
      ORDER BY w.is_archived ASC, w.created_at ASC, w.name ASC
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      currency: r.currency.trim(),
      isArchived: r.is_archived,
      createdAt: r.created_at,
      balance: money(r.balance),
      transactionCount: Number(r.count),
    }));
  }

  async walletBalancesSummary(userId: string) {
    const wallets = await this.walletBalances(userId);
    const total = wallets.reduce((sum, w) => sum.plus(w.balance), new Prisma.Decimal(0));
    return { totalBalance: money(total), currency: 'PKR', wallets };
  }
}

function resolveRange(q: DateRangeQueryDto) {
  const fallback = currentMonthRange();
  const startDate = q.startDate ?? fallback.startDate;
  const endDate = q.endDate ?? fallback.endDate;
  if (startDate > endDate) throw new BadRequestException('startDate must be on or before endDate');
  return { startDate, endDate };
}

function walletFilter(walletId: string | undefined, alias?: string) {
  if (!walletId) return Prisma.empty;
  const column = alias ? Prisma.raw(`${alias}.wallet_id`) : Prisma.raw('wallet_id');
  return Prisma.sql`AND ${column} = ${walletId}::uuid`;
}

