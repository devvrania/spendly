import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateWalletDto, ListWalletsQueryDto, UpdateWalletDto } from './dto/wallet.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiCookieAuth()
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListWalletsQueryDto) {
    return this.wallets.list(user.id, q.includeArchived);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWalletDto) {
    return this.wallets.create(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.wallets.get(user.id, id);
  }

  @Patch(':id')
  rename(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateWalletDto) {
    return this.wallets.rename(user.id, id, dto);
  }

  @Patch(':id/archive')
  archive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.wallets.setArchived(user.id, id, true);
  }

  @Patch(':id/unarchive')
  unarchive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.wallets.setArchived(user.id, id, false);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.wallets.remove(user.id, id);
  }
}
