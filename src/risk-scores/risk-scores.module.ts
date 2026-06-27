import { Module } from '@nestjs/common';
import { RiskScoresService } from './risk-scores.service';
import { RiskScoresController } from './risk-scores.controller';
import { AuthModule } from '../auth/auth.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AuthModule, AlertsModule],
  controllers: [RiskScoresController],
  providers: [RiskScoresService],
  exports: [RiskScoresService],
})
export class RiskScoresModule {}
