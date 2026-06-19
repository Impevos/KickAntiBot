import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SuspiciousUsersService } from './suspicious-users.service';
import { CreateSuspiciousUserDto } from './dto/create-suspicious-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User, SuspiciousUserStatus, Severity } from '@prisma/client';

@Controller('api/suspicious-users')
@UseGuards(JwtAuthGuard)
export class SuspiciousUsersController {
  constructor(private readonly suspiciousUsersService: SuspiciousUsersService) {}

  @Post()
  async create(
    @GetUser() user: User,
    @Body() createSuspiciousUserDto: CreateSuspiciousUserDto,
  ) {
    return this.suspiciousUsersService.create(user, createSuspiciousUserDto);
  }

  @Get()
  async findAll(
    @GetUser() user: User,
    @Query('channelId') channelId: string,
    @Query('status') status?: SuspiciousUserStatus,
    @Query('severity') severity?: Severity,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.suspiciousUsersService.findAll(user, {
      channelId,
      status,
      severity,
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.suspiciousUsersService.findOne(id, user);
  }
}
