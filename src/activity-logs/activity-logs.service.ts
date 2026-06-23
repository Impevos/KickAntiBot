import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { User, Role } from '@prisma/client';

export type ActivityLogType = 'ALERT' | 'SUSPICIOUS_USER' | 'RISK_SCORE' | 'REPORT';

export interface ActivityLogEntry {
  id: string;
  type: ActivityLogType;
  title: string;
  description: string;
  severity: string | null;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

@Injectable()
export class ActivityLogsService {
  constructor(private prisma: PrismaService) {}

  private async verifyChannelOwnership(channelId: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalın geçmiş kayıtlarına erişme yetkiniz yok.');
    }

    return channel;
  }

  async findAll(
    user: User,
    filters: {
      channelId: string;
      type?: ActivityLogType;
      page?: number;
      limit?: number;
    },
  ) {
    const { channelId, type, page = 1, limit = 20 } = filters;

    if (!channelId) {
      throw new BadRequestException('Filtreleme için channelId parametresi zorunludur.');
    }

    await this.verifyChannelOwnership(channelId, user);

    const fetchLimit = page * limit;
    const logs: ActivityLogEntry[] = [];

    if (!type || type === 'ALERT') {
      const alerts = await this.prisma.alert.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        include: {
          suspiciousUser: {
            select: { username: true },
          },
        },
      });

      logs.push(
        ...alerts.map((alert) => ({
          id: alert.id,
          type: 'ALERT' as const,
          title: alert.type,
          description: alert.message,
          severity: alert.severity,
          createdAt: alert.createdAt,
          metadata: {
            isRead: alert.isRead,
            suspiciousUsername: alert.suspiciousUser?.username ?? null,
            resolvedAt: alert.resolvedAt,
          },
        })),
      );
    }

    if (!type || type === 'SUSPICIOUS_USER') {
      const suspiciousUsers = await this.prisma.suspiciousUser.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
      });

      logs.push(
        ...suspiciousUsers.map((su) => ({
          id: su.id,
          type: 'SUSPICIOUS_USER' as const,
          title: `Şüpheli kullanıcı: ${su.username}`,
          description: su.reason,
          severity: su.severity,
          createdAt: su.createdAt,
          metadata: {
            kickUserId: su.kickUserId,
            username: su.username,
            status: su.status,
            tags: su.tags,
          },
        })),
      );
    }

    if (!type || type === 'RISK_SCORE') {
      const riskScores = await this.prisma.riskScore.findMany({
        where: {
          suspiciousUser: { channelId },
        },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
        include: {
          suspiciousUser: {
            select: { username: true, kickUserId: true },
          },
        },
      });

      logs.push(
        ...riskScores.map((rs) => ({
          id: rs.id,
          type: 'RISK_SCORE' as const,
          title: `Risk skoru: ${rs.score}`,
          description: rs.reason,
          severity: rs.score >= 80 ? 'CRITICAL' : rs.score >= 60 ? 'HIGH' : rs.score >= 35 ? 'MEDIUM' : 'LOW',
          createdAt: rs.createdAt,
          metadata: {
            score: rs.score,
            algorithmVersion: rs.algorithmVersion,
            username: rs.suspiciousUser.username,
            kickUserId: rs.suspiciousUser.kickUserId,
          },
        })),
      );
    }

    if (!type || type === 'REPORT') {
      const reports = await this.prisma.report.findMany({
        where: { channelId },
        orderBy: { createdAt: 'desc' },
        take: fetchLimit,
      });

      logs.push(
        ...reports.map((report) => ({
          id: report.id,
          type: 'REPORT' as const,
          title: `${report.period} raporu`,
          description: `${report.startDate.toISOString()} - ${report.endDate.toISOString()} dönemi özeti`,
          severity: null,
          createdAt: report.createdAt,
          metadata: {
            period: report.period,
            startDate: report.startDate,
            endDate: report.endDate,
            summaryData: report.summaryData,
          },
        })),
      );
    }

    logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const skip = (page - 1) * limit;
    const paginatedLogs = logs.slice(skip, skip + limit);
    const totalItems = logs.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    return {
      success: true,
      data: paginatedLogs,
      meta: {
        totalItems,
        itemCount: paginatedLogs.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
