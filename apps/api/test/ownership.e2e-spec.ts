import { INestApplication } from '@nestjs/common';
import { API, createTestApp, expense, registerUser, TestUser } from './helpers';

describe('Ownership & integrity (e2e)', () => {
  let app: INestApplication;
  let alice: TestUser;
  let bob: TestUser;
  let bobTxId: string;

  beforeAll(async () => {
    ({ app } = await createTestApp());
    alice = await registerUser(app, 'Alice');
    bob = await registerUser(app, 'Bob');
    bobTxId = (await bob.agent.post(`${API}/transactions`).send(expense(bob)).expect(201)).body.id;
  });
  afterAll(() => app.close());

  it("User A cannot read User B's transaction", async () => {
    await alice.agent.get(`${API}/transactions/${bobTxId}`).expect(404);
    const list = await alice.agent.get(`${API}/transactions`).expect(200);
    expect(list.body.data.map((t: { id: string }) => t.id)).not.toContain(bobTxId);
  });

  it("User A cannot update or delete User B's transaction", async () => {
    await alice.agent.patch(`${API}/transactions/${bobTxId}`).send({ amount: '1.00' }).expect(404);
    await alice.agent.delete(`${API}/transactions/${bobTxId}`).expect(404);
    const stillThere = await bob.agent.get(`${API}/transactions/${bobTxId}`).expect(200);
    expect(stillThere.body.amount).toBe('100.00');
  });

  it("User A cannot attach User B's wallet to a transaction", async () => {
    const res = await alice.agent
      .post(`${API}/transactions`)
      .send(expense(alice, { walletId: bob.mainWalletId }))
      .expect(400);
    expect(res.body.message).toBe('Wallet not found');
  });

  it("User A cannot attach User B's category to a transaction", async () => {
    const res = await alice.agent
      .post(`${API}/transactions`)
      .send(expense(alice, { categoryId: bob.categories['Groceries'].id }))
      .expect(400);
    expect(res.body.message).toBe('Category not found');
  });

  it("User A cannot move their own transaction into User B's wallet", async () => {
    const tx = (await alice.agent.post(`${API}/transactions`).send(expense(alice)).expect(201)).body;
    await alice.agent.patch(`${API}/transactions/${tx.id}`).send({ walletId: bob.mainWalletId }).expect(400);
  });

  it("User A cannot see, rename, or archive User B's wallets and categories", async () => {
    await alice.agent.get(`${API}/wallets/${bob.mainWalletId}`).expect(404);
    await alice.agent.patch(`${API}/wallets/${bob.mainWalletId}`).send({ name: 'Mine now' }).expect(404);
    await alice.agent.patch(`${API}/wallets/${bob.mainWalletId}/archive`).expect(404);
    await alice.agent.patch(`${API}/categories/${bob.categories['Bills'].id}`).send({ name: 'X' }).expect(404);
    await alice.agent.patch(`${API}/categories/${bob.categories['Bills'].id}/archive`).expect(404);
    await alice.agent.delete(`${API}/categories/${bob.categories['Bills'].id}`).expect(404);
  });

  it('ignores a client-supplied userId (whitelisted DTOs reject unknown fields)', async () => {
    await alice.agent
      .post(`${API}/transactions`)
      .send({ ...expense(alice), userId: bob.id })
      .expect(400);
  });

  it('rejects a category type mismatch on create and update', async () => {
    const res = await alice.agent
      .post(`${API}/transactions`)
      .send(expense(alice, { categoryId: alice.categories['Salary'].id }))
      .expect(400);
    expect(res.body.message).toMatch(/income category and cannot be used for expense/);

    const tx = (await alice.agent.post(`${API}/transactions`).send(expense(alice)).expect(201)).body;
    // Flipping only the type would leave an EXPENSE category on an INCOME transaction.
    await alice.agent.patch(`${API}/transactions/${tx.id}`).send({ type: 'INCOME' }).expect(400);
    // Flipping type + category together is fine.
    await alice.agent
      .patch(`${API}/transactions/${tx.id}`)
      .send({ type: 'INCOME', categoryId: alice.categories['Freelance'].id })
      .expect(200);
  });

  it('rejects archived wallets and categories for new transactions, but keeps old ones valid', async () => {
    const user = await registerUser(app);
    const savings = (await user.agent.post(`${API}/wallets`).send({ name: 'Savings' }).expect(201)).body;
    const old = (
      await user.agent.post(`${API}/transactions`).send(expense(user, { walletId: savings.id })).expect(201)
    ).body;

    await user.agent.patch(`${API}/wallets/${savings.id}/archive`).expect(200);
    await user.agent.patch(`${API}/categories/${user.categories['Groceries'].id}/archive`).expect(200);

    const w = await user.agent
      .post(`${API}/transactions`)
      .send(expense(user, { walletId: savings.id, categoryId: user.categories['Bills'].id }))
      .expect(400);
    expect(w.body.message).toMatch(/wallet is archived/);
    const c = await user.agent.post(`${API}/transactions`).send(expense(user)).expect(400);
    expect(c.body.message).toMatch(/category is archived/);

    // The existing transaction is still readable and editable (amount only).
    await user.agent.get(`${API}/transactions/${old.id}`).expect(200);
    await user.agent.patch(`${API}/transactions/${old.id}`).send({ amount: '42.00' }).expect(200);
  });

  it('refuses to hard-delete wallets/categories that have transactions', async () => {
    const user = await registerUser(app);
    await user.agent.post(`${API}/transactions`).send(expense(user)).expect(201);
    const savings = (await user.agent.post(`${API}/wallets`).send({ name: 'Savings' }).expect(201)).body;
    await user.agent.post(`${API}/transactions`).send(expense(user, { walletId: savings.id })).expect(201);

    await user.agent.delete(`${API}/wallets/${savings.id}`).expect(409);
    await user.agent.delete(`${API}/categories/${user.categories['Groceries'].id}`).expect(409);
    // An unused category can be deleted.
    await user.agent.delete(`${API}/categories/${user.categories['Health'].id}`).expect(204);
  });

  it('enforces case-insensitive unique names per user', async () => {
    const user = await registerUser(app);
    await user.agent.post(`${API}/wallets`).send({ name: 'main wallet' }).expect(409);
    await user.agent.post(`${API}/categories`).send({ name: 'GROCERIES', type: 'EXPENSE' }).expect(409);
    // Same name with a different type is allowed.
    await user.agent.post(`${API}/categories`).send({ name: 'Groceries', type: 'INCOME' }).expect(201);
    // Another user may reuse the name.
    await alice.agent.post(`${API}/wallets`).send({ name: 'Savings' }).expect(201);
  });

  it('does not allow archiving the last active wallet', async () => {
    const user = await registerUser(app);
    await user.agent.patch(`${API}/wallets/${user.mainWalletId}/archive`).expect(400);
  });
});
