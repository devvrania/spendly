import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Matches, Max, Min } from 'class-validator';
import { IsCalendarDate } from '../../common/validators/is-calendar-date.validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01', description: 'Defaults to the first day of the current month' })
  @IsOptional()
  @IsCalendarDate()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-11-30', description: 'Defaults to the last day of the current month' })
  @IsOptional()
  @IsCalendarDate()
  endDate?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Restrict to one wallet' })
  @IsOptional()
  @IsUUID()
  walletId?: string;
}

export class CategoryBreakdownQueryDto extends DateRangeQueryDto {
  @ApiPropertyOptional({ enum: TransactionType, default: TransactionType.EXPENSE })
  @IsOptional()
  @IsEnum(TransactionType)
  type: TransactionType = TransactionType.EXPENSE;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, description: 'Top N categories (e.g. 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class MonthlyTrendQueryDto {
  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months: number = 6;

  @ApiPropertyOptional({ example: '2026-11', description: 'Last month in the series (YYYY-MM). Defaults to current month.' })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'endMonth must be in YYYY-MM format' })
  endMonth?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  walletId?: string;
}
