import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Normalizes every error into `{ statusCode, error, message, errors? }`.
 * Database errors are translated into safe HTTP errors; raw database messages,
 * SQL, and stack traces are never sent to the client.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toResponse(exception);
    res.status(status).json(body);
  }

  private toResponse(exception: unknown): { status: number; body: Record<string, unknown> } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const body =
        typeof payload === 'string'
          ? { statusCode: status, error: statusName(status), message: payload }
          : { statusCode: status, error: statusName(status), ...payload };
      return { status, body };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return conflict('A record with the same unique value already exists');
        case 'P2003':
          return conflict('This record is still referenced by other records');
        case 'P2025':
          return {
            status: 404,
            body: { statusCode: 404, error: 'Not Found', message: 'Resource not found' },
          };
      }
    }

    this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    return {
      status: 500,
      body: { statusCode: 500, error: 'Internal Server Error', message: 'Something went wrong' },
    };
  }
}

function statusName(status: number): string {
  const key = HttpStatus[status];
  if (!key) return 'Error';
  return key
    .toLowerCase()
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function conflict(message: string) {
  return { status: 409, body: { statusCode: 409, error: 'Conflict', message } };
}
