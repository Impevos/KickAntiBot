import { Module } from '@nestjs/common';
import { ProtectionSettingsService } from './protection-settings.service';
import { ProtectionSettingsController } from './protection-settings.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ProtectionSettingsController],
  providers: [ProtectionSettingsService],
  exports: [ProtectionSettingsService],
})
export class ProtectionSettingsModule {}
