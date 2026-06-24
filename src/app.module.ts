import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
  providers: [],
})
export class AppModule {}
