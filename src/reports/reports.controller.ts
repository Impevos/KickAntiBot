import { Controller, Get, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports-query.dto';
import { DashboardSummaryQueryDto } from './dto/dashboard-summary-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('api/reports')
  async findAll(
    @GetUser() user: User,
    @Query() query: ReportsQueryDto,
  ) {
    return this.reportsService.findAll(user, query.channelId, query.period);
  }

  @Get('api/reports/:id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reportsService.findOne(id, user);
  }

  @Get('api/dashboard/summary')
  async getDashboardSummary(
    @GetUser() user: User,
    @Query() query: DashboardSummaryQueryDto,
  ) {
    return this.reportsService.getDashboardSummary(user, query.channelId);
  }
}
