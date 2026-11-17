import { INestApplication } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp, registerUser, TestUser } from './helpers';

/**
 * These tests bypass the API and write directly with SQL, proving the
 * DATABASE rejects bad data even if application checks had a bug.
 */
describe('Database-level constraints', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    alice = await registerUser(app, 'Alice');
    bob = await registerUser(app, 'Bob');
  });
  afterAll(() => app.close());

  const insert = (u: TestUser, walletId: string, categoryId: string, type: string, amount: string) =>
    prisma.$executeRaw`
      INSERT INTO transactions (id, user_id, wallet_id, category_id, amount, type, transaction_date, updated_at)
      VALUES (gen_random_uuid(), ${u.id}::uuid, ${walletId}::uuid, ${categoryId}::uuid,
              ${amount}::numeric, ${type}::transaction_type, '2026-11-01', now())
    `;

  const expectViolation = async (p: Promise<unknown>, constraint: string) => {
    await expect(p).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
    await expect(p).rejects.toThrow(new RegExp(constraint));
  };

  it('accepts a valid row', async () => {
    await expect(insert(alice, alice.mainWalletId, alice.categories['Groceries'].id, 'EXPENSE', '10.00')).resolves.toBe(1);
  });

  it("composite FK blocks referencing another user's wallet", async () => {
    await expectViolation(
      insert(alice, bob.mainWalletId, alice.categories['Groceries'].id, 'EXPENSE', '10.00'),
      'transactions_wallet_owner_fkey',
    );
  });

  it("composite FK blocks referencing another user's category", async () => {
    await expectViolation(
      insert(alice, alice.mainWalletId, bob.categories['Groceries'].id, 'EXPENSE', '10.00'),
      'transactions_category_owner_type_fkey',
    );
  });

  it('composite FK blocks a transaction type that differs from its category type', async () => {
    await expectViolation(
      insert(alice, alice.mainWalletId, alice.categories['Groceries'].id, 'INCOME', '10.00'),
      'transactions_category_owner_type_fkey',
    );
  });

  it('CHECK blocks zero and negative amounts', async () => {
    const cat = alice.categories['Groceries'].id;
    await expectViolation(insert(alice, alice.mainWalletId, cat, 'EXPENSE', '0'), 'transactions_amount_positive_chk');
    await expectViolation(insert(alice, alice.mainWalletId, cat, 'EXPENSE', '-5'), 'transactions_amount_positive_chk');
  });

  it('CHECK blocks a non-normalized email', async () => {
    await expectViolation(
      prisma.$executeRaw`INSERT INTO users (id, name, email, password_hash, updated_at)
                         VALUES (gen_random_uuid(), 'X', 'Mixed@Case.com', 'x', now())`,
      'users_email_normalized_chk',
    );
  });

  it('FK blocks hard-deleting a wallet that has transactions', async () => {
    await expect(
      prisma.$executeRaw`DELETE FROM wallets WHERE id = ${alice.mainWalletId}::uuid`,
    ).rejects.toThrow(/transactions_wallet_owner_fkey/);
  });

  it('a user deletion cascades through all of their rows', async () => {
    const carol = await registerUser(app, 'Carol');
    await insert(carol, carol.mainWalletId, carol.categories['Salary'].id, 'INCOME', '5.00');
    await prisma.user.delete({ where: { id: carol.id } });
    expect(await prisma.transaction.count({ where: { userId: carol.id } })).toBe(0);
    expect(await prisma.wallet.count({ where: { userId: carol.id } })).toBe(0);
    expect(await prisma.category.count({ where: { userId: carol.id } })).toBe(0);
  });
});
