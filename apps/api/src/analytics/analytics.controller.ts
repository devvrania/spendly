import { Controller, Get, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { CategoryBreakdownQueryDto, DateRangeQueryDto, MonthlyTrendQueryDto } from './dto/analytics.dto';

@ApiTags('analytics')
@ApiCookieAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('summary')
  summary(@CurrentUser() user: AuthUser, @Query() q: DateRangeQueryDto) {
    return this.analytics.summary(user.id, q);
  }

  @Get('category-breakdown')
  categoryBreakdown(@CurrentUser() user: AuthUser, @Query() q: CategoryBreakdownQueryDto) {
    return this.analytics.categoryBreakdown(user.id, q);
  }

  @Get('monthly-trend')
  monthlyTrend(@CurrentUser() user: AuthUser, @Query() q: MonthlyTrendQueryDto) {
    return this.analytics.monthlyTrend(user.id, q);
  }

  @Get('wallet-balances')
  walletBalances(@CurrentUser() user: AuthUser) {
    return this.analytics.walletBalancesSummary(user.id);
  }
}
