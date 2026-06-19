import { Module } from '@nestjs/common';
import { RiskScoresService } from './risk-scores.service';
import { RiskScoresController } from './risk-scores.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [RiskScoresController],
  providers: [RiskScoresService],
  exports: [RiskScoresService],
})
export class RiskScoresModule {}
