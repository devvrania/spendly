import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';
import { IsBoolean, IsEnum, IsHexColor, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { BooleanQuery } from '../../common/validators/boolean-query.transform';
import { Trim } from '../../common/validators/trim.transform';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Education' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  @MaxLength(20)
  color?: string;
}

/** Type is intentionally NOT editable: existing transactions depend on it. */
export class UpdateCategoryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsHexColor()
  @MaxLength(20)
  color?: string;
}

export class ListCategoriesQueryDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  includeArchived?: boolean;
}
