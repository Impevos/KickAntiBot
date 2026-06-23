import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async create(user: User, createChannelDto: CreateChannelDto) {
    const { kickChannelId, channelName } = createChannelDto;

    // Check if channel already registered
    const existingChannel = await this.prisma.channel.findUnique({
      where: { kickChannelId },
    });

    if (existingChannel) {
      throw new BadRequestException('Bu Kick kanalı sistemde zaten kayıtlı.');
    }

    // Mocking Kick API data (as Kick does not provide a official public API)
    const mockFollowersCount = Math.floor(Math.random() * 500000) + 1000;
    const mockAvatarUrl = `https://kick.com/avatars/${kickChannelId}.png`;

    const channel = await this.prisma.channel.create({
      data: {
        kickChannelId,
        channelName,
        kickAvatarUrl: mockAvatarUrl,
        kickFollowersCount: mockFollowersCount,
        ownerId: user.id,
        protectionSettings: {
          create: {},
        },
      },
      include: {
        protectionSettings: true,
      },
    });

    return {
      success: true,
      data: channel,
    };
  }

  async findAll(user: User) {
    // Admin gets all channels, Streamer gets only their own channels
    const channels = await this.prisma.channel.findMany({
      where: user.role === Role.ADMIN ? {} : { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: channels,
    };
  }

  async findOne(id: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            suspiciousUsers: true,
            alerts: true,
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    // Check ownership
    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalın detaylarını görme yetkiniz yok.');
    }

    return {
      success: true,
      data: channel,
    };
  }

  async update(id: string, user: User, updateChannelDto: UpdateChannelDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    // Check ownership
    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalı güncelleme yetkiniz yok.');
    }

    const updatedChannel = await this.prisma.channel.update({
      where: { id },
      data: updateChannelDto,
    });

    return {
      success: true,
      message: 'Kanal başarıyla güncellendi.',
      data: updatedChannel,
    };
  }

  async remove(id: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    // Check ownership
    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalı silme yetkiniz yok.');
    }

    await this.prisma.channel.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Kanal ve ilişkili tüm veriler başarıyla silindi.',
    };
  }
}
