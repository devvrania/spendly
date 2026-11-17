import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTransactionDto, ListTransactionsQueryDto, UpdateTransactionDto } from './dto/transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiCookieAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListTransactionsQueryDto) {
    return this.transactions.list(user.id, q);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.get(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactions.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.transactions.remove(user.id, id);
  }
}
