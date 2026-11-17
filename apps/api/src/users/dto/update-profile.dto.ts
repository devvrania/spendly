import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../common/validators/trim.transform';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Ayesha Khan' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}
