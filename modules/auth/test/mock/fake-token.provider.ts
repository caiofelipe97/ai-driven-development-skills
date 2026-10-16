import { TokenPayload, TokenProvider } from "../../src";

export class FakeTokenProvider implements TokenProvider {
  private readonly tokens = new Map<string, TokenPayload>();

  async generate(payload: TokenPayload): Promise<string> {
    const token = `fake-token-${this.tokens.size + 1}`;
    this.tokens.set(token, { ...payload });

    return token;
  }

  async verify(token: string): Promise<TokenPayload | null> {
    return this.tokens.get(token) ?? null;
  }
}
