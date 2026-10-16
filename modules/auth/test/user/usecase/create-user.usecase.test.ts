import { ValidationException } from "@app/shared";
import { CreateUser, User } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("CreateUser", () => {
  afterEach(() => jest.restoreAllMocks());

  test("deve validar e persistir o usuario no caminho feliz", async () => {
    const userRepository = new FakeUserRepository();
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new CreateUser(userRepository);
    const user = makeUser();

    await expect(useCase.execute({ entity: user })).resolves.toBe(user);

    expect(validateSpy).toHaveBeenCalledTimes(1);
    await expect(userRepository.findById(user.id)).resolves.toBe(user);
  });

  test("deve interromper antes de persistir quando a entidade for invalida", async () => {
    const userRepository = new FakeUserRepository();
    const createSpy = jest.spyOn(userRepository, "create");
    const useCase = new CreateUser(userRepository);

    await expect(
      useCase.execute({ entity: makeUser({ email: "invalido" }) }),
    ).rejects.toThrow(ValidationException);

    expect(createSpy).not.toHaveBeenCalled();
    expect(userRepository.users).toEqual([]);
  });
});
