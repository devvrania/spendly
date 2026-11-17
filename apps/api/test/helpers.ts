import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import TestAgent from 'supertest/lib/agent';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { PrismaService } from '../src/prisma/prisma.service';

export const API = '/api/v1';

export async function createTestApp() {
  if (!process.env.DATABASE_URL?.includes('spendly_test')) {
    // Guard rail: never run the destructive suite against a non-test database.
    throw new Error('E2E tests must run against the spendly_test database (use pnpm test)');
  }
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return { app, prisma: app.get(PrismaService) };
}

export interface TestUser {
  agent: TestAgent;
  id: string;
  email: string;
  password: string;
  mainWalletId: string;
  categories: Record<string, { id: string; type: 'INCOME' | 'EXPENSE' }>;
}

/** Registers a fresh user and returns a cookie-carrying agent plus their seeded ids. */
export async function registerUser(app: INestApplication, name = 'Test User'): Promise<TestUser> {
  const agent = request.agent(app.getHttpServer());
  const email = `user-${randomUUID()}@example.com`;
  const password = 'sup3r-secret-pass';
  const res = await agent.post(`${API}/auth/register`).send({ name, email, password }).expect(201);

  const wallets = await agent.get(`${API}/wallets`).expect(200);
  const cats = await agent.get(`${API}/categories`).expect(200);
  const categories = Object.fromEntries(
    cats.body.map((c: { name: string; id: string; type: 'INCOME' | 'EXPENSE' }) => [c.name, { id: c.id, type: c.type }]),
  );
  return { agent, id: res.body.id, email, password, mainWalletId: wallets.body[0].id, categories };
}

export function expense(user: TestUser, overrides: Record<string, unknown> = {}) {
  return {
    amount: '100.00',
    type: 'EXPENSE',
    categoryId: user.categories['Groceries'].id,
    walletId: user.mainWalletId,
    transactionDate: '2026-11-10',
    description: 'test expense',
    ...overrides,
  };
}

export function income(user: TestUser, overrides: Record<string, unknown> = {}) {
  return {
    amount: '1000.00',
    type: 'INCOME',
    categoryId: user.categories['Salary'].id,
    walletId: user.mainWalletId,
    transactionDate: '2026-11-01',
    ...overrides,
  };
}
