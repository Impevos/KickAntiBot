import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const server = express();
server.use(express.json({ limit: '1mb' }));
server.use(express.urlencoded({ extended: true }));

let nestReady: Promise<void> | null = null;

async function prepareNestApp(expressInstance: express.Express) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  const configService = app.get(ConfigService);
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');

  const allowedOrigins = corsOriginEnv
    ? corsOriginEnv.split(',').map((origin) => origin.trim())
    : true;

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
}

function restoreRequestUrl(req: express.Request) {
  // Vercel rewrite sonrası orijinal path korunmazsa NestJS route eşleşmez.
  const invokePath = req.headers['x-invoke-path'];
  const originalUrl = req.headers['x-vercel-original-url'];

  if (typeof invokePath === 'string' && invokePath.startsWith('/api')) {
    req.url = invokePath;
    return;
  }

  if (typeof originalUrl === 'string') {
    try {
      const parsed = new URL(originalUrl, 'http://localhost');
      req.url = parsed.pathname + parsed.search;
    } catch {
      // ignore malformed header
    }
  }
}

export default async function handler(req: express.Request, res: express.Response) {
  restoreRequestUrl(req);

  if (!nestReady) {
    nestReady = prepareNestApp(server);
  }
  await nestReady;
  return server(req, res);
}
