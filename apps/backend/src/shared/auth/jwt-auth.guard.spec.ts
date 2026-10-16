import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenPayload } from '@app/auth';
import { UnauthorizedError } from '@app/shared';
import { JwtTokenProvider } from '../../modules/auth/jwt.token';
import { JwtAuthGuard } from './jwt-auth.guard';

class StubTokenProvider {
  async verify(token: string): Promise<TokenPayload | null> {
    return token === 'valid' ? { sub: 'user-id', email: 'maria@example.com' } : null;
  }
}

function makeContext(headers: Record<string, string> = {}) {
  const request: Record<string, unknown> = { headers };
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;

  return { context, request };
}

function makeGuard(isPublic = false) {
  const reflector = { getAllAndOverride: () => isPublic } as unknown as Reflector;

  return new JwtAuthGuard(reflector, new StubTokenProvider() as unknown as JwtTokenProvider);
}

describe('JwtAuthGuard', () => {
  it('deve liberar rotas marcadas com @Public sem token', async () => {
    const { context } = makeContext();

    await expect(makeGuard(true).canActivate(context)).resolves.toBe(true);
  });

  it('deve anexar o usuario autenticado ao request com token valido', async () => {
    const { context, request } = makeContext({ authorization: 'Bearer valid' });

    await expect(makeGuard().canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'user-id', email: 'maria@example.com' });
  });

  it.each([
    [{}, 'auth.token.missing'],
    [{ authorization: 'valid' }, 'auth.token.missing'],
    [{ authorization: 'Basic valid' }, 'auth.token.missing'],
    [{ authorization: 'Bearer ' }, 'auth.token.missing'],
    [{ authorization: 'Bearer invalid' }, 'auth.token.invalid'],
  ])('deve rejeitar headers %p com %s', async (headers, message) => {
    const { context, request } = makeContext(headers as Record<string, string>);
    const promise = makeGuard().canActivate(context);

    await expect(promise).rejects.toThrow(UnauthorizedError);
    await expect(promise).rejects.toMatchObject({ message, statusCode: 401 });
    expect(request.user).toBeUndefined();
  });
});
