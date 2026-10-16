import { UnauthorizedError, UseCase } from "@app/shared";
import { User } from "../model";
import { CryptoProvider, TokenProvider, UserRepository } from "../provider";

export interface LoginUserIn {
  email: string;
  password: string;
}

export interface LoginUserOut {
  accessToken: string;
  user: User;
}

export class LoginUser implements UseCase<LoginUserIn, LoginUserOut> {
  constructor(
    private readonly cryptoProvider: CryptoProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: LoginUserIn): Promise<LoginUserOut> {
    const email =
      typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const user = email ? await this.userRepository.findByEmail(email) : null;

    const isValid =
      !!user &&
      !user.deletedAt &&
      typeof input.password === "string" &&
      (await this.cryptoProvider.compare(input.password, user.password));

    if (!user || !isValid) {
      throw new UnauthorizedError("auth.invalid.credentials");
    }

    const accessToken = await this.tokenProvider.generate({
      sub: user.id,
      email: user.email,
    });

    return { accessToken, user };
  }
}
