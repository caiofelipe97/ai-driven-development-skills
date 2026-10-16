import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UnauthorizedError } from '@app/shared';
import { JwtTokenProvider } from '../../modules/auth/jwt.token';
import { IS_PUBLIC_KEY } from '../decorators';
import { AuthenticatedRequest } from '../types';
import { toCurrentUser } from './auth-user.mapper';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenProvider: JwtTokenProvider,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('auth.token.missing');
    }

    const payload = await this.tokenProvider.verify(token);

    if (!payload) {
      throw new UnauthorizedError('auth.token.invalid');
    }

    request.user = toCurrentUser(payload);

    return true;
  }
}

function extractBearerToken(header?: string): string | null {
  const [type, token] = header?.split(' ') ?? [];

  return type === 'Bearer' && token ? token : null;
}
