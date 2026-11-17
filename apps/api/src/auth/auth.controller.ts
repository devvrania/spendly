import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UsersService } from '../users/users.service';
import { SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { durationToMs } from './duration';

const AUTH_RATE_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cookieOptions: CookieOptions;

  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    config: ConfigService,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.get('NODE_ENV') === 'production',
      path: '/',
      maxAge: durationToMs(config.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN')),
    };
  }

  @Public()
  @Throttle(AUTH_RATE_LIMIT)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.register(dto);
    res.cookie(SESSION_COOKIE, token, this.cookieOptions);
    return user;
  }

  @Public()
  @Throttle(AUTH_RATE_LIMIT)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, token } = await this.auth.login(dto);
    res.cookie(SESSION_COOKIE, token, this.cookieOptions);
    return user;
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge: _maxAge, ...rest } = this.cookieOptions;
    res.clearCookie(SESSION_COOKIE, rest);
  }

  @ApiCookieAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.users.getProfile(user.id);
  }
}
