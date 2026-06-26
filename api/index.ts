import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

const server = express();
let nestReady: Promise<void> | null = null;

async function prepareNestApp(expressInstance: express.Express) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  const configService = app.get(ConfigService);
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');

  // Production (Vercel): CORS_ORIGIN env ile frontend URL'i verilir.
  // Tanimsizsa tum origin'lere izin ver (serverless tek domain deploy icin).
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

export default async function handler(req: express.Request, res: express.Response) {
  if (!nestReady) {
    nestReady = prepareNestApp(server);
  }
  await nestReady;
  return server(req, res);
}
