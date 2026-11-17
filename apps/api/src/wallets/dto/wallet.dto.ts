import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { BooleanQuery } from '../../common/validators/boolean-query.transform';
import { Trim } from '../../common/validators/trim.transform';

export class CreateWalletDto {
  @ApiProperty({ example: 'Savings' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;
}

export class UpdateWalletDto extends CreateWalletDto {}

export class ListWalletsQueryDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @BooleanQuery()
  @IsBoolean()
  includeArchived?: boolean;
}
