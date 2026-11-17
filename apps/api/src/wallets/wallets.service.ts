import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { isForeignKeyViolation, rethrowUnique } from '../common/utils/prisma-errors';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';

const DUPLICATE = 'You already have a wallet with this name';

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
  ) {}

  /** Wallets with their derived (never stored) balances. */
  async list(userId: string, includeArchived = false) {
    const balances = await this.analytics.walletBalances(userId);
    return includeArchived ? balances : balances.filter((w) => !w.isArchived);
  }

  async get(userId: string, id: string) {
    const [wallet] = await this.analytics.walletBalances(userId, id);
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(userId: string, dto: CreateWalletDto) {
    try {
      const w = await this.prisma.wallet.create({ data: { userId, name: dto.name } });
      return this.get(userId, w.id);
    } catch (e) {
      rethrowUnique(e, DUPLICATE);
    }
  }

  async rename(userId: string, id: string, dto: UpdateWalletDto) {
    await this.findOwned(userId, id);
    try {
      await this.prisma.wallet.update({ where: { id }, data: { name: dto.name } });
    } catch (e) {
      rethrowUnique(e, DUPLICATE);
    }
    return this.get(userId, id);
  }

  async setArchived(userId: string, id: string, isArchived: boolean) {
    const wallet = await this.findOwned(userId, id);
    if (isArchived && !wallet.isArchived) {
      const active = await this.prisma.wallet.count({ where: { userId, isArchived: false } });
      if (active <= 1) {
        throw new BadRequestException('You need at least one active wallet to record transactions');
      }
    }
    await this.prisma.wallet.update({ where: { id }, data: { isArchived } });
    return this.get(userId, id);
  }

  /**
   * Hard delete is only possible for a wallet with no transactions. The
   * composite FK from transactions enforces this in the database as well.
   */
  async remove(userId: string, id: string) {
    const wallet = await this.findOwned(userId, id);
    const used = await this.prisma.transaction.count({ where: { userId, walletId: id } });
    if (used > 0) throw inUse();
    if (!wallet.isArchived) {
      const active = await this.prisma.wallet.count({ where: { userId, isArchived: false } });
      if (active <= 1) throw new BadRequestException('You cannot delete your only active wallet');
    }
    try {
      await this.prisma.wallet.delete({ where: { id } });
    } catch (e) {
      if (isForeignKeyViolation(e)) throw inUse();
      throw e;
    }
  }

  private async findOwned(userId: string, id: string) {
    const wallet = await this.prisma.wallet.findFirst({ where: { id, userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }
}

function inUse() {
  return new ConflictException('This wallet has transactions. Archive it instead of deleting it.');
}
