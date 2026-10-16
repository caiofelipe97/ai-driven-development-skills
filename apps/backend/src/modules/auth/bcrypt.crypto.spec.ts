import { BcryptHashRule } from '@app/shared';
import { BcryptCryptoProvider } from './bcrypt.crypto';

describe('BcryptCryptoProvider', () => {
  const provider = new BcryptCryptoProvider();

  it('deve gerar um hash bcrypt valido e diferente da senha', async () => {
    const hashed = await provider.encrypt('Strong@123');

    expect(hashed).not.toBe('Strong@123');
    expect(hashed.startsWith('$2b$12$')).toBe(true);
    expect(new BcryptHashRule().validate(hashed)).toBeNull();
  });

  it('deve gerar hashes diferentes para a mesma senha (salt)', async () => {
    const [first, second] = await Promise.all([
      provider.encrypt('Strong@123'),
      provider.encrypt('Strong@123'),
    ]);

    expect(first).not.toBe(second);
  });

  it('deve comparar a senha com o hash', async () => {
    const hashed = await provider.encrypt('Strong@123');

    await expect(provider.compare('Strong@123', hashed)).resolves.toBe(true);
    await expect(provider.compare('Wrong@123', hashed)).resolves.toBe(false);
  });
});
