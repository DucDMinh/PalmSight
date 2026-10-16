import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

// Cookie-authenticated endpoints (/auth/refresh, /auth/logout) only accept requests sent by our own SPA
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const origin = context.switchToHttp().getRequest<Request>().headers.origin;
    const allowedOrigin = this.configService
      .get<string>('PUBLIC_BASE_URL', 'http://localhost:5173')
      .replace(/\/+$/, '');

    if (origin !== allowedOrigin) {
      throw new ForbiddenException({
        code: 'ORIGIN_NOT_ALLOWED',
        message: 'Yêu cầu không được phép từ nguồn này.',
      });
    }
    return true;
  }
}
