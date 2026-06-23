import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UpdateProtectionSettingsDto } from './dto/update-protection-settings.dto';
import { User, Role } from '@prisma/client';

@Injectable()
export class ProtectionSettingsService {
  constructor(private prisma: PrismaService) {}

  private async verifyChannelOwnership(channelId: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalın koruma ayarlarına erişme yetkiniz yok.');
    }

    return channel;
  }

  async getByChannelId(channelId: string, user: User) {
    if (!channelId) {
      throw new BadRequestException('channelId parametresi zorunludur.');
    }

    await this.verifyChannelOwnership(channelId, user);

    let settings = await this.prisma.channelProtectionSettings.findUnique({
      where: { channelId },
    });

    if (!settings) {
      settings = await this.prisma.channelProtectionSettings.create({
        data: { channelId },
      });
    }

    return {
      success: true,
      data: settings,
    };
  }

  async update(channelId: string, user: User, updateDto: UpdateProtectionSettingsDto) {
    if (!channelId) {
      throw new BadRequestException('channelId parametresi zorunludur.');
    }

    await this.verifyChannelOwnership(channelId, user);

    const settings = await this.prisma.channelProtectionSettings.upsert({
      where: { channelId },
      update: updateDto,
      create: {
        channelId,
        ...updateDto,
      },
    });

    return {
      success: true,
      message: 'Koruma ayarları başarıyla güncellendi.',
      data: settings,
    };
  }
}
