import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { normalizeEmail } from './register.dto';

export class LoginDto {
  @ApiProperty({ example: 'ayesha@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
