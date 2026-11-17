const pad = (n: number) => String(n).padStart(2, '0');

/** Today's date in the USER'S timezone as YYYY-MM-DD. */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentMonth(): string {
  return todayIso().slice(0, 7);
}

export function monthRange(yyyyMm: string): { startDate: string; endDate: string } {
  const [y, m] = yyyyMm.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { startDate: `${yyyyMm}-01`, endDate: `${yyyyMm}-${pad(last)}` };
}

export function shiftMonth(yyyyMm: string, delta: number): string {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}
