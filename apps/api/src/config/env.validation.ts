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
    NODE_ENV: config.NODE_ENV ?? 'development',
    PORT: Number(config.PORT ?? 4000),
    JWT_ACCESS_EXPIRES_IN: config.JWT_ACCESS_EXPIRES_IN ?? '1d',
  };
}
