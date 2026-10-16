import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { DomainError, ValidationError, ValidationException } from '@app/shared';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ApiErrorResponse } from './error-response.type';

type ErrorBody = Pick<ApiErrorResponse, 'statusCode' | 'message' | 'details'>;

const PRISMA_ERRORS: Record<string, ErrorBody> = {
  P2002: { statusCode: HttpStatus.CONFLICT, message: 'resource.already.exists' },
  P2025: { statusCode: HttpStatus.NOT_FOUND, message: 'resource.not.found' },
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const body = this.toErrorBody(exception);

    const payload: ApiErrorResponse = {
      statusCode: body.statusCode,
      error: errorName(body.statusCode),
      message: body.message,
      ...(body.details !== undefined && { details: body.details }),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(body.statusCode).json(payload);
  }

  private toErrorBody(exception: unknown): ErrorBody {
    if (exception instanceof ValidationException) {
      return {
        statusCode: exception.statusCode,
        message: exception.message,
        details: exception.errors.map((error) => ({ code: error.message })),
      };
    }

    if (exception instanceof ValidationError) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: exception.message,
        details: [{ code: exception.message }],
      };
    }

    if (exception instanceof DomainError) {
      return { statusCode: exception.statusCode, message: exception.message };
    }

    if (exception instanceof HttpException) {
      return fromHttpException(exception);
    }

    if (
      exception instanceof Prisma.PrismaClientKnownRequestError &&
      PRISMA_ERRORS[exception.code]
    ) {
      return PRISMA_ERRORS[exception.code];
    }

    this.logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'internal.server.error',
    };
  }
}

function fromHttpException(exception: HttpException): ErrorBody {
  const statusCode = exception.getStatus();
  const response = exception.getResponse();

  if (typeof response === 'string') {
    return { statusCode, message: response };
  }

  const { message } = response as { message?: string | string[] };

  if (Array.isArray(message)) {
    return { statusCode, message: exception.message, details: message };
  }

  return { statusCode, message: message ?? exception.message };
}

function errorName(statusCode: number): string {
  const name = HttpStatus[statusCode] as string | undefined;

  return name ?? 'ERROR';
}
