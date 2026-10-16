import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ListMyTransactions,
  type ListMyTransactionsIn,
} from '@app/transactions';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { PrismaTransactionRepository } from './transaction.prisma';

type ListMyTransactionsHttpQuery = {
  page?: number;
  perPage?: number;
};

@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionRepository: PrismaTransactionRepository,
  ) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  async listMine(
    @CurrentUser('id') userId: string,
    @Query() query: ListMyTransactionsHttpQuery,
  ) {
    const useCase = new ListMyTransactions(this.transactionRepository);

    const input: ListMyTransactionsIn = {
      ...query,
      userId,
    };

    return await useCase.execute(input);
  }
}

