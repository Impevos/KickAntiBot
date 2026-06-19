import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { User, Role, ReportPeriod } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async verifyChannelOwnership(channelId: string, user: User) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException('Kanal bulunamadı.');
    }

    if (user.role !== Role.ADMIN && channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kanalın raporlarına erişme yetkiniz yok.');
    }

    return channel;
  }

  async findAll(user: User, channelId: string, period?: ReportPeriod) {
    if (!channelId) {
      throw new BadRequestException('Filtreleme için channelId parametresi zorunludur.');
    }

    // Verify channel ownership
    await this.verifyChannelOwnership(channelId, user);

    const whereClause: any = {
      channelId,
    };

    if (period) {
      whereClause.period = period;
    }

    const reports = await this.prisma.report.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: reports,
    };
  }

  async findOne(id: string, user: User) {
    const report = await this.prisma.report.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Rapor bulunamadı.');
    }

    // Verify channel ownership
    await this.verifyChannelOwnership(report.channelId, user);

    return {
      success: true,
      data: report,
    };
  }

  async getDashboardSummary(user: User, channelId: string) {
    if (!channelId) {
      throw new BadRequestException('Dashboard özeti için channelId parametresi zorunludur.');
    }

    // Verify channel ownership
    await this.verifyChannelOwnership(channelId, user);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Unread/Active alerts count
    const activeAlertsCount = await this.prisma.alert.count({
      where: {
        channelId,
        isRead: false,
      },
    });

    // 2. Total suspicious users count
    const totalSuspiciousUsersCount = await this.prisma.suspiciousUser.count({
      where: {
        channelId,
      },
    });

    // 3. Average risk score of suspicious users in this channel
    const riskAggregation = await this.prisma.riskScore.aggregate({
      _avg: {
        score: true,
      },
      where: {
        suspiciousUser: {
          channelId,
        },
      },
    });
    const averageRiskScore = riskAggregation._avg.score ? Math.round(riskAggregation._avg.score * 10) / 10 : 0.0;

    // 4. Recent alerts
    const recentAlerts = await this.prisma.alert.findMany({
      where: {
        channelId,
        isRead: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // 5. Today's stats
    const newBotsDetectedToday = await this.prisma.suspiciousUser.count({
      where: {
        channelId,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    const newAlertsToday = await this.prisma.alert.count({
      where: {
        channelId,
        createdAt: {
          gte: startOfToday,
        },
      },
    });

    return {
      success: true,
      data: {
        activeAlertsCount,
        totalSuspiciousUsersCount,
        averageRiskScore,
        recentAlerts,
        todayStats: {
          alertsCreated: newAlertsToday,
          newBotsDetected: newBotsDetectedToday,
        },
      },
    };
  }
}
