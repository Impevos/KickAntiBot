import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { User, Role } from '@prisma/client';

@Injectable()
export class AlertsService {
  constructor(private prisma: PrismaService) {}

  private async verifyChannelOwnership(channelId: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalın bildirimlerine erişme yetkiniz yok.');
    }

    return channel;
  }

  async findAll(user: User, channelId: string, isRead?: boolean, limit = 20) {
    if (!channelId) {
      throw new BadRequestException('Filtreleme için channelId parametresi zorunludur.');
    }

    // Verify ownership
    await this.verifyChannelOwnership(channelId, user);

    const whereClause: any = {
      channelId,
    };

    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    const alerts = await this.prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        suspiciousUser: {
          select: {
            id: true,
            username: true,
            severity: true,
          },
        },
      },
    });

    return {
      success: true,
      data: alerts,
    };
  }

  async markAsRead(id: string, user: User) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: { channel: true },
    });

    if (!alert) {
      throw new NotFoundException('Bildirim bulunamadı.');
    }

    // Verify channel ownership
    if (user.role !== Role.ADMIN && alert.channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu bildirimi güncelleme yetkiniz yok.');
    }

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        isRead: true,
        resolvedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Bildirim okundu olarak işaretlendi.',
      data: updatedAlert,
    };
  }
}
