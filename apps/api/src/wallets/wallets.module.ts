import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';

@Module({ imports: [AnalyticsModule], controllers: [WalletsController], providers: [WalletsService] })
export class WalletsModule {}
