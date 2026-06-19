import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('api/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  async findAll(
    @GetUser() user: User,
    @Query('channelId') channelId: string,
    @Query('isRead') isRead?: string,
    @Query('limit') limit?: string,
  ) {
    const isReadBool = isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.alertsService.findAll(user, channelId, isReadBool, limitNum);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @GetUser() user: User) {
    return this.alertsService.markAsRead(id, user);
  }
}
