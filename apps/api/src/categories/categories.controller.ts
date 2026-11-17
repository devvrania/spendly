import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, ListCategoriesQueryDto, UpdateCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@ApiCookieAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() q: ListCategoriesQueryDto) {
    return this.categories.list(user.id, q.type, q.includeArchived);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.id, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(user.id, id, dto);
  }

  @Patch(':id/archive')
  archive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.categories.setArchived(user.id, id, true);
  }

  @Patch(':id/unarchive')
  unarchive(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.categories.setArchived(user.id, id, false);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.categories.remove(user.id, id);
  }
}
