import { User, UserState } from "../../src";

export const VALID_PASSWORD_HASH = `$2b$10$${"a".repeat(53)}`;

export function makeUser(overrides: Partial<UserState> = {}): User {
  return new User({
    name: "Maria Silva",
    email: "maria@example.com",
    password: VALID_PASSWORD_HASH,
    ...overrides,
  });
}
