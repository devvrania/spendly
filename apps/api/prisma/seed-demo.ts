/**
 * DEMO DATA ONLY — never run against production.
 *
 *   pnpm seed:demo            # demo user with ~12 months of realistic activity
 *   pnpm seed:demo --bench    # + ~300 synthetic users / ~60k rows for EXPLAIN ANALYZE
 *
 * All demo/bench accounts use the reserved @spendly.local domain so they are
 * clearly separated from real users, and re-running replaces only those rows.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { DEFAULT_CATEGORIES } from '../src/auth/defaults';
import { buildDemoTransactions, DEMO_WALLET_NAMES } from '../src/demo/demo-data';

const prisma = new PrismaClient();
const DEMO_EMAIL = 'demo@spendly.local';
const DEMO_PASSWORD = 'demo-password-123';

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production');
  if (!process.env.DATABASE_URL?.includes('spendly_dev')) {
    throw new Error('Demo seed only runs against the spendly_dev database');
  }

  await prisma.user.deleteMany({ where: { email: { endsWith: '@spendly.local' } } });

  const user = await prisma.user.create({
    data: {
      name: 'Rania',
      email: DEMO_EMAIL,
      passwordHash: await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id }),
      wallets: { create: DEMO_WALLET_NAMES.map((name) => ({ name })) },
      categories: { create: DEFAULT_CATEGORIES },
    },
    include: { wallets: true, categories: true },
  });

  const rows = buildDemoTransactions({
    userId: user.id,
    wallets: Object.fromEntries(user.wallets.map((w) => [w.name, w.id])),
    categories: Object.fromEntries(user.categories.map((c) => [c.name, c])),
  });
  await prisma.transaction.createMany({ data: rows });
  console.log(`Demo user ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD} (${rows.length} transactions)`);

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
