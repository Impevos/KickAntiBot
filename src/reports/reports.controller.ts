import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, ReportPeriod } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('api/reports')
  async findAll(
    @GetUser() user: User,
    @Query('channelId') channelId: string,
    @Query('period') period?: ReportPeriod,
  ) {
    return this.reportsService.findAll(user, channelId, period);
  }

  @Get('api/reports/:id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.reportsService.findOne(id, user);
  }

  @Get('api/dashboard/summary')
  async getDashboardSummary(
    @GetUser() user: User,
    @Query('channelId') channelId: string,
  ) {
    return this.reportsService.getDashboardSummary(user, channelId);
  }
}
