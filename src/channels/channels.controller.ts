import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('api/channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  async create(@GetUser() user: User, @Body() createChannelDto: CreateChannelDto) {
    return this.channelsService.create(user, createChannelDto);
  }

  @Get()
  async findAll(@GetUser() user: User) {
    return this.channelsService.findAll(user);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.channelsService.findOne(id, user);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @GetUser() user: User,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, user, updateChannelDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: User) {
    return this.channelsService.remove(id, user);
  }
}
