import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateRiskScoreDto } from './dto/create-risk-score.dto';
import { DetectionAlertService } from '../alerts/detection-alert.service';
import { User, Role, Severity } from '@prisma/client';

@Injectable()
export class RiskScoresService {
  constructor(
    private prisma: PrismaService,
    private detectionAlert: DetectionAlertService,
  ) {}

  private async verifySuspiciousUserOwnership(suspiciousUserId: string, user: User) {
    const suspiciousUser = await this.prisma.suspiciousUser.findUnique({
      where: { id: suspiciousUserId },
      include: { channel: true },
    });

    if (!suspiciousUser) {
      throw new NotFoundException('Şüpheli kullanıcı bulunamadı.');
    }

    if (user.role !== Role.ADMIN && suspiciousUser.channel.ownerId !== user.id) {
      throw new ForbiddenException('Bu kullanıcının risk verilerine erişme yetkiniz yok.');
    }

    return suspiciousUser;
  }

  async create(user: User, createDto: CreateRiskScoreDto) {
    const { suspiciousUserId, score, reason, algorithmVersion, metadata } = createDto;

    // Verify channel ownership
    const suspiciousUser = await this.verifySuspiciousUserOwnership(suspiciousUserId, user);

    // Create risk score
    const riskScore = await this.prisma.riskScore.create({
      data: {
        score,
        reason,
        algorithmVersion,
        metadata: metadata || null,
        suspiciousUserId,
      },
    });

    // Update dynamic severity on SuspiciousUser depending on the new risk score
    let dynamicSeverity: Severity = Severity.LOW;
    if (score >= 80) {
      dynamicSeverity = Severity.CRITICAL;
    } else if (score >= 60) {
      dynamicSeverity = Severity.HIGH;
    } else if (score >= 35) {
      dynamicSeverity = Severity.MEDIUM;
    }

    await this.prisma.suspiciousUser.update({
      where: { id: suspiciousUserId },
      data: {
        severity: dynamicSeverity,
        lastSeen: new Date(),
      },
    });

    await this.detectionAlert.maybeAlertOnDetection({
      channelId: suspiciousUser.channelId,
      suspiciousUserId,
      username: suspiciousUser.username,
      score,
      severity: dynamicSeverity,
      reason,
    });

    return {
      success: true,
      data: riskScore,
    };
  }

  async findBySuspiciousUser(suspiciousUserId: string, user: User) {
    // Verify channel ownership
    await this.verifySuspiciousUserOwnership(suspiciousUserId, user);

    const history = await this.prisma.riskScore.findMany({
      where: { suspiciousUserId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: history,
    };
  }
}
