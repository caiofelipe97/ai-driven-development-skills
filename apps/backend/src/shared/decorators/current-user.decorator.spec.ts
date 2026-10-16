import { ExecutionContext } from '@nestjs/common';
import { getCurrentUser } from './current-user.decorator';

function makeContext(user?: unknown) {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('CurrentUser', () => {
  const user = { id: 'user-id', email: 'maria@example.com' };

  it('deve retornar o usuario inteiro sem chave', () => {
    expect(getCurrentUser(undefined, makeContext(user))).toEqual(user);
  });

  it('deve retornar uma propriedade especifica', () => {
    expect(getCurrentUser('id', makeContext(user))).toBe('user-id');
    expect(getCurrentUser('email', makeContext(user))).toBe('maria@example.com');
  });

  it('deve retornar undefined quando nao houver usuario autenticado', () => {
    expect(getCurrentUser(undefined, makeContext())).toBeUndefined();
    expect(getCurrentUser('id', makeContext())).toBeUndefined();
  });
});
