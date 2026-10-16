import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { JwtTokenProvider } from './jwt.token';

const SECRET = 'test-secret';

function makeProvider(env: Record<string, string> = {}) {
  return new JwtTokenProvider(new ConfigService({ JWT_SECRET: SECRET, ...env }));
}

describe('JwtTokenProvider', () => {
  const payload = { sub: 'user-id', email: 'maria@example.com' };

  it('deve gerar um token verificavel com o mesmo payload', async () => {
    const provider = makeProvider();

    const token = await provider.generate(payload);

    expect(token.split('.')).toHaveLength(3);
    await expect(provider.verify(token)).resolves.toEqual(payload);
  });

  it('deve exigir JWT_SECRET', () => {
    expect(() => new JwtTokenProvider(new ConfigService({}))).toThrow();
  });

  it('deve retornar null para token invalido ou assinado com outro segredo', async () => {
    const provider = makeProvider();
    const foreign = sign({ email: payload.email }, 'other-secret', { subject: payload.sub });

    await expect(provider.verify('invalid')).resolves.toBeNull();
    await expect(provider.verify(foreign)).resolves.toBeNull();
  });

  it('deve retornar null para token expirado', async () => {
    const provider = makeProvider({ JWT_EXPIRES_IN: '-1s' });

    const token = await provider.generate(payload);

    await expect(provider.verify(token)).resolves.toBeNull();
  });

  it('deve retornar null quando o payload nao tiver sub ou email', async () => {
    const provider = makeProvider();

    await expect(provider.verify(sign({ email: payload.email }, SECRET))).resolves.toBeNull();
    await expect(provider.verify(sign({}, SECRET, { subject: 'x' }))).resolves.toBeNull();
    await expect(provider.verify(sign('plain-string', SECRET))).resolves.toBeNull();
  });
});
