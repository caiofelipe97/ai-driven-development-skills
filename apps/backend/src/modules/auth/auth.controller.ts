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
  Post,
  Query,
} from '@nestjs/common';
import {
  DeleteUser,
  FindUserById,
  FindUserPage,
  LoginUser,
  RegisterUser,
  UpdateUser,
  type LoginUserIn,
  type RegisterUserIn,
  type User,
} from '@app/auth';
import { NotFoundError, type PageResult } from '@app/shared';
import { CurrentUser, Public } from '../../shared/decorators';
import { BcryptCryptoProvider } from './bcrypt.crypto';
import { JwtTokenProvider } from './jwt.token';
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
  constructor(
    private readonly userRepository: PrismaUserRepository,
    private readonly cryptoProvider: BcryptCryptoProvider,
    private readonly tokenProvider: JwtTokenProvider,
  ) {}

  @Get('/')
  getAuth() {
    return { message: 'Auth endpoint' };
  }

  @Public()
  @Post('/register')
  async register(@Body() body: RegisterUserIn): Promise<UserResponse> {
    const useCase = new RegisterUser(this.cryptoProvider, this.userRepository);
    const { user } = await useCase.execute({ ...body });

    return toUserResponse(user);
  }

  @Public()
  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginUserIn,
  ): Promise<{ accessToken: string; user: UserResponse }> {
    const useCase = new LoginUser(
      this.cryptoProvider,
      this.tokenProvider,
      this.userRepository,
    );
    const { accessToken, user } = await useCase.execute({ ...body });

    return { accessToken, user: toUserResponse(user) };
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
    const { name, email } = body ?? {};
    const user = await new FindUserById(this.userRepository).execute({ id });

    if (!user) {
      throw new NotFoundError('user.not.found');
    }

    const useCase = new UpdateUser(this.userRepository);
    const updated = await useCase.execute({
      entity: user.clone({
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
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
