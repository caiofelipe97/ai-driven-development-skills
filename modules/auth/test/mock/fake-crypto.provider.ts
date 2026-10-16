import { CryptoProvider } from "../../src";
import { VALID_PASSWORD_HASH } from "./user.factory";

export class FakeCryptoProvider implements CryptoProvider {
  readonly encryptedPasswords: string[] = [];
  private readonly hashes = new Map<string, string>();

  async encrypt(password: string): Promise<string> {
    this.encryptedPasswords.push(password);

    const hashedPassword = `${VALID_PASSWORD_HASH.slice(0, -2)}${String(this.encryptedPasswords.length).padStart(2, "0")}`;
    this.hashes.set(hashedPassword, password);

    return hashedPassword;
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return this.hashes.get(hashedPassword) === password;
  }
}
