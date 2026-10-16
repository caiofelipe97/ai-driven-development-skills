import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { AuthController } from './auth.controller';
import { BcryptCryptoProvider } from './bcrypt.crypto';
import { JwtTokenProvider } from './jwt.token';
import { PrismaUserRepository } from './user.prisma';

@Module({
  imports: [DbModule],
  controllers: [AuthController],
  providers: [PrismaUserRepository, BcryptCryptoProvider, JwtTokenProvider],
  exports: [PrismaUserRepository, BcryptCryptoProvider, JwtTokenProvider],
})
export class AuthModule {}
