import { Module } from '@nestjs/common';
import { SuspiciousUsersService } from './suspicious-users.service';
import { SuspiciousUsersController } from './suspicious-users.controller';
import { AuthModule } from '../auth/auth.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [AuthModule, AlertsModule],
  controllers: [SuspiciousUsersController],
  providers: [SuspiciousUsersService],
  exports: [SuspiciousUsersService],
})
export class SuspiciousUsersModule {}
