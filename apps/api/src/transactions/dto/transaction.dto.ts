import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { IsCalendarDate } from '../../common/validators/is-calendar-date.validator';
import { IsPositiveMoney } from '../../common/validators/is-money.validator';
import { Trim } from '../../common/validators/trim.transform';

export class CreateTransactionDto {
  @ApiProperty({ example: '2500.00', description: 'Positive decimal, max 2 places. Send as a string.' })
  @IsPositiveMoney()
  amount: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  walletId: string;

  @ApiPropertyOptional({ example: 'Weekly groceries', nullable: true })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ example: '2026-11-17', description: 'Calendar date, YYYY-MM-DD' })
  @IsCalendarDate()
  transactionDate: string;
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export const SORTABLE_FIELDS = ['transactionDate', 'amount', 'createdAt'] as const;
export type SortableField = (typeof SORTABLE_FIELDS)[number];

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({ enum: SORTABLE_FIELDS, default: 'transactionDate' })
  @IsOptional()
  @IsIn(SORTABLE_FIELDS)
  sortBy: SortableField = 'transactionDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  walletId?: string;

  @ApiPropertyOptional({ example: '2026-11-01' })
  @IsOptional()
  @IsCalendarDate()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-30' })
  @IsOptional()
  @IsCalendarDate()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Case-insensitive match on description' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  search?: string;
}
