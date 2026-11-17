import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { API, createTestApp, registerUser } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => ({ app, prisma } = await createTestApp()));
  afterAll(() => app.close());

  it('registers a user, sets an HttpOnly session cookie, and never returns the hash', async () => {
    const local = `Ayesha.${randomUUID()}`;
    const res = await request(app.getHttpServer())
      .post(`${API}/auth/register`)
      .send({ name: '  Ayesha  ', email: `  ${local}@Example.COM `, password: 'password123' })
      .expect(201);

    expect(res.body).toMatchObject({ name: 'Ayesha', email: `${local.toLowerCase()}@example.com` });
    expect(res.body.passwordHash).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/spendly_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);

    const stored = await prisma.user.findUniqueOrThrow({ where: { email: `${local.toLowerCase()}@example.com` } });
    expect(stored.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('creates the default wallet and categories atomically on registration', async () => {
    const user = await registerUser(app);
    const wallets = await user.agent.get(`${API}/wallets`).expect(200);
    expect(wallets.body).toHaveLength(1);
    expect(wallets.body[0]).toMatchObject({ name: 'Main Wallet', currency: 'PKR', balance: '0.00' });
    expect(Object.keys(user.categories).sort()).toEqual(
      [
        'Bills', 'Entertainment', 'Food & Dining', 'Freelance', 'Groceries', 'Health',
        'Other Expense', 'Other Income', 'Salary', 'Shopping', 'Transport',
      ].sort(),
    );
  });

  it('rejects a duplicate email, case-insensitively', async () => {
    const user = await registerUser(app);
    const res = await request(app.getHttpServer())
      .post(`${API}/auth/register`)
      .send({ name: 'Dup', email: user.email.toUpperCase(), password: 'password123' })
      .expect(409);
    expect(res.body.message).toBe('An account with this email already exists');
  });

  it('validates registration input with field-level errors', async () => {
    const res = await request(app.getHttpServer())
      .post(`${API}/auth/register`)
      .send({ name: '', email: 'not-an-email', password: 'short' })
      .expect(400);
    expect(res.body.message).toBe('Validation failed');
    expect(res.body.errors.map((e: { field: string }) => e.field).sort()).toEqual(['email', 'name', 'password']);
  });

  it('logs in with correct credentials and rejects a wrong password generically', async () => {
    const user = await registerUser(app);
    await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email: user.email, password: user.password })
      .expect(200);

    const wrong = await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email: user.email, password: 'wrong-password' })
      .expect(401);
    const unknown = await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email: 'nobody@example.com', password: 'wrong-password' })
      .expect(401);
    // Same message whether the account exists or not: no user enumeration.
    expect(wrong.body.message).toBe('Invalid email or password');
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('returns the current user from /auth/me and clears the session on logout', async () => {
    const user = await registerUser(app);
    const me = await user.agent.get(`${API}/auth/me`).expect(200);
    expect(me.body.email).toBe(user.email);

    await user.agent.post(`${API}/auth/logout`).expect(204);
    await user.agent.get(`${API}/auth/me`).expect(401);
  });

  it.each([
    ['get', '/auth/me'],
    ['get', '/wallets'],
    ['get', '/categories'],
    ['get', '/transactions'],
    ['post', '/transactions'],
    ['get', '/analytics/summary'],
    ['patch', '/users/me'],
  ])('rejects unauthenticated %s %s', async (method, path) => {
    await (request(app.getHttpServer()) as any)[method](`${API}${path}`).expect(401);
  });

  it('rejects a forged token', async () => {
    await request(app.getHttpServer())
      .get(`${API}/auth/me`)
      .set('Cookie', 'spendly_session=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.bad-signature')
      .expect(401);
  });

  it('rejects state-changing requests from a foreign Origin (CSRF)', async () => {
    const user = await registerUser(app);
    await user.agent
      .post(`${API}/wallets`)
      .set('Origin', 'https://evil.example')
      .send({ name: 'Hijack' })
      .expect(403);
  });

  it('updates the display name via /users/me', async () => {
    const user = await registerUser(app);
    const res = await user.agent.patch(`${API}/users/me`).send({ name: 'Renamed' }).expect(200);
    expect(res.body.name).toBe('Renamed');
    await user.agent.patch(`${API}/users/me`).send({ email: 'x@y.z', name: 'A' }).expect(400);
  });
});
