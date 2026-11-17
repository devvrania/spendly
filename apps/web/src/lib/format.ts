const pkr = new Intl.NumberFormat('en-PK', {
  style: 'currency',
  currency: 'PKR',
  currencyDisplay: 'code',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pkrCompact = new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Amounts arrive from the API as exact decimal strings. They are only converted
 * to numbers here, for DISPLAY; no authoritative math happens in the browser.
 */
export function formatMoney(value: string | number): string {
  return pkr.format(Number(value)).replace('PKR', 'Rs').replace(/ /g, ' ');
}

export function formatCompact(value: number): string {
  return pkrCompact.format(value);
}

export function formatSignedMoney(value: string, type: 'INCOME' | 'EXPENSE'): string {
  return `${type === 'INCOME' ? '+' : '−'}${formatMoney(value)}`;
}

/** "2026-11-17" -> "17 Nov 2026" without any timezone shifting. */
export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });
}

export function formatMonth(yyyyMm: string, style: 'short' | 'long' = 'short') {
  const [y, m] = yyyyMm.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: style,
    year: style === 'long' ? 'numeric' : '2-digit',
    timeZone: 'UTC',
  });
}
