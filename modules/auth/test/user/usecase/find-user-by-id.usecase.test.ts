import { FindUserById } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("FindUserById", () => {
  test("deve devolver o usuario encontrado", async () => {
    const user = makeUser();
    const userRepository = new FakeUserRepository([user]);
    const useCase = new FindUserById(userRepository);

    await expect(useCase.execute({ id: user.id })).resolves.toBe(user);
  });

  test("deve devolver null quando o usuario nao existir", async () => {
    const userRepository = new FakeUserRepository();
    const useCase = new FindUserById(userRepository);

    await expect(useCase.execute({ id: "missing-id" })).resolves.toBeNull();
  });
});
