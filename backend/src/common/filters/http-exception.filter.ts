import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private isDatabaseError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;
    
    const errorMessage = exception.message.toLowerCase();
    const databaseKeywords = [
      'database',
      'connection',
      'query',
      'sql',
      'postgres',
      'timeout',
      'connection pool',
      'econnrefused',
      'etimedout',
    ];

    return databaseKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private isPrismaError(exception: unknown): boolean {
    if (!(exception instanceof Error)) return false;
    
    // Prisma errors têm códigos que começam com P
    const prismaCode = (exception as any)?.code;
    if (prismaCode && typeof prismaCode === 'string' && prismaCode.startsWith('P')) {
      return true;
    }

    // Verificar se é instância de PrismaClientKnownRequestError ou similar
    const errorName = exception.constructor.name;
    return errorName.includes('Prisma') || errorName.includes('PrismaClient');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Erro interno do servidor';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : (message as any).message || 'Erro desconhecido',
      ...(typeof message === 'object' && message !== null ? message : {}),
    };

    // Detectar tipo de erro para melhor tratamento
    const isDatabaseError = this.isDatabaseError(exception);
    const isPrismaError = this.isPrismaError(exception);

    // Log error for debugging
    if (status >= 500) {
      const errorDetails = {
        message: exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
        type: exception?.constructor?.name,
        url: request.url,
        method: request.method,
        isDatabaseError,
        isPrismaError,
      };

      // Log detalhado para erros de banco de dados
      if (isDatabaseError || isPrismaError) {
        this.logger.error(
          `[DATABASE ERROR] ${request.method} ${request.url} - ${status}`,
          {
            error: exception instanceof Error ? exception.message : String(exception),
            code: (exception as any)?.code,
            meta: (exception as any)?.meta,
            stack: exception instanceof Error ? exception.stack?.substring(0, 500) : undefined,
          },
        );
      } else {
        console.error('[HTTP_EXCEPTION_FILTER] 500 Error:', JSON.stringify(errorDetails, null, 2));
        this.logger.error(
          `${request.method} ${request.url} - ${status}`,
          exception instanceof Error ? exception.stack : JSON.stringify(exception),
        );
      }

      // Melhorar mensagem de erro para desenvolvimento
      if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
        if (isDatabaseError || isPrismaError) {
          errorResponse.message = `Erro de banco de dados: ${exception instanceof Error ? exception.message : 'Erro desconhecido'}`;
          (errorResponse as any).debug = {
            type: 'database',
            code: (exception as any)?.code,
            meta: (exception as any)?.meta,
          };
        }
      }
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} - ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}

