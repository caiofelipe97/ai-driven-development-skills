import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  ValidationException,
} from '@app/shared';
import { Prisma } from '@prisma/client';
import { ApiExceptionFilter } from './api-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/test' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;

  new ApiExceptionFilter().catch(exception, host);

  return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError('db error', {
    code,
    clientVersion: 'test',
  });
}

describe('ApiExceptionFilter', () => {
  it('deve responder ValidationException com 422 e details estruturados', () => {
    const { status, body } = run(
      new ValidationException([
        new ValidationError('user.email.invalid.email'),
        new ValidationError('user.name.required'),
      ]),
    );

    expect(status).toBe(422);
    expect(body).toMatchObject({
      statusCode: 422,
      error: 'UNPROCESSABLE_ENTITY',
      message: 'Validation failed',
      details: [{ code: 'user.email.invalid.email' }, { code: 'user.name.required' }],
      path: '/test',
    });
    expect(new Date(body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('deve responder ValidationError avulso com 422', () => {
    const { status, body } = run(new ValidationError('user.name.required'));

    expect(status).toBe(422);
    expect(body.details).toEqual([{ code: 'user.name.required' }]);
  });

  it.each([
    [new NotFoundError('user.not.found'), 404, 'NOT_FOUND'],
    [new UnauthorizedError('auth.token.invalid'), 401, 'UNAUTHORIZED'],
  ])('deve respeitar o statusCode do DomainError', (error, statusCode, name) => {
    const { status, body } = run(error);

    expect(status).toBe(statusCode);
    expect(body).toMatchObject({ statusCode, error: name, message: error.message });
    expect(body).not.toHaveProperty('details');
  });

  it('deve normalizar HttpException com mensagem simples', () => {
    const { status, body } = run(new NotFoundException('Cannot GET /x'));

    expect(status).toBe(404);
    expect(body).toMatchObject({ statusCode: 404, message: 'Cannot GET /x' });
  });

  it('deve normalizar HttpException com lista de mensagens e resposta string', () => {
    const list = run(new BadRequestException(['a must be string', 'b is required']));
    const plain = run(new BadRequestException());

    expect(list.status).toBe(400);
    expect(list.body.details).toEqual(['a must be string', 'b is required']);
    expect(plain.body.message).toBe('Bad Request');
  });

  it('deve traduzir erros conhecidos do Prisma', () => {
    expect(run(prismaError('P2002'))).toMatchObject({
      status: HttpStatus.CONFLICT,
      body: { message: 'resource.already.exists', error: 'CONFLICT' },
    });
    expect(run(prismaError('P2025')).status).toBe(HttpStatus.NOT_FOUND);
  });

  it('deve responder 500 sem vazar detalhes para erros inesperados', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    for (const error of [new Error('segredo interno'), prismaError('P9999'), 'falha']) {
      const { status, body } = run(error);

      expect(status).toBe(500);
      expect(body.message).toBe('internal.server.error');
      expect(JSON.stringify(body)).not.toContain('segredo');
    }

    expect(logSpy).toHaveBeenCalledTimes(3);
    logSpy.mockRestore();
  });
});
