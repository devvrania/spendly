const REQUIRED = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'FRONTEND_URL'] as const;

export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  const secret = String(config.JWT_ACCESS_SECRET);
  if (config.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters in production');
  }
  return {
    ...config,
    TRUST_PROXY: parseTrustProxy(config.TRUST_PROXY),
    SWAGGER_ENABLED: config.SWAGGER_ENABLED === 'true',
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: Number(config.PORT ?? 4000),
    JWT_ACCESS_EXPIRES_IN: config.JWT_ACCESS_EXPIRES_IN ?? '1d',
  };
}

/** "" / "false" -> off, "true" -> trust all, "2" -> trust 2 hops. Anything else is a config error. */
function parseTrustProxy(raw: unknown): number | boolean {
  if (raw === undefined || raw === '' || raw === 'false' || raw === '0') return false;
  if (raw === 'true') return true;
  const hops = Number(raw);
  if (Number.isInteger(hops) && hops > 0) return hops;
  throw new Error(`TRUST_PROXY must be "true", "false" or a positive integer, got "${String(raw)}"`);
}
