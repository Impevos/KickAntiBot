import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AlertType, Severity } from '@prisma/client';

@Injectable()
export class DetectionAlertService {
  constructor(private prisma: PrismaService) {}

  async maybeAlertOnDetection(params: {
    channelId: string;
    suspiciousUserId: string;
    username: string;
    score: number;
    severity: Severity;
    reason: string;
  }) {
    const settings = await this.prisma.channelProtectionSettings.findUnique({
      where: { channelId: params.channelId },
    });

    if (!settings?.alertOnDetection) {
      return null;
    }

    if (params.score < settings.riskScoreThreshold) {
      return null;
    }

    const type =
      params.score >= 80
        ? AlertType.SPAM_ATTACK
        : params.score >= 60
          ? AlertType.SUSPICIOUS_ACTIVITY
          : AlertType.CHAT_GLITCH;

    return this.prisma.alert.create({
      data: {
        type,
        severity: params.severity,
        message: `⚠️ ${params.username}: risk skoru ${params.score} (eşik ${settings.riskScoreThreshold}). ${params.reason}`,
        channelId: params.channelId,
        suspiciousUserId: params.suspiciousUserId,
      },
    });
  }

  async maybeAlertOnNewSuspiciousUser(params: {
    channelId: string;
    suspiciousUserId: string;
    username: string;
    severity: Severity;
    reason: string;
  }) {
    const settings = await this.prisma.channelProtectionSettings.findUnique({
      where: { channelId: params.channelId },
    });

    if (!settings?.alertOnDetection) {
      return null;
    }

    if (params.severity !== Severity.HIGH && params.severity !== Severity.CRITICAL) {
      return null;
    }

    return this.prisma.alert.create({
      data: {
        type: AlertType.SUSPICIOUS_ACTIVITY,
        severity: params.severity,
        message: `🔍 Yeni şüpheli kullanıcı: ${params.username}. ${params.reason}`,
        channelId: params.channelId,
        suspiciousUserId: params.suspiciousUserId,
      },
    });
  }
}
