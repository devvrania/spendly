import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { buildValidationException } from './common/filters/validation-exception.factory';

/**
 * Shared app wiring used by both main.ts and the e2e tests, so tests exercise
 * exactly the same pipes, filters, prefix and middleware as the real server.
 */
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);

  // Behind proxies (e.g. Vercel rewrite -> API host), req.ip would be the proxy's
  // address, so auth rate limiting would lump every visitor together. TRUST_PROXY
  // tells Express how many proxy hops to trust when reading X-Forwarded-For.
  const trustProxy = config.get<number | boolean>('TRUST_PROXY');
  if (trustProxy) (app as NestExpressApplication).set('trust proxy', trustProxy);

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: buildValidationException,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}
