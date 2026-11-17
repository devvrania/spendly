import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { SESSION_COOKIE } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // The browser session lives in an HttpOnly cookie. A Bearer header is also
      // accepted for API clients (curl, Swagger) that cannot hold cookies.
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.[SESSION_COOKIE] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: { sub?: string }): Promise<AuthUser> {
    if (!payload.sub) throw new UnauthorizedException();
    // Reject tokens for users that no longer exist.
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true } });
    if (!user) throw new UnauthorizedException();
    return { id: user.id };
  }
}
