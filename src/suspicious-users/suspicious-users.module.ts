import { Module } from '@nestjs/common';
import { SuspiciousUsersService } from './suspicious-users.service';
import { SuspiciousUsersController } from './suspicious-users.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SuspiciousUsersController],
  providers: [SuspiciousUsersService],
  exports: [SuspiciousUsersService],
})
export class SuspiciousUsersModule {}
