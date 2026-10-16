import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import {
  DeleteUser,
  FindUserById,
  FindUserPage,
  UpdateUser,
  type User,
} from '@app/auth';
import { NotFoundError, type PageResult } from '@app/shared';
import { CurrentUser } from '../../shared/decorators';
import { PrismaUserRepository } from './user.prisma';

type UpdateUserHttpBody = {
  name?: string;
  email?: string;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null | undefined;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly userRepository: PrismaUserRepository) {}

  @Get('/')
  getAuth() {
    return { message: 'Auth endpoint' };
  }

  @Get('/me')
  async me(@CurrentUser('id') userId: string): Promise<UserResponse> {
    return this.findUserOrFail(userId);
  }

  @Get('/users')
  async findPage(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('perPage', new DefaultValuePipe(10), ParseIntPipe) perPage: number,
  ): Promise<PageResult<UserResponse>> {
    const useCase = new FindUserPage(this.userRepository);
    const result = await useCase.execute({ page, perPage });

    return { ...result, items: result.items.map(toUserResponse) };
  }

  @Get('/users/:id')
  async findById(@Param('id') id: string): Promise<UserResponse> {
    return this.findUserOrFail(id);
  }

  @Patch('/users/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserHttpBody,
  ): Promise<UserResponse> {
    const user = await new FindUserById(this.userRepository).execute({ id });

    if (!user) {
      throw new NotFoundError('user.not.found');
    }

    const useCase = new UpdateUser(this.userRepository);
    const updated = await useCase.execute({
      entity: user.clone({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
      }),
    });

    return toUserResponse(updated);
  }

  @Delete('/users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    const useCase = new DeleteUser(this.userRepository);

    await useCase.execute({ id });
  }

  private async findUserOrFail(id: string): Promise<UserResponse> {
    const useCase = new FindUserById(this.userRepository);
    const user = await useCase.execute({ id });

    if (!user) {
      throw new NotFoundError('user.not.found');
    }

    return toUserResponse(user);
  }
}

function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    deletedAt: user.deletedAt,
  };
}
