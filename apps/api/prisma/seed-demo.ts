/**
 * DEMO DATA ONLY — never run against production.
 *
 *   pnpm seed:demo            # demo user with ~12 months of realistic activity
 *   pnpm seed:demo --bench    # + ~300 synthetic users / ~60k rows for EXPLAIN ANALYZE
 *
 * All demo/bench accounts use the reserved @spendly.local domain so they are
 * clearly separated from real users, and re-running replaces only those rows.
 */
import { Prisma, PrismaClient, TransactionType } from '@prisma/client';
import * as argon2 from 'argon2';
import { DEFAULT_CATEGORIES, DEFAULT_WALLET_NAME } from '../src/auth/defaults';

const prisma = new PrismaClient();
const DEMO_EMAIL = 'demo@spendly.local';
const DEMO_PASSWORD = 'demo-password-123';

// Deterministic PRNG so the demo looks the same every time.
let seed = 42;
const rand = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31);
const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 100) / 100;
const pick = <T>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production');
  if (!process.env.DATABASE_URL?.includes('spendly_dev')) {
    throw new Error('Demo seed only runs against the spendly_dev database');
  }

  await prisma.user.deleteMany({ where: { email: { endsWith: '@spendly.local' } } });

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: DEMO_EMAIL,
      passwordHash: await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id }),
      wallets: { create: [{ name: DEFAULT_WALLET_NAME }, { name: 'Cash' }, { name: 'Savings' }] },
      categories: { create: DEFAULT_CATEGORIES },
    },
    include: { wallets: true, categories: true },
  });

  const wallet = Object.fromEntries(user.wallets.map((w) => [w.name, w.id]));
  const cat = Object.fromEntries(user.categories.map((c) => [c.name, c]));
  const rows: Prisma.TransactionCreateManyInput[] = [];
  const add = (date: Date, name: string, amount: number, walletName: string, description: string) => {
    if (date > new Date()) return;
    rows.push({
      userId: user.id,
      walletId: wallet[walletName],
      categoryId: cat[name].id,
      type: cat[name].type as TransactionType,
      amount: new Prisma.Decimal(amount.toFixed(2)),
      description,
      transactionDate: date,
    });
  };

  const now = new Date();
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

  const valid = rows.filter((r) => Number(r.amount) > 0);
  await prisma.transaction.createMany({ data: valid });
  console.log(`Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${valid.length} transactions)`);

  if (process.argv.includes('--bench')) await seedBench();
}

/** Bulk synthetic data generated in SQL, so query plans reflect a multi-tenant table. */
async function seedBench() {
  const users = 300;
  const perUser = 200;
  await prisma.$executeRaw`
    INSERT INTO users (id, name, email, password_hash, updated_at)
    SELECT gen_random_uuid(), 'Bench ' || g, 'bench-' || g || '@spendly.local', 'not-a-real-hash', now()
    FROM generate_series(1, ${users}::int) g`;
  await prisma.$executeRaw`
    INSERT INTO wallets (id, user_id, name, updated_at)
    SELECT gen_random_uuid(), u.id, w.name, now()
    FROM users u CROSS JOIN (VALUES ('Main Wallet'), ('Cash')) AS w(name)
    WHERE u.email LIKE 'bench-%@spendly.local'`;
  await prisma.$executeRaw`
    INSERT INTO categories (id, user_id, name, type, updated_at)
    SELECT gen_random_uuid(), u.id, c.name, c.type::transaction_type, now()
    FROM users u CROSS JOIN (VALUES ('Salary','INCOME'), ('Groceries','EXPENSE'), ('Bills','EXPENSE'),
                                    ('Transport','EXPENSE'), ('Food & Dining','EXPENSE')) AS c(name, type)
    WHERE u.email LIKE 'bench-%@spendly.local'`;
  await prisma.$executeRaw`
    INSERT INTO transactions (id, user_id, wallet_id, category_id, amount, type, description, transaction_date, updated_at)
    SELECT gen_random_uuid(), u.id, w.id, c.id,
           round((random() * 20000 + 100)::numeric, 2), c.type, 'bench row',
           (current_date - (random() * 730)::int), now()
    FROM users u
    CROSS JOIN generate_series(1, ${perUser}::int) g
    CROSS JOIN LATERAL (SELECT id FROM wallets WHERE user_id = u.id ORDER BY random() + g LIMIT 1) w
    CROSS JOIN LATERAL (SELECT id, type FROM categories WHERE user_id = u.id ORDER BY random() + g LIMIT 1) c
    WHERE u.email LIKE 'bench-%@spendly.local'`;
  await prisma.$executeRawUnsafe('ANALYZE');
  const total = await prisma.transaction.count();
  console.log(`Bench data ready: ${users} users, ${total} total transactions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
