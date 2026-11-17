const UNITS: Record<string, number> = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** Converts "15m" / "1d" / "3600" (seconds) into milliseconds for the cookie maxAge. */
export function durationToMs(value: string): number {
  const m = /^(\d+)\s*([smhd]?)$/.exec(value.trim());
  if (!m) throw new Error(`Invalid duration: ${value}`);
  return Number(m[1]) * UNITS[m[2] || 's'];
}
