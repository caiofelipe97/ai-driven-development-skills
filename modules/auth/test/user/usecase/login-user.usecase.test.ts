import { UnauthorizedError } from "@app/shared";
import { LoginUser, User } from "../../../src";
import { FakeCryptoProvider, FakeTokenProvider, FakeUserRepository } from "../../mock";

async function setup(options: { deleted?: boolean } = {}) {
  const cryptoProvider = new FakeCryptoProvider();
  const tokenProvider = new FakeTokenProvider();
  const user = new User({
    name: "Maria Silva",
    email: "maria@example.com",
    password: await cryptoProvider.encrypt("Strong@123"),
    deletedAt: options.deleted ? new Date() : null,
  });
  const userRepository = new FakeUserRepository([user]);
  const useCase = new LoginUser(cryptoProvider, tokenProvider, userRepository);

  return { useCase, user, cryptoProvider, tokenProvider };
}

describe("LoginUser", () => {
  afterEach(() => jest.restoreAllMocks());

  test("deve autenticar e gerar token com sub e email", async () => {
    const { useCase, user, tokenProvider } = await setup();

    const result = await useCase.execute({
      email: " MARIA@example.com ",
      password: "Strong@123",
    });

    expect(result.user).toBe(user);
    await expect(tokenProvider.verify(result.accessToken)).resolves.toEqual({
      sub: user.id,
      email: "maria@example.com",
    });
  });

  test.each([
    ["email inexistente", { email: "joao@example.com", password: "Strong@123" }],
    ["senha errada", { email: "maria@example.com", password: "Wrong@123" }],
    ["email ausente", { email: undefined, password: "Strong@123" }],
    ["senha ausente", { email: "maria@example.com", password: undefined }],
  ])("deve rejeitar %s com a mesma mensagem generica", async (_, credentials) => {
    const { useCase, tokenProvider } = await setup();
    const generateSpy = jest.spyOn(tokenProvider, "generate");

    const promise = useCase.execute(credentials as { email: string; password: string });

    await expect(promise).rejects.toThrow(UnauthorizedError);
    await expect(promise).rejects.toMatchObject({
      message: "auth.invalid.credentials",
      statusCode: 401,
    });
    expect(generateSpy).not.toHaveBeenCalled();
  });

  test("deve rejeitar usuario excluido sem comparar a senha", async () => {
    const { useCase, cryptoProvider } = await setup({ deleted: true });
    const compareSpy = jest.spyOn(cryptoProvider, "compare");

    await expect(
      useCase.execute({ email: "maria@example.com", password: "Strong@123" }),
    ).rejects.toThrow(UnauthorizedError);
    expect(compareSpy).not.toHaveBeenCalled();
  });
});
