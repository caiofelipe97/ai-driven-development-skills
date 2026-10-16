import { DeleteUser } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("DeleteUser", () => {
  test("deve excluir o usuario quando ele existir", async () => {
    const user = makeUser();
    const other = makeUser({ email: "joao@example.com" });
    const userRepository = new FakeUserRepository([user, other]);
    const useCase = new DeleteUser(userRepository);

    await expect(useCase.execute({ id: user.id })).resolves.toBeUndefined();

    await expect(userRepository.findById(user.id)).resolves.toBeNull();
    expect(userRepository.users).toEqual([other]);
  });

  test("deve continuar previsivel quando o id nao existir", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const useCase = new DeleteUser(userRepository);

    await expect(useCase.execute({ id: "missing-id" })).resolves.toBeUndefined();

    expect(userRepository.users).toEqual([user]);
  });
});
