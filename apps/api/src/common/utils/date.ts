const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True only for real calendar dates in strict YYYY-MM-DD form (rejects 2026-02-30). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** A Postgres DATE is a calendar date: represent it as UTC midnight in JS. */
export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function formatDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** First and last calendar day of the month containing `today` (UTC). */
export function currentMonthRange(today = new Date()): { startDate: string; endDate: string } {
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  return {
    startDate: formatDate(new Date(Date.UTC(y, m, 1))),
    endDate: formatDate(new Date(Date.UTC(y, m + 1, 0))),
  };
}
