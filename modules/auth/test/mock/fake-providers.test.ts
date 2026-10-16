import { BcryptHashRule } from "@app/shared";
import { FakeCryptoProvider, FakeTokenProvider } from ".";

describe("FakeCryptoProvider", () => {
  test("deve gerar hashes bcrypt validos, distintos e comparaveis", async () => {
    const crypto = new FakeCryptoProvider();

    const first = await crypto.encrypt("Strong@123");
    const second = await crypto.encrypt("Other@456");

    expect(new BcryptHashRule().validate(first)).toBeNull();
    expect(first).not.toBe(second);
    expect(crypto.encryptedPasswords).toEqual(["Strong@123", "Other@456"]);
    await expect(crypto.compare("Strong@123", first)).resolves.toBe(true);
    await expect(crypto.compare("Strong@123", second)).resolves.toBe(false);
    await expect(crypto.compare("Strong@123", "unknown")).resolves.toBe(false);
  });
});

describe("FakeTokenProvider", () => {
  test("deve gerar tokens e recuperar o payload", async () => {
    const tokens = new FakeTokenProvider();
    const payload = { sub: "user-id", email: "maria@example.com" };

    const token = await tokens.generate(payload);

    await expect(tokens.verify(token)).resolves.toEqual(payload);
    await expect(tokens.verify("invalid")).resolves.toBeNull();
  });
});
