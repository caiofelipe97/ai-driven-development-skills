import { NotFoundError, ValidationException } from "@app/shared";
import { UpdateUser } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("UpdateUser", () => {
  test("deve validar e substituir o usuario existente", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const useCase = new UpdateUser(userRepository);
    const updated = user.clone({ name: "Maria Souza" });

    await expect(useCase.execute({ entity: updated })).resolves.toBe(updated);

    expect(userRepository.users).toEqual([updated]);
    expect(userRepository.users[0].name).toBe("Maria Souza");
  });

  test("deve lancar NotFoundError quando o usuario nao existir", async () => {
    const userRepository = new FakeUserRepository();
    const updateSpy = jest.spyOn(userRepository, "update");
    const useCase = new UpdateUser(userRepository);

    const promise = useCase.execute({ entity: makeUser() });

    await expect(promise).rejects.toThrow(NotFoundError);
    await expect(promise).rejects.toMatchObject({
      message: "user.not.found",
      statusCode: 404,
    });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  test("deve interromper antes de consultar o repositorio quando a entidade for invalida", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const findByIdSpy = jest.spyOn(userRepository, "findById");
    const useCase = new UpdateUser(userRepository);

    await expect(
      useCase.execute({ entity: user.clone({ name: "" }) }),
    ).rejects.toThrow(ValidationException);

    expect(findByIdSpy).not.toHaveBeenCalled();
    expect(userRepository.users).toEqual([user]);
  });
});
