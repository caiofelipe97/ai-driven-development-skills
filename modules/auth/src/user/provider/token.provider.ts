export interface TokenPayload {
  sub: string;
  email: string;
}

export interface TokenProvider {
  generate(payload: TokenPayload): Promise<string>;
  verify(token: string): Promise<TokenPayload | null>;
}
