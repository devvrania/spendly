import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { formatDate, parseDate } from '../common/utils/date';
import { money } from '../common/utils/money';
import { CreateTransactionDto, ListTransactionsQueryDto, UpdateTransactionDto } from './dto/transaction.dto';

const INCLUDE = {
  wallet: { select: { id: true, name: true, isArchived: true } },
  category: { select: { id: true, name: true, type: true, color: true, isArchived: true } },
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{ include: typeof INCLUDE }>;

function toDto(t: TransactionWithRelations) {
  return {
    id: t.id,
    amount: money(t.amount),
    type: t.type,
    description: t.description,
    transactionDate: formatDate(t.transactionDate),
    wallet: t.wallet,
    category: t.category,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, q: ListTransactionsQueryDto) {
    if (q.startDate && q.endDate && q.startDate > q.endDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }

    // userId is ALWAYS the first predicate; every filter narrows within the owner.
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(q.type && { type: q.type }),
      ...(q.walletId && { walletId: q.walletId }),
      ...(q.categoryId && { categoryId: q.categoryId }),
      ...((q.startDate || q.endDate) && {
        transactionDate: {
          ...(q.startDate && { gte: parseDate(q.startDate) }),
          ...(q.endDate && { lte: parseDate(q.endDate) }),
        },
      }),
      ...(q.search && { description: { contains: q.search, mode: 'insensitive' } }),
    };

    // Stable ordering: the requested field, then created_at and id as tie-breakers,
    // so rows never jump between pages when many share the same date/amount.
    const orderBy: Prisma.TransactionOrderByWithRelationInput[] = [
      { [q.sortBy]: q.sortOrder },
      ...(q.sortBy !== 'createdAt' ? [{ createdAt: q.sortOrder }] : []),
      { id: q.sortOrder },
    ];

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.transaction.count({ where }),
      this.prisma.transaction.findMany({
        where,
        orderBy,
        include: INCLUDE,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
    ]);

    return {
      data: rows.map(toDto),
      meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
    };
  }

  async get(userId: string, id: string) {
    const t = await this.prisma.transaction.findFirst({ where: { id, userId }, include: INCLUDE });
    if (!t) throw new NotFoundException('Transaction not found');
    return toDto(t);
  }

  async create(userId: string, dto: CreateTransactionDto) {
    await this.assertUsableWallet(userId, dto.walletId);
    await this.assertUsableCategory(userId, dto.categoryId, dto.type, { requireActive: true });

    const t = await this.prisma.transaction.create({
      data: {
        userId, // from the verified session, never from the request body
        walletId: dto.walletId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description || null,
        transactionDate: parseDate(dto.transactionDate),
      },
      include: INCLUDE,
    });
    return toDto(t);
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!existing) throw new NotFoundException('Transaction not found');

    const type = dto.type ?? existing.type;
    const walletId = dto.walletId ?? existing.walletId;
    const categoryId = dto.categoryId ?? existing.categoryId;

    // Archived wallets/categories stay valid on existing transactions, but you
    // cannot newly move a transaction INTO an archived one.
    if (walletId !== existing.walletId) await this.assertUsableWallet(userId, walletId);
    if (categoryId !== existing.categoryId || type !== existing.type) {
      await this.assertUsableCategory(userId, categoryId, type, {
        requireActive: categoryId !== existing.categoryId,
      });
    }

    const t = await this.prisma.transaction.update({
      where: { id },
      data: {
        type,
        walletId,
        categoryId,
        ...(dto.amount !== undefined && { amount: new Prisma.Decimal(dto.amount) }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.transactionDate !== undefined && { transactionDate: parseDate(dto.transactionDate) }),
      },
      include: INCLUDE,
    });
    return toDto(t);
  }

  async remove(userId: string, id: string) {
    const { count } = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    if (count === 0) throw new NotFoundException('Transaction not found');
  }

  private async assertUsableWallet(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({ where: { id: walletId, userId } });
    // Another user's wallet is reported exactly like a missing one: no existence leak.
    if (!wallet) throw new BadRequestException('Wallet not found');
    if (wallet.isArchived) throw new BadRequestException('This wallet is archived and cannot be used');
  }

  private async assertUsableCategory(
    userId: string,
    categoryId: string,
    type: TransactionType,
    opts: { requireActive: boolean },
  ) {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, userId } });
    if (!category) throw new BadRequestException('Category not found');
    if (opts.requireActive && category.isArchived) {
      throw new BadRequestException('This category is archived and cannot be used');
    }
    if (category.type !== type) {
      throw new BadRequestException(
        `Category "${category.name}" is an ${category.type.toLowerCase()} category and cannot be used for ${type.toLowerCase()} transactions`,
      );
    }
  }
}
