import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Hide the floating "N" dev-tools badge in local development.
  devIndicators: false,
};

export default nextConfig;
