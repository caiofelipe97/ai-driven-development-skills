import { FindUserPage } from "../../../src";
import { FakeUserRepository, makeUser } from "../../mock";

describe("FindUserPage", () => {
  const users = ["ana", "bia", "caio", "duda", "eva"].map((name) =>
    makeUser({ name: `${name} Silva`, email: `${name}@example.com` }),
  );

  test("deve devolver a primeira pagina com o total", async () => {
    const useCase = new FindUserPage(new FakeUserRepository(users));

    await expect(useCase.execute({ page: 1, perPage: 2 })).resolves.toEqual({
      items: users.slice(0, 2),
      page: 1,
      perPage: 2,
      total: 5,
    });
  });

  test("deve devolver a ultima pagina parcial", async () => {
    const useCase = new FindUserPage(new FakeUserRepository(users));

    const result = await useCase.execute({ page: 3, perPage: 2 });

    expect(result.items).toEqual([users[4]]);
    expect(result.total).toBe(5);
  });

  test("deve devolver lista vazia quando nao houver usuarios", async () => {
    const useCase = new FindUserPage(new FakeUserRepository());

    await expect(useCase.execute({ page: 1, perPage: 10 })).resolves.toEqual({
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
    });
  });
});
