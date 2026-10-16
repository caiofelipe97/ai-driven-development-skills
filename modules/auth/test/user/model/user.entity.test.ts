import { ValidationException } from "@app/shared";
import { User, UserState } from "../../../src/user/model/user.entity";

const VALID_HASH = `$2b$10$${"a".repeat(53)}`;

function makeState(overrides: Partial<UserState> = {}): UserState {
  return {
    name: "Maria Silva",
    email: "maria@example.com",
    password: VALID_HASH,
    ...overrides,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("User", () => {
  describe("criacao", () => {
    test("deve criar um usuario valido com getters corretos", () => {
      const user = new User(makeState());

      expect(user.name).toBe("Maria Silva");
      expect(user.email).toBe("maria@example.com");
      expect(user.password).toBe(VALID_HASH);
      expect(() => user.validate()).not.toThrow();
    });

    test("deve gerar id e timestamps herdados da entidade base", () => {
      const user = new User(makeState());

      expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt.getTime()).toBe(user.createdAt.getTime());
      expect(user.deletedAt).toBeNull();
    });

    test("deve preservar id, timestamps e deletedAt informados", () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      const updatedAt = new Date("2026-01-02T00:00:00.000Z");
      const deletedAt = new Date("2026-01-03T00:00:00.000Z");
      const id = "8f14e45f-ceea-4e6e-9b1a-2f4a1c6b7d3e";

      const user = new User(makeState({ id, createdAt, updatedAt, deletedAt }));

      expect(user.id).toBe(id);
      expect(user.createdAt.getTime()).toBe(createdAt.getTime());
      expect(user.updatedAt.getTime()).toBe(updatedAt.getTime());
      expect(user.deletedAt?.getTime()).toBe(deletedAt.getTime());
    });

    test("deve falhar imediatamente com id invalido (validacao da base)", () => {
      expect(getValidationMessages(() => new User(makeState({ id: "abc" })))).toEqual([
        "id.uuid",
      ]);
    });
  });

  describe("validacao lazy", () => {
    test("deve permitir instanciar usuario invalido sem lancar erro", () => {
      expect(
        () => new User(makeState({ name: "", email: "x", password: "123" })),
      ).not.toThrow();
    });

    test("deve acumular todos os erros ao chamar validate()", () => {
      const user = new User(makeState({ name: "", email: "", password: "" }));

      expect(getValidationMessages(() => user.validate())).toEqual([
        "user.name.required",
        "user.email.required",
        "user.password.required",
      ]);
    });

    test("deve lancar ValidationException", () => {
      const user = new User(makeState({ email: "invalido" }));

      expect(() => user.validate()).toThrow(ValidationException);
    });
  });

  describe("name", () => {
    test.each([
      ["Jo Li", []],
      ["Ana", ["user.name.person.name"]],
      ["Jo", ["user.name.min.length", "user.name.person.name"]],
      ["Maria123 Silva", ["user.name.person.name"]],
      ["Ana-Clara D'Avila", []],
      [`Maria ${"a".repeat(74)}`, []],
      [`Maria ${"a".repeat(75)}`, ["user.name.max.length"]],
      ["   ", ["user.name.required"]],
    ])("name %p deve gerar %p", (name, expected) => {
      const user = new User(makeState({ name }));

      expect(getValidationMessages(() => user.validate())).toEqual(expected);
    });
  });

  describe("email", () => {
    test.each([
      ["maria@example.com", []],
      ["  maria@example.com  ", []],
      ["maria@example", ["user.email.invalid.email"]],
      ["maria example.com", ["user.email.invalid.email"]],
      ["@example.com", ["user.email.invalid.email"]],
    ])("email %p deve gerar %p", (email, expected) => {
      const user = new User(makeState({ email }));

      expect(getValidationMessages(() => user.validate())).toEqual(expected);
    });
  });

  describe("password", () => {
    test.each([
      [VALID_HASH, []],
      [`$2a$12$${"Z".repeat(53)}`, []],
      ["senha-em-texto-puro", ["user.password.bcrypt.hash"]],
      [`$2b$10$${"a".repeat(52)}`, ["user.password.bcrypt.hash"]],
      [`$3b$10$${"a".repeat(53)}`, ["user.password.bcrypt.hash"]],
    ])("password %p deve gerar %p", (password, expected) => {
      const user = new User(makeState({ password }));

      expect(getValidationMessages(() => user.validate())).toEqual(expected);
    });
  });

  describe("clone", () => {
    test("deve preservar id e createdAt e atualizar updatedAt", () => {
      const createdAt = new Date("2026-01-01T00:00:00.000Z");
      const user = new User(makeState({ createdAt }));

      const cloned = user.clone({ name: "Joao Souza" });

      expect(cloned).toBeInstanceOf(User);
      expect(cloned).not.toBe(user);
      expect(cloned.id).toBe(user.id);
      expect(cloned.equals(user)).toBe(true);
      expect(cloned.createdAt.getTime()).toBe(createdAt.getTime());
      expect(cloned.updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
      expect(cloned.name).toBe("Joao Souza");
      expect(cloned.email).toBe(user.email);
      expect(user.name).toBe("Maria Silva");
    });

    test("deve aceitar deletedAt no clone para soft delete", () => {
      const deletedAt = new Date("2026-02-01T00:00:00.000Z");
      const cloned = new User(makeState()).clone({ deletedAt });

      expect(cloned.deletedAt?.getTime()).toBe(deletedAt.getTime());
    });

    test("deve manter a validacao lazy apos clone", () => {
      const cloned = new User(makeState()).clone({ email: "invalido" });

      expect(getValidationMessages(() => cloned.validate())).toEqual([
        "user.email.invalid.email",
      ]);
    });
  });
});
