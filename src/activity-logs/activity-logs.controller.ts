import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService, ActivityLogType } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('api/activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @Get()
  async findAll(
    @GetUser() user: User,
    @Query('channelId') channelId: string,
    @Query('type') type?: ActivityLogType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityLogsService.findAll(user, {
      channelId,
      type,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}
