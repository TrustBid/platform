import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'internal_error';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        code = codeFromStatus(status);
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;
        code = r.code ?? codeFromStatus(status);
        message = Array.isArray(r.message)
          ? r.message.join(', ')
          : (r.message ?? message);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({ error: { code, message } });
  }
}

function codeFromStatus(status: number): string {
  const map: Record<number, string> = {
    400: 'bad_request',
    401: 'unauthorized',
    403: 'forbidden',
    404: 'not_found',
    409: 'conflict',
    422: 'validation_error',
    500: 'internal_error',
  };
  return map[status] ?? 'error';
}
