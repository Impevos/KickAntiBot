import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // CORS: yalnizca izin verilen origin'lere acik.
  // CORS_ORIGIN env'i virgulle ayrilmis liste olabilir; tanimsizsa gelistirme
  // ortami icin localhost frontend portlarina varsayilan olarak izin verilir.
  const corsOriginEnv = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = corsOriginEnv
    ? corsOriginEnv.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  // Global DTO dogrulamasi
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO'da tanimsiz alanlari temizler
      forbidNonWhitelisted: true, // Bilinmeyen alan gonderilirse 400 dondurur
      transform: true, // Gelen veriyi DTO tipine donusturur
    }),
  );

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
