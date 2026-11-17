import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'spendly_session';
const PRIVATE = ['/dashboard', '/transactions', '/categories', '/wallets', '/settings'];

/**
 * UX-only gate: send visitors without a session cookie straight to /login.
 * This is NOT the security boundary; the API verifies the JWT on every request.
 * (Cookies are scoped by host, not port, so the API's cookie on localhost:4000
 * is visible here on localhost:3000.)
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // Signed-in visitors skip the landing page.
  if (pathname === '/' && req.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  const isPrivate = PRIVATE.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isPrivate && !req.cookies.has(SESSION_COOKIE)) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico|.*\\..*).*)'] };
