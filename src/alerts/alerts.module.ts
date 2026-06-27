import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { DetectionAlertService } from './detection-alert.service';
import { AlertsController } from './alerts.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AlertsController],
  providers: [AlertsService, DetectionAlertService],
  exports: [AlertsService, DetectionAlertService],
})
export class AlertsModule {}
