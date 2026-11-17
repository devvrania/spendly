import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { SESSION_COOKIE } from './auth/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(ConfigService);

  if (config.get('NODE_ENV') !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('Spendly API')
      .setDescription(
        'Personal finance tracker API. Authenticate via POST /auth/login; the session is an HttpOnly cookie.',
      )
      .setVersion('1.0')
      .addCookieAuth(SESSION_COOKIE)
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  console.log(`Spendly API listening on http://localhost:${port}/api/v1 (docs: /api/docs)`);
}

void bootstrap();
