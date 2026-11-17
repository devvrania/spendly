import { Prisma } from '@prisma/client';

/** Serialize money as a fixed 2-decimal string so no float ever touches it. */
export function money(value: Prisma.Decimal | string | number | null | undefined): string {
  if (value === null || value === undefined) return '0.00';
  return new Prisma.Decimal(value).toFixed(2);
}
