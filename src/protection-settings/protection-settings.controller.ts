import { Controller, Get, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { ProtectionSettingsService } from './protection-settings.service';
import { UpdateProtectionSettingsDto } from './dto/update-protection-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('api/protection-settings')
@UseGuards(JwtAuthGuard)
export class ProtectionSettingsController {
  constructor(private readonly protectionSettingsService: ProtectionSettingsService) {}

  @Get()
  async getSettings(@GetUser() user: User, @Query('channelId') channelId: string) {
    return this.protectionSettingsService.getByChannelId(channelId, user);
  }

  @Patch()
  async updateSettings(
    @GetUser() user: User,
    @Query('channelId') channelId: string,
    @Body() updateDto: UpdateProtectionSettingsDto,
  ) {
    return this.protectionSettingsService.update(channelId, user, updateDto);
  }
}
