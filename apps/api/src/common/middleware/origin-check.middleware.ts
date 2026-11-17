import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-based auth (in addition to SameSite=Lax cookies).
 * Browsers always send an Origin header on cross-origin state-changing
 * requests, so any non-safe request whose Origin is not the frontend is
 * rejected. Requests without an Origin (curl, server-to-server, tests) carry no
 * ambient browser cookies from a third-party page and are allowed through to
 * normal authentication.
 */
@Injectable()
export class OriginCheckMiddleware implements NestMiddleware {
  private readonly allowed: string;

  constructor(config: ConfigService) {
    this.allowed = new URL(config.getOrThrow<string>('FRONTEND_URL')).origin;
  }

  use(req: Request, _res: Response, next: NextFunction) {
    const origin = req.headers.origin;
    if (!SAFE_METHODS.has(req.method) && origin && origin !== this.allowed) {
      throw new ForbiddenException('Cross-origin request rejected');
    }
    next();
  }
}
