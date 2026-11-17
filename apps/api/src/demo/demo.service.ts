import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { randomBytes, randomUUID } from 'crypto';
import { DEFAULT_CATEGORIES } from '../auth/defaults';
import { PrismaService } from '../prisma/prisma.service';
import { buildDemoTransactions, DEMO_EMAIL_DOMAIN, DEMO_WALLET_NAMES } from './demo-data';

/** Demo accounts are deleted (with all their rows, via cascade) after this long. */
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * "Try the demo": every visitor gets their OWN short-lived account, pre-filled
 * with sample data. Visitors never see or change each other's data, so one
 * person deleting everything doesn't break the demo for the next.
 *
 * Demo accounts can't be logged into with a password: the stored hash is of a
 * random secret that is thrown away, so the only way in is the session cookie
 * issued here.
 */
@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createDemoUser() {
    await this.deleteExpired();

    const passwordHash = await argon2.hash(randomBytes(32).toString('hex'), { type: argon2.argon2id });
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: 'Rania',
          email: `demo-${randomUUID()}@${DEMO_EMAIL_DOMAIN}`,
          passwordHash,
          wallets: { create: DEMO_WALLET_NAMES.map((name) => ({ name })) },
          categories: { create: DEFAULT_CATEGORIES },
        },
        include: { wallets: true, categories: true },
      });
      await tx.transaction.createMany({
        data: buildDemoTransactions({
          userId: user.id,
          wallets: Object.fromEntries(user.wallets.map((w) => [w.name, w.id])),
          categories: Object.fromEntries(user.categories.map((c) => [c.name, c])),
        }),
      });
      return user;
    });
  }

  /** Housekeeping on each new demo: drop demo accounts older than the TTL. */
  async deleteExpired(now = new Date()) {
    const { count } = await this.prisma.user.deleteMany({
      where: {
        email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` },
        createdAt: { lt: new Date(now.getTime() - DEMO_TTL_MS) },
      },
    });
    if (count) this.logger.log(`Deleted ${count} expired demo account(s)`);
    return count;
  }
}
