import { PrismaClient, Role, SuspiciousUserStatus, Severity, AlertType, ReportPeriod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL;

  if (!ownerEmail) {
    console.error('SEED_OWNER_EMAIL ortam değişkeni gerekli. Örnek: SEED_OWNER_EMAIL=you@email.com npx prisma db seed');
    process.exit(1);
  }

  const owner = await prisma.user.findUnique({ where: { email: ownerEmail } });

  if (!owner) {
    console.error(`Kullanıcı bulunamadı: ${ownerEmail}. Önce Supabase üzerinden kayıt/giriş yapın.`);
    process.exit(1);
  }

  const kickChannelId = `seed-channel-${Date.now()}`;

  const channel = await prisma.channel.create({
    data: {
      kickChannelId,
      channelName: 'Demo Kick Kanalı',
      kickAvatarUrl: `https://kick.com/avatars/${kickChannelId}.png`,
      kickFollowersCount: 12500,
      ownerId: owner.id,
      protectionSettings: {
        create: {
          autoBlockEnabled: true,
          riskScoreThreshold: 70,
          alertOnDetection: true,
        },
      },
    },
  });

  const suspiciousUser = await prisma.suspiciousUser.create({
    data: {
      kickUserId: 'seed-bot-001',
      username: 'suspicious_bot_demo',
      reason: 'Dakikada 50+ mesaj gönderimi tespit edildi',
      tags: ['spam', 'bot'],
      status: SuspiciousUserStatus.DETECTED,
      severity: Severity.HIGH,
      channelId: channel.id,
    },
  });

  await prisma.riskScore.create({
    data: {
      score: 78,
      reason: 'Mesaj frekansı eşiği aşıldı',
      algorithmVersion: 'v1.0.0',
      suspiciousUserId: suspiciousUser.id,
      metadata: { messagesPerMinute: 52 },
    },
  });

  await prisma.alert.create({
    data: {
      type: AlertType.SPAM_ATTACK,
      severity: Severity.HIGH,
      message: 'Kanalınızda yoğun spam saldırısı tespit edildi.',
      channelId: channel.id,
      suspiciousUserId: suspiciousUser.id,
    },
  });

  await prisma.alert.create({
    data: {
      type: AlertType.BOT_FOLLOW_SPIKE,
      severity: Severity.MEDIUM,
      message: 'Son 1 saatte anormal takipçi artışı gözlendi.',
      channelId: channel.id,
    },
  });

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  await prisma.report.create({
    data: {
      period: ReportPeriod.WEEKLY,
      startDate: weekAgo,
      endDate: today,
      channelId: channel.id,
      summaryData: {
        totalBotsDetected: 12,
        totalAlerts: 8,
        averageRiskScore: 65.4,
        topThreats: ['spam', 'follow-bot'],
      },
    },
  });

  console.log('Seed tamamlandı!');
  console.log(`Kanal ID: ${channel.id}`);
  console.log(`Şüpheli kullanıcı ID: ${suspiciousUser.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
