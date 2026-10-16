import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthController } from './auth.controller';
import { PrismaUserRepository } from './user.prisma';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [PrismaUserRepository],
  exports: [PrismaUserRepository],
})
export class AuthModule {}
