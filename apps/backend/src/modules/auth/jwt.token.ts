import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenPayload, TokenProvider } from '@app/auth';
import { sign, SignOptions, verify } from 'jsonwebtoken';

const DEFAULT_EXPIRES_IN = '1d';

@Injectable()
export class JwtTokenProvider implements TokenProvider {
  private readonly secret: string;
  private readonly expiresIn: SignOptions['expiresIn'];

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('JWT_SECRET');
    this.expiresIn = config.get('JWT_EXPIRES_IN', DEFAULT_EXPIRES_IN) as SignOptions['expiresIn'];
  }

  async generate(payload: TokenPayload): Promise<string> {
    return sign({ email: payload.email }, this.secret, {
      subject: payload.sub,
      expiresIn: this.expiresIn,
    });
  }

  async verify(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = verify(token, this.secret);

      if (typeof decoded === 'string' || !decoded.sub || typeof decoded.email !== 'string') {
        return null;
      }

      return { sub: decoded.sub, email: decoded.email };
    } catch {
      return null;
    }
  }
}
