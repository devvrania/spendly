import type { NextConfig } from 'next';

/**
 * Production: the browser calls the API on the web app's own domain
 * (NEXT_PUBLIC_API_URL=/api/v1) and Next forwards it to the real API host
 * (API_PROXY_TARGET). Same domain means the HttpOnly session cookie is
 * first-party, so the browser sends it and the auth middleware can see it.
 * Locally neither is set and the browser talks to localhost:4000 directly.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/+$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hide the floating "N" dev-tools badge in local development.
  devIndicators: false,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [{ source: '/api/v1/:path*', destination: `${apiProxyTarget}/api/v1/:path*` }];
  },
};

export default nextConfig;
