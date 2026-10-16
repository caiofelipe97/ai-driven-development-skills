import { NotFoundError, UseCase } from "@app/shared";
import { User } from "../model";
import { UserRepository } from "../provider";

export interface UpdateUserIn {
  entity: User;
}

export class UpdateUser
  implements UseCase<UpdateUserIn, User>
{
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserIn): Promise<User> {
    input.entity.validate();

    const existingUser = await this.userRepository.findById(input.entity.id);

    if (!existingUser) {
      throw new NotFoundError("user.not.found");
    }

    return this.userRepository.update(input.entity);
  }
}
