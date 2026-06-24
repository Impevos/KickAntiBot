import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Beklenmeyen bir sunucu hatası oluştu.';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message.join(', ');
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        } else {
          message = exception.message;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(exception.message, exception.stack);

      if (exception.code === 'P2002') {
        statusCode = HttpStatus.CONFLICT;
        message = 'Bu kayıt zaten mevcut (e-posta veya benzersiz alan çakışması).';
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(statusCode).json({
      success: false,
      error: {
        statusCode,
        message,
      },
    });
  }
}
