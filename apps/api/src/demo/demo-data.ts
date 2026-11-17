import { Prisma, TransactionType } from '@prisma/client';

/**
 * Realistic sample activity for a demo account: ~12 months of salary, bills,
 * groceries, transport, dining and so on, ending today. Shared by the local
 * seed script (prisma/seed-demo.ts) and the public "Try the demo" endpoint.
 */

export const DEMO_WALLET_NAMES = ['Main Wallet', 'Cash', 'Savings'] as const;

/** Public demo accounts use this reserved, undeliverable domain (RFC 2606 ".invalid"). */
export const DEMO_EMAIL_DOMAIN = 'demo.spendly.invalid';
export const isDemoEmail = (email: string) => email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);

interface Input {
  userId: string;
  /** wallet name -> id */
  wallets: Record<string, string>;
  /** category name -> { id, type } */
  categories: Record<string, { id: string; type: TransactionType }>;
  now?: Date;
  /** Same seed -> same data, so the demo looks the same every time. */
  seed?: number;
}

export function buildDemoTransactions({ userId, wallets, categories, now = new Date(), seed = 42 }: Input) {
  let state = seed;
  const rand = () => ((state = (state * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
  const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
  const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

  const rows: Prisma.TransactionCreateManyInput[] = [];
  const add = (date: Date, category: string, amount: number, wallet: string, description: string) => {
    if (date > now || amount <= 0) return;
    rows.push({
      userId,
      walletId: wallets[wallet],
      categoryId: categories[category].id,
      type: categories[category].type,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      description,
      transactionDate: date,
    });
  };

  for (let back = 11; back >= 0; back--) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - back;
    const day = (d: number) => new Date(Date.UTC(y, m, d));

    add(day(1), 'Salary', 185_000, 'Main Wallet', 'Monthly salary');
    if (rand() > 0.4) add(day(Math.ceil(between(8, 25))), 'Freelance', between(15_000, 60_000), 'Main Wallet', pick(['Logo design', 'Landing page build', 'Consulting call', 'Bug-fix retainer']));
    add(day(3), 'Bills', between(9_000, 16_000), 'Main Wallet', 'K-Electric bill');
    add(day(5), 'Bills', 4_500, 'Main Wallet', 'Internet (Nayatel)');
    add(day(6), 'Bills', between(2_500, 4_000), 'Main Wallet', 'Gas bill');
    for (let w = 0; w < 4; w++) add(day(4 + w * 7), 'Groceries', between(6_000, 14_000), pick(['Main Wallet', 'Cash']), pick(['Imtiaz', 'Carrefour', 'Al-Fatah', 'Sabzi mandi']));
    for (let i = 0; i < 8; i++) add(day(Math.ceil(between(1, 28))), 'Transport', between(300, 2_500), pick(['Cash', 'Main Wallet']), pick(['Careem', 'InDrive', 'Fuel', 'Bykea']));
    for (let i = 0; i < 6; i++) add(day(Math.ceil(between(1, 28))), 'Food & Dining', between(800, 6_500), pick(['Cash', 'Main Wallet']), pick(['Foodpanda', 'Chai & paratha', 'Dinner out', 'Coffee']));
    if (rand() > 0.3) add(day(Math.ceil(between(1, 28))), 'Shopping', between(3_000, 25_000), 'Main Wallet', pick(['Clothes', 'Daraz order', 'Shoes', 'Home decor']));
    if (rand() > 0.5) add(day(Math.ceil(between(1, 28))), 'Health', between(1_500, 9_000), 'Main Wallet', pick(['Pharmacy', 'Doctor visit', 'Lab tests']));
    if (rand() > 0.4) add(day(Math.ceil(between(1, 28))), 'Entertainment', between(1_000, 5_000), 'Cash', pick(['Cinema', 'Netflix', 'Cricket match']));
    add(day(26), 'Other Income', 20_000, 'Savings', 'Monthly savings deposit');
    add(day(15), 'Freelance', 40_000, 'Cash', 'Weekend tuition (cash)');
    if (rand() > 0.7) add(day(Math.ceil(between(1, 28))), 'Other Expense', between(500, 4_000), 'Cash', pick(['Gift', 'Charity', 'Repairs']));
  }
  return rows;
}
