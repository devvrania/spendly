import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Category, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isForeignKeyViolation, rethrowUnique } from '../common/utils/prisma-errors';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

const DUPLICATE = 'You already have a category with this name and type';

function toDto(c: Category, transactionCount?: number) {
  return {
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
    isArchived: c.isArchived,
    createdAt: c.createdAt,
    ...(transactionCount !== undefined && { transactionCount }),
  };
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, type?: TransactionType, includeArchived = false) {
    const rows = await this.prisma.category.findMany({
      where: { userId, ...(type && { type }), ...(!includeArchived && { isArchived: false }) },
      orderBy: [{ type: 'asc' }, { isArchived: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { transactions: true } } },
    });
    return rows.map((c) => toDto(c, c._count.transactions));
  }

  async create(userId: string, dto: CreateCategoryDto) {
    try {
      return toDto(await this.prisma.category.create({ data: { ...dto, userId } }), 0);
    } catch (e) {
      rethrowUnique(e, DUPLICATE);
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOwned(userId, id);
    try {
      return toDto(await this.prisma.category.update({ where: { id }, data: dto }));
    } catch (e) {
      rethrowUnique(e, DUPLICATE);
    }
  }

  async setArchived(userId: string, id: string, isArchived: boolean) {
    await this.findOwned(userId, id);
    return toDto(await this.prisma.category.update({ where: { id }, data: { isArchived } }));
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id);
    const used = await this.prisma.transaction.count({ where: { userId, categoryId: id } });
    if (used > 0) throw inUse();
    try {
      await this.prisma.category.delete({ where: { id } });
    } catch (e) {
      if (isForeignKeyViolation(e)) throw inUse();
      throw e;
    }
  }

  private async findOwned(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}

function inUse() {
  return new ConflictException('This category is used by transactions. Archive it instead of deleting it.');
}
