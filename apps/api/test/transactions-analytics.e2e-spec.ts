import { INestApplication } from '@nestjs/common';
import { API, createTestApp, expense, income, registerUser, TestUser } from './helpers';

describe('Transactions & analytics (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => ({ app } = await createTestApp()));
  afterAll(() => app.close());

  const NOV = 'startDate=2026-11-01&endDate=2026-11-30';
  const summary = async (u: TestUser, qs = NOV) => (await u.agent.get(`${API}/analytics/summary?${qs}`).expect(200)).body;

  describe('amount validation', () => {
    let user: TestUser;
    beforeAll(async () => (user = await registerUser(app)));

    it.each(['0', '0.00', '-10', '10.005', 'abc', '', '12345678901'])('rejects amount %p', async (amount) => {
      await user.agent.post(`${API}/transactions`).send(expense(user, { amount })).expect(400);
    });

    it.each(['0.01', '1', '99.9', '9999999999.99'])('accepts amount %p and preserves exact decimals', async (amount) => {
      const res = await user.agent.post(`${API}/transactions`).send(expense(user, { amount })).expect(201);
      expect(res.body.amount).toBe(Number(amount).toFixed(2));
    });

    it.each(['2026-02-30', '2026-13-01', '17-11-2026', '2026-11-17T10:00:00Z'])('rejects date %p', async (d) => {
      await user.agent.post(`${API}/transactions`).send(expense(user, { transactionDate: d })).expect(400);
    });
  });

  it('computes exact income and expense totals (no floating-point drift)', async () => {
    const u = await registerUser(app);
    await u.agent.post(`${API}/transactions`).send(income(u, { amount: '50000.00' })).expect(201);
    // 0.1 + 0.2 style amounts would drift with floats.
    for (const amount of ['0.10', '0.20', '1234.56', '99.99']) {
      await u.agent.post(`${API}/transactions`).send(expense(u, { amount })).expect(201);
    }
    const s = await summary(u);
    expect(s).toMatchObject({
      totalIncome: '50000.00',
      totalExpense: '1334.85',
      net: '48665.15',
      transactionCount: 5,
    });
  });

  it('editing and deleting a transaction changes the derived totals and balances', async () => {
    const u = await registerUser(app);
    await u.agent.post(`${API}/transactions`).send(income(u, { amount: '1000.00' })).expect(201);
    const tx = (await u.agent.post(`${API}/transactions`).send(expense(u, { amount: '300.00' })).expect(201)).body;

    expect((await summary(u)).net).toBe('700.00');
    expect((await u.agent.get(`${API}/wallets/${u.mainWalletId}`)).body.balance).toBe('700.00');

    await u.agent.patch(`${API}/transactions/${tx.id}`).send({ amount: '450.50' }).expect(200);
    expect((await summary(u)).totalExpense).toBe('450.50');
    expect((await u.agent.get(`${API}/wallets/${u.mainWalletId}`)).body.balance).toBe('549.50');

    await u.agent.delete(`${API}/transactions/${tx.id}`).expect(204);
    expect((await summary(u)).totalExpense).toBe('0.00');
    expect((await u.agent.get(`${API}/wallets/${u.mainWalletId}`)).body.balance).toBe('1000.00');
    await u.agent.get(`${API}/transactions/${tx.id}`).expect(404);
  });

  it('treats date-range boundaries as inclusive calendar dates', async () => {
    const u = await registerUser(app);
    for (const d of ['2026-10-31', '2026-11-01', '2026-11-30', '2026-12-01']) {
      await u.agent.post(`${API}/transactions`).send(expense(u, { transactionDate: d, amount: '10.00' })).expect(201);
    }
    const s = await summary(u);
    expect(s.totalExpense).toBe('20.00');
    expect(s.transactionCount).toBe(2);

    const list = await u.agent.get(`${API}/transactions?${NOV}`).expect(200);
    expect(list.body.data.map((t: { transactionDate: string }) => t.transactionDate)).toEqual([
      '2026-11-30',
      '2026-11-01',
    ]);

    await u.agent.get(`${API}/transactions?startDate=2026-12-01&endDate=2026-11-01`).expect(400);
    await u.agent.get(`${API}/analytics/summary?startDate=2026-12-01&endDate=2026-11-01`).expect(400);
  });

  it('paginates with a stable order even when many rows share a date', async () => {
    const u = await registerUser(app);
    for (let i = 0; i < 23; i++) {
      await u.agent
        .post(`${API}/transactions`)
        .send(expense(u, { amount: '5.00', transactionDate: i < 20 ? '2026-11-15' : `2026-11-0${i - 19}` }))
        .expect(201);
    }
    const seen: string[] = [];
    for (let page = 1; page <= 3; page++) {
      const res = await u.agent.get(`${API}/transactions?page=${page}&limit=10`).expect(200);
      expect(res.body.meta).toEqual({ page, limit: 10, total: 23, totalPages: 3 });
      seen.push(...res.body.data.map((t: { id: string }) => t.id));
    }
    expect(seen).toHaveLength(23);
    expect(new Set(seen).size).toBe(23);

    // Repeating the same page returns the same rows.
    const a = await u.agent.get(`${API}/transactions?page=2&limit=10`);
    const b = await u.agent.get(`${API}/transactions?page=2&limit=10`);
    expect(a.body.data).toEqual(b.body.data);

    await u.agent.get(`${API}/transactions?limit=500`).expect(400);
    await u.agent.get(`${API}/transactions?page=0`).expect(400);
    await u.agent.get(`${API}/transactions?sortBy=password_hash`).expect(400);
  });

  it('filters by type, wallet, category, and description search', async () => {
    const u = await registerUser(app);
    const savings = (await u.agent.post(`${API}/wallets`).send({ name: 'Savings' }).expect(201)).body;
    await u.agent.post(`${API}/transactions`).send(income(u)).expect(201);
    await u.agent.post(`${API}/transactions`).send(expense(u, { description: 'Imtiaz groceries' })).expect(201);
    await u.agent
      .post(`${API}/transactions`)
      .send(expense(u, { walletId: savings.id, categoryId: u.categories['Bills'].id, description: 'K-Electric' }))
      .expect(201);

    const count = async (qs: string) => (await u.agent.get(`${API}/transactions?${qs}`).expect(200)).body.meta.total;
    expect(await count('type=INCOME')).toBe(1);
    expect(await count('type=EXPENSE')).toBe(2);
    expect(await count(`walletId=${savings.id}`)).toBe(1);
    expect(await count(`categoryId=${u.categories['Groceries'].id}`)).toBe(1);
    expect(await count('search=imtiaz')).toBe(1);
    expect(await count(`type=EXPENSE&walletId=${u.mainWalletId}`)).toBe(1);
  });

  it('calculates per-wallet all-time balances independent of the selected period', async () => {
    const u = await registerUser(app);
    const savings = (await u.agent.post(`${API}/wallets`).send({ name: 'Savings' }).expect(201)).body;
    await u.agent.post(`${API}/transactions`).send(income(u, { amount: '2000.00', transactionDate: '2025-01-15' })).expect(201);
    await u.agent.post(`${API}/transactions`).send(expense(u, { amount: '250.25' })).expect(201);
    await u.agent
      .post(`${API}/transactions`)
      .send(income(u, { walletId: savings.id, amount: '500.00', categoryId: u.categories['Freelance'].id }))
      .expect(201);

    const res = await u.agent.get(`${API}/analytics/wallet-balances`).expect(200);
    expect(res.body.totalBalance).toBe('2249.75');
    const byName = Object.fromEntries(res.body.wallets.map((w: { name: string; balance: string }) => [w.name, w.balance]));
    expect(byName).toEqual({ 'Main Wallet': '1749.75', Savings: '500.00' });

    // Period net for November is NOT the wallet balance.
    expect((await summary(u)).net).toBe('249.75');
  });

  it('breaks expenses down by category with percentages and top-N', async () => {
    const u = await registerUser(app);
    const add = (cat: string, amount: string) =>
      u.agent.post(`${API}/transactions`).send(expense(u, { categoryId: u.categories[cat].id, amount })).expect(201);
    await add('Groceries', '600.00');
    await add('Groceries', '400.00');
    await add('Bills', '750.00');
    await add('Transport', '250.00');
    await add('Health', '0.50');
    await u.agent.post(`${API}/transactions`).send(income(u)).expect(201);

    const res = await u.agent.get(`${API}/analytics/category-breakdown?${NOV}`).expect(200);
    expect(res.body.categories.map((c: { name: string; total: string; percentage: number }) => [c.name, c.total, c.percentage])).toEqual([
      ['Groceries', '1000.00', 49.99],
      ['Bills', '750.00', 37.49],
      ['Transport', '250.00', 12.5],
      ['Health', '0.50', 0.02],
    ]);
    const top = await u.agent.get(`${API}/analytics/category-breakdown?${NOV}&limit=2`).expect(200);
    expect(top.body.categories).toHaveLength(2);
  });

  it('returns a monthly trend including empty months', async () => {
    const u = await registerUser(app);
    await u.agent.post(`${API}/transactions`).send(income(u, { amount: '100.00', transactionDate: '2026-09-05' })).expect(201);
    await u.agent.post(`${API}/transactions`).send(expense(u, { amount: '40.00', transactionDate: '2026-09-30' })).expect(201);
    await u.agent.post(`${API}/transactions`).send(expense(u, { amount: '10.00', transactionDate: '2026-11-01' })).expect(201);
    // Outside the window:
    await u.agent.post(`${API}/transactions`).send(expense(u, { amount: '999.00', transactionDate: '2026-07-31' })).expect(201);

    const res = await u.agent.get(`${API}/analytics/monthly-trend?months=4&endMonth=2026-11`).expect(200);
    expect(res.body).toEqual([
      { month: '2026-08', income: '0.00', expense: '0.00', net: '0.00' },
      { month: '2026-09', income: '100.00', expense: '40.00', net: '60.00' },
      { month: '2026-10', income: '0.00', expense: '0.00', net: '0.00' },
      { month: '2026-11', income: '0.00', expense: '10.00', net: '-10.00' },
    ]);
  });
});
