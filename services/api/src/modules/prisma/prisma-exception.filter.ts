import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '../../generated/prisma/client';

const PRISMA_STATUS: Record<string, HttpStatus> = {
  P2002: HttpStatus.CONFLICT,
  P2003: HttpStatus.CONFLICT,
  P2004: HttpStatus.BAD_REQUEST,
  P2025: HttpStatus.NOT_FOUND,
};

const PRISMA_MESSAGE: Record<string, string> = {
  P2002: 'Resource already exists',
  P2003: 'Operation blocked: related records exist',
  P2004: 'A constraint on the record was violated',
  P2025: 'Resource not found',
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const status = PRISMA_STATUS[exception.code];
    if (status === undefined) throw exception;

    const response = host.switchToHttp().getResponse<Response>();
    response.status(status).json({
      statusCode: status,
      message: this.message(exception),
    });
  }

  private message(exception: Prisma.PrismaClientKnownRequestError): string {
    const base = PRISMA_MESSAGE[exception.code] ?? 'Database error';
    const target = exception.meta?.target;
    if (exception.code === 'P2002' && Array.isArray(target)) {
      return `${base}: ${target.join(', ')}`;
    }
    return base;
  }
}
