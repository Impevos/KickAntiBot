import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { SuspiciousUsersService } from './suspicious-users.service';
import { CreateSuspiciousUserDto } from './dto/create-suspicious-user.dto';
import { SuspiciousUsersQueryDto } from './dto/suspicious-users-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

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
    @Query() query: SuspiciousUsersQueryDto,
  ) {
    return this.suspiciousUsersService.findAll(user, query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.suspiciousUsersService.findOne(id, user);
  }
}
