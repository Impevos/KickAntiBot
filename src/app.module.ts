import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { SuspiciousUsersModule } from './suspicious-users/suspicious-users.module';
import { RiskScoresModule } from './risk-scores/risk-scores.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    // Core Modules
    PrismaModule,
    AuthModule,
    ChannelsModule,
    SuspiciousUsersModule,
    RiskScoresModule,
    AlertsModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
