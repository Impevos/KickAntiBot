import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSuspiciousUserDto } from './dto/create-suspicious-user.dto';
import { User, Role, SuspiciousUserStatus, Severity } from '@prisma/client';

@Injectable()
export class SuspiciousUsersService {
  constructor(private prisma: PrismaService) {}

  private async verifyChannelOwnership(channelId: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalın verilerine erişme yetkiniz yok.');
    }

    return channel;
  }

  async create(user: User, createDto: CreateSuspiciousUserDto) {
    const { channelId, kickUserId, username, reason, tags, severity } = createDto;

    // Verify ownership of the channel
    await this.verifyChannelOwnership(channelId, user);

    // If already exists in this channel, we can update lastSeen, otherwise create new
    const existing = await this.prisma.suspiciousUser.findFirst({
      where: {
        channelId,
        kickUserId,
      },
    });

    if (existing) {
      const updated = await this.prisma.suspiciousUser.update({
        where: { id: existing.id },
        data: {
          lastSeen: new Date(),
          reason: `${existing.reason} | Yeni Neden: ${reason}`,
          status: SuspiciousUserStatus.INVESTIGATING,
        },
      });

      return {
        success: true,
        message: 'Şüpheli kullanıcı zaten mevcut, kayıt güncellendi.',
        data: updated,
      };
    }

    const suspiciousUser = await this.prisma.suspiciousUser.create({
      data: {
        kickUserId,
        username,
        reason,
        tags: tags || [],
        status: SuspiciousUserStatus.INVESTIGATING, // Default status for manual additions
        severity: severity || Severity.MEDIUM,
        channelId,
      },
    });

    return {
      success: true,
      data: suspiciousUser,
    };
  }

  async findAll(
    user: User,
    filters: {
      channelId: string;
      status?: SuspiciousUserStatus;
      severity?: Severity;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { channelId, status, severity, search, page = 1, limit = 10 } = filters;

    if (!channelId) {
      throw new BadRequestException('Filtreleme için channelId parametresi zorunludur.');
    }

    // Verify channel ownership
    await this.verifyChannelOwnership(channelId, user);

    // Build query conditions
    const whereClause: any = {
      channelId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (severity) {
      whereClause.severity = severity;
    }

    if (search) {
      whereClause.username = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.suspiciousUser.findMany({
        where: whereClause,
        orderBy: { lastSeen: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.suspiciousUser.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      data: items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findOne(id: string, user: User) {
    const suspiciousUser = await this.prisma.suspiciousUser.findUnique({
      where: { id },
      include: {
        riskScores: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!suspiciousUser) {
      throw new NotFoundException('Şüpheli kullanıcı bulunamadı.');
    }

    // Verify channel ownership
    await this.verifyChannelOwnership(suspiciousUser.channelId, user);

    return {
      success: true,
      data: suspiciousUser,
    };
  }
}
