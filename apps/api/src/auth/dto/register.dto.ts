import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Trim } from '../../common/validators/trim.transform';

export const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({ example: 'Ayesha Khan' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'ayesha@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'correct horse battery staple', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
