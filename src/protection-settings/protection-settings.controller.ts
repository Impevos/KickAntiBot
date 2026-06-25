import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ProtectionSettingsService } from './protection-settings.service';
import { UpdateProtectionSettingsDto } from './dto/update-protection-settings.dto';
import { ProtectionSettingsQueryDto } from './dto/protection-settings-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('api/protection-settings')
@UseGuards(JwtAuthGuard)
export class ProtectionSettingsController {
  constructor(private readonly protectionSettingsService: ProtectionSettingsService) {}

  @Get()
  async getSettings(@GetUser() user: User, @Query() query: ProtectionSettingsQueryDto) {
    return this.protectionSettingsService.getByChannelId(query.channelId, user);
  }

  @Patch()
  async updateSettings(
    @GetUser() user: User,
    @Query() query: ProtectionSettingsQueryDto,
    @Body() updateDto: UpdateProtectionSettingsDto,
  ) {
    return this.protectionSettingsService.update(query.channelId, user, updateDto);
  }
}
