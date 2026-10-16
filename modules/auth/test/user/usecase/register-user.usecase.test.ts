import { DomainError, ValidationException } from "@app/shared";
import { RegisterUser, User } from "../../../src";
import { FakeCryptoProvider, FakeUserRepository, makeUser } from "../../mock";

function getValidationMessages(error: unknown): string[] {
  return (error as ValidationException).errors.map((item) => item.message);
}

describe("RegisterUser", () => {
  afterEach(() => jest.restoreAllMocks());

  const input = {
    name: "Maria Silva",
    email: "  Maria@Example.COM ",
    password: "Strong@123",
  };

  test("deve validar, proteger a senha e persistir no caminho feliz", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    const { user } = await useCase.execute(input);

    expect(user).toBeInstanceOf(User);
    expect(user.name).toBe("Maria Silva");
    expect(user.email).toBe("maria@example.com");
    expect(user.password).not.toBe("Strong@123");
    await expect(cryptoProvider.compare("Strong@123", user.password)).resolves.toBe(true);
    expect(cryptoProvider.encryptedPasswords).toEqual(["Strong@123"]);
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(userRepository.users).toEqual([user]);
  });

  test.each([
    ["", ["user.password.required"]],
    ["fraca", ["user.password.strong.password"]],
    ["semnumero@A", ["user.password.strong.password"]],
    ["password", ["user.password.strong.password", "user.password.no.common.password"]],
  ])(
    "deve rejeitar a senha %p antes de qualquer efeito colateral",
    async (password, expected) => {
      const cryptoProvider = new FakeCryptoProvider();
      const userRepository = new FakeUserRepository();
      const findSpy = jest.spyOn(userRepository, "findByEmail");
      const useCase = new RegisterUser(cryptoProvider, userRepository);

      const error = await useCase.execute({ ...input, password }).catch((e) => e);

      expect(error).toBeInstanceOf(ValidationException);
      expect(getValidationMessages(error)).toEqual(expected);
      expect(findSpy).not.toHaveBeenCalled();
      expect(cryptoProvider.encryptedPasswords).toEqual([]);
      expect(userRepository.users).toEqual([]);
    },
  );

  test("deve rejeitar email ja cadastrado com 409 sem gerar hash", async () => {
    const existing = makeUser({ email: "maria@example.com" });
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository([existing]);
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    const error = await useCase.execute(input).catch((e) => e);

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toMatchObject({ message: "user.email.already.exists", statusCode: 409 });
    expect(cryptoProvider.encryptedPasswords).toEqual([]);
    expect(userRepository.users).toEqual([existing]);
  });

  test("deve propagar a validacao da entidade sem persistir", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const createSpy = jest.spyOn(userRepository, "create");
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    const error = await useCase
      .execute({ ...input, name: "Ana", email: "invalido" })
      .catch((e) => e);

    expect(getValidationMessages(error)).toEqual([
      "user.name.person.name",
      "user.email.invalid.email",
    ]);
    expect(createSpy).not.toHaveBeenCalled();
  });

  test.each([undefined, 123, { email: "x" }])(
    "deve tratar email nao-string %p como ausente, sem quebrar a busca",
    async (email) => {
      const userRepository = new FakeUserRepository();
      const findSpy = jest.spyOn(userRepository, "findByEmail");
      const useCase = new RegisterUser(new FakeCryptoProvider(), userRepository);

      const error = await useCase
        .execute({ ...input, email: email as unknown as string })
        .catch((e) => e);

      expect(findSpy).toHaveBeenCalledWith("");
      expect(getValidationMessages(error)).toEqual(["user.email.required"]);
    },
  );
});
