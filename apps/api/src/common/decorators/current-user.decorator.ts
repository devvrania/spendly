import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
}

/**
 * The authenticated principal, taken from the verified JWT. This is the ONLY
 * source of truth for ownership — never a userId from the body or query.
 */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});
