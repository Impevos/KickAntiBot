import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SupabaseService } from './supabase.service';
import { RolesGuard } from './guards/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseService, RolesGuard, JwtAuthGuard],
  exports: [AuthService, SupabaseService, RolesGuard, JwtAuthGuard],
})
export class AuthModule {}
