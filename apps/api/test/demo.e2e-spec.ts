import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEMO_EMAIL_DOMAIN } from '../src/demo/demo-data';
import { DEMO_TTL_MS, DemoService } from '../src/demo/demo.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { API, createTestApp } from './helpers';

describe('Try the demo (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => ({ app, prisma } = await createTestApp()));
  afterAll(() => app.close());

  const startDemo = async () => {
    const agent = request.agent(app.getHttpServer());
    const res = await agent.post(`${API}/auth/demo`).expect(201);
    return { agent, user: res.body, cookie: String(res.headers['set-cookie']) };
  };

  it('signs the visitor into a fresh, pre-filled demo account', async () => {
    const { agent, user, cookie } = await startDemo();

    expect(user).toMatchObject({ name: 'Rania', isDemo: true });
    expect(user.email).toMatch(new RegExp(`^demo-[0-9a-f-]+@${DEMO_EMAIL_DOMAIN.replace(/\./g, '\\.')}$`));
    expect(user.passwordHash).toBeUndefined();
    expect(cookie).toMatch(/spendly_session=.*HttpOnly/i);

    await agent.get(`${API}/auth/me`).expect(200).expect((r) => expect(r.body.isDemo).toBe(true));
    const wallets = await agent.get(`${API}/wallets`).expect(200);
    expect(wallets.body.map((w: { name: string }) => w.name).sort()).toEqual(['Cash', 'Main Wallet', 'Savings']);
    const txns = await agent.get(`${API}/transactions`).query({ limit: 1 }).expect(200);
    expect(txns.body.meta.total).toBeGreaterThan(250);
  });

  it('gives every visitor their own isolated copy', async () => {
    const a = await startDemo();
    const b = await startDemo();
    expect(a.user.id).not.toBe(b.user.id);

    const [first] = (await a.agent.get(`${API}/transactions`).query({ limit: 1 }).expect(200)).body.data;
    await a.agent.delete(`${API}/transactions/${first.id}`).expect(204);
    // B can't see or touch A's rows, and A's delete doesn't change B's data.
    await b.agent.get(`${API}/transactions/${first.id}`).expect(404);
    const totalA = (await a.agent.get(`${API}/transactions`).query({ limit: 1 })).body.meta.total;
    const totalB = (await b.agent.get(`${API}/transactions`).query({ limit: 1 })).body.meta.total;
    expect(totalB).toBe(totalA + 1);
  });

  it('cannot be logged into with a password', async () => {
    const { user } = await startDemo();
    await request(app.getHttpServer())
      .post(`${API}/auth/login`)
      .send({ email: user.email, password: 'password123' })
      .expect(401);
  });

  it('deletes demo accounts older than 24 hours, and only demo accounts', async () => {
    const { user: expired } = await startDemo();
    const { user: fresh } = await startDemo();
    await prisma.user.update({
      where: { id: expired.id },
      data: { createdAt: new Date(Date.now() - DEMO_TTL_MS - 60_000) },
    });
    const regular = await prisma.user.findFirstOrThrow({ where: { NOT: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } } } });
    await prisma.user.update({ where: { id: regular.id }, data: { createdAt: new Date(0) } });

    expect(await app.get(DemoService).deleteExpired()).toBeGreaterThanOrEqual(1);

    expect(await prisma.user.findUnique({ where: { id: expired.id } })).toBeNull();
    expect(await prisma.transaction.count({ where: { userId: expired.id } })).toBe(0);
    expect(await prisma.user.findUnique({ where: { id: fresh.id } })).not.toBeNull();
    expect(await prisma.user.findUnique({ where: { id: regular.id } })).not.toBeNull();
  });
});
