import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { resolveEnvFilePaths } from './config/env.util';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { SuspiciousUsersModule } from './suspicious-users/suspicious-users.module';
import { RiskScoresModule } from './risk-scores/risk-scores.module';
import { AlertsModule } from './alerts/alerts.module';
import { ReportsModule } from './reports/reports.module';
import { ProtectionSettingsModule } from './protection-settings/protection-settings.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveEnvFilePaths(),
    }),

    // Global rate limiting: varsayilan olarak IP basina 60 saniyede 100 istek.
    // Hassas endpoint'ler (login/register) ayrica @Throttle ile siniandirilir.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),

    // Core Modules
    PrismaModule,
    AuthModule,
    ChannelsModule,
    SuspiciousUsersModule,
    RiskScoresModule,
    AlertsModule,
    ReportsModule,
    ProtectionSettingsModule,
    ActivityLogsModule,
  ],
  controllers: [],
  providers: [
    // Rate limiting tum uygulamaya global guard olarak uygulanir.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
