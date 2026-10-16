import {
  DomainError,
  NoCommonPasswordRule,
  RequiredRule,
  StrongPasswordRule,
  UseCase,
  Validator,
} from "@app/shared";
import { User } from "../model";
import { CryptoProvider, UserRepository } from "../provider";

export interface RegisterUserIn {
  name: string;
  email: string;
  password: string;
}

export interface RegisterUserOut {
  user: User;
}

export class RegisterUser
  implements UseCase<RegisterUserIn, RegisterUserOut>
{
  constructor(
    private readonly cryptoProvider: CryptoProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: RegisterUserIn): Promise<RegisterUserOut> {
    Validator.validate([
      {
        code: "user.password",
        value: input.password,
        rules: [
          new RequiredRule(),
          new StrongPasswordRule(),
          new NoCommonPasswordRule(),
        ],
      },
    ]);

    const email = normalizeEmail(input.email);
    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new DomainError("user.email.already.exists", 409);
    }

    const hashedPassword = await this.cryptoProvider.encrypt(input.password);
    const user = new User({
      name: input.name,
      email,
      password: hashedPassword,
    });

    user.validate();

    return { user: await this.userRepository.create(user) };
  }
}

function normalizeEmail(email: string): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}
