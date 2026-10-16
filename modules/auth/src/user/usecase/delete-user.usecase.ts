import { ForbiddenError, UseCase } from "@app/shared";
import { UserRepository } from "../provider";

export interface DeleteUserIn {
  requesterId: string;
  id: string;
}

export class DeleteUser
  implements UseCase<DeleteUserIn, void>
{
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: DeleteUserIn): Promise<void> {
    if (input.requesterId !== input.id) {
      throw new ForbiddenError("user.forbidden");
    }

    await this.userRepository.delete(input.id);
  }
}
