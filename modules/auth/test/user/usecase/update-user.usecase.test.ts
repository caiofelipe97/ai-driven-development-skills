import { ForbiddenError, NotFoundError, ValidationException } from "@app/shared";
import { UpdateUser, User } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("UpdateUser", () => {
  afterEach(() => jest.restoreAllMocks());

  test("deve atualizar nome e email (normalizado) do proprio usuario", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new UpdateUser(userRepository);

    const updated = await useCase.execute({
      requesterId: user.id,
      id: user.id,
      name: "Maria Souza",
      email: "  Maria.Souza@Example.COM ",
    });

    expect(updated.id).toBe(user.id);
    expect(updated.name).toBe("Maria Souza");
    expect(updated.email).toBe("maria.souza@example.com");
    expect(updated.password).toBe(user.password);
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(userRepository.users).toEqual([updated]);
  });

  test("deve manter campos nao informados", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const useCase = new UpdateUser(userRepository);

    const updated = await useCase.execute({ requesterId: user.id, id: user.id });

    expect(updated.name).toBe(user.name);
    expect(updated.email).toBe(user.email);
  });

  test("deve lancar ForbiddenError ao tentar alterar outro usuario, sem consultar o repositorio", async () => {
    const user = makeUser();
    const other = makeUser({ email: "joao@example.com" });
    const userRepository = new FakeUserRepository([user, other]);
    const findSpy = jest.spyOn(userRepository, "findById");
    const useCase = new UpdateUser(userRepository);

    const promise = useCase.execute({
      requesterId: user.id,
      id: other.id,
      name: "Invasor Silva",
    });

    await expect(promise).rejects.toThrow(ForbiddenError);
    await expect(promise).rejects.toMatchObject({
      message: "user.forbidden",
      statusCode: 403,
    });
    expect(findSpy).not.toHaveBeenCalled();
    expect(userRepository.users).toEqual([user, other]);
  });

  test("deve lancar NotFoundError quando o proprio usuario nao existir mais", async () => {
    const userRepository = new FakeUserRepository();
    const updateSpy = jest.spyOn(userRepository, "update");
    const useCase = new UpdateUser(userRepository);
    const id = makeUser().id;

    const promise = useCase.execute({ requesterId: id, id, name: "Maria Souza" });

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toMatchObject({ message: "user.not.found", statusCode: 404 });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("deve interromper antes de persistir quando os dados forem invalidos", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const updateSpy = jest.spyOn(userRepository, "update");
    const useCase = new UpdateUser(userRepository);

    await expect(
      useCase.execute({ requesterId: user.id, id: user.id, email: "invalido" }),
    ).rejects.toThrow(ValidationException);

    expect(updateSpy).not.toHaveBeenCalled();
    expect(userRepository.users).toEqual([user]);
  });
});
