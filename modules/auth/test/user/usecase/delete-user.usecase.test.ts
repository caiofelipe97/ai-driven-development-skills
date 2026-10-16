import { ForbiddenError } from "@app/shared";
import { DeleteUser } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("DeleteUser", () => {
  test("deve excluir o proprio usuario", async () => {
    const user = makeUser();
    const other = makeUser({ email: "joao@example.com" });
    const userRepository = new FakeUserRepository([user, other]);
    const useCase = new DeleteUser(userRepository);

    await expect(
      useCase.execute({ requesterId: user.id, id: user.id }),
    ).resolves.toBeUndefined();

    await expect(userRepository.findById(user.id)).resolves.toBeNull();
    expect(userRepository.users).toEqual([other]);
  });

  test("deve lancar ForbiddenError ao tentar excluir outro usuario", async () => {
    const user = makeUser();
    const other = makeUser({ email: "joao@example.com" });
    const userRepository = new FakeUserRepository([user, other]);
    const deleteSpy = jest.spyOn(userRepository, "delete");
    const useCase = new DeleteUser(userRepository);

    const promise = useCase.execute({ requesterId: user.id, id: other.id });

    await expect(promise).rejects.toThrow(ForbiddenError);
    await expect(promise).rejects.toMatchObject({ message: "user.forbidden", statusCode: 403 });
    expect(deleteSpy).not.toHaveBeenCalled();
    expect(userRepository.users).toEqual([user, other]);
  });

  test("deve continuar previsivel quando o proprio id nao existir", async () => {
    const userRepository = new FakeUserRepository();
    const useCase = new DeleteUser(userRepository);

    await expect(
      useCase.execute({ requesterId: "missing-id", id: "missing-id" }),
    ).resolves.toBeUndefined();
  });
});
