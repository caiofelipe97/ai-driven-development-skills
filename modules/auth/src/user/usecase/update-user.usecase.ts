import { ForbiddenError, NotFoundError, UseCase } from "@app/shared";
import { User } from "../model";
import { UserRepository } from "../provider";
import { normalizeEmail } from "./normalize-email";

export interface UpdateUserIn {
  requesterId: string;
  id: string;
  name?: string;
  email?: string;
}

export class UpdateUser
  implements UseCase<UpdateUserIn, User>
{
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserIn): Promise<User> {
    if (input.requesterId !== input.id) {
      throw new ForbiddenError("user.forbidden");
    }

    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new NotFoundError("user.not.found");
    }

    const updated = user.clone({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.email !== undefined && { email: normalizeEmail(input.email) }),
    });

    updated.validate();

    return this.userRepository.update(updated);
  }
}
