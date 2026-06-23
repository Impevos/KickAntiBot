import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role } from '@prisma/client';

describe('Kick Anti-Bot API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'e2e-test@kickantibot.local',
    displayName: 'E2E Test User',
    avatarUrl: null,
    role: Role.STREAMER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let channelId: string;
  let suspiciousUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = testUser;
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.upsert({
      where: { id: testUser.id },
      update: { email: testUser.email, displayName: testUser.displayName },
      create: {
        id: testUser.id,
        email: testUser.email,
        displayName: testUser.displayName,
        role: Role.STREAMER,
      },
    });
  });

  afterAll(async () => {
    if (channelId) {
      await prisma.channel.deleteMany({ where: { id: channelId } });
    }
    await prisma.user.deleteMany({ where: { id: testUser.id } });
    await app.close();
  });

  describe('Auth validation', () => {
    it('POST /api/auth/register - rejects invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'TestPass123!' })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.statusCode).toBe(400);
        });
    });

    it('POST /api/auth/login - rejects missing fields', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@test.com' })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('Profile', () => {
    it('GET /api/auth/me - returns profile', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.email).toBe(testUser.email);
        });
    });

    it('PATCH /api/auth/me - updates profile', () => {
      return request(app.getHttpServer())
        .patch('/api/auth/me')
        .set('Authorization', 'Bearer test-token')
        .send({ displayName: 'Updated E2E User' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.displayName).toBe('Updated E2E User');
        });
    });
  });

  describe('Channels', () => {
    it('POST /api/channels - creates channel with default protection settings', () => {
      return request(app.getHttpServer())
        .post('/api/channels')
        .set('Authorization', 'Bearer test-token')
        .send({ kickChannelId: `e2e-channel-${Date.now()}`, channelName: 'E2E Test Channel' })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBeDefined();
          channelId = res.body.data.id;
        });
    });

    it('GET /api/channels - lists channels', () => {
      return request(app.getHttpServer())
        .get('/api/channels')
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('GET /api/channels/:id - gets channel detail', () => {
      return request(app.getHttpServer())
        .get(`/api/channels/${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data._count).toBeDefined();
        });
    });

    it('PUT /api/channels/:id - updates channel', () => {
      return request(app.getHttpServer())
        .put(`/api/channels/${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ channelName: 'Updated E2E Channel' })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.channelName).toBe('Updated E2E Channel');
        });
    });
  });

  describe('Protection Settings', () => {
    it('GET /api/protection-settings - returns settings', () => {
      return request(app.getHttpServer())
        .get(`/api/protection-settings?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.riskScoreThreshold).toBe(70);
        });
    });

    it('PATCH /api/protection-settings - updates settings', () => {
      return request(app.getHttpServer())
        .patch(`/api/protection-settings?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .send({ autoBlockEnabled: true, riskScoreThreshold: 80 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.autoBlockEnabled).toBe(true);
          expect(res.body.data.riskScoreThreshold).toBe(80);
        });
    });

    it('GET /api/protection-settings - requires channelId', () => {
      return request(app.getHttpServer())
        .get('/api/protection-settings')
        .set('Authorization', 'Bearer test-token')
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
        });
    });
  });

  describe('Suspicious Users', () => {
    it('POST /api/suspicious-users - creates suspicious user', () => {
      return request(app.getHttpServer())
        .post('/api/suspicious-users')
        .set('Authorization', 'Bearer test-token')
        .send({
          kickUserId: `kick-user-${Date.now()}`,
          username: 'bot_user_e2e',
          channelId,
          reason: 'Aşırı hızlı mesaj gönderimi',
          tags: ['spam', 'bot'],
          severity: 'HIGH',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          suspiciousUserId = res.body.data.id;
        });
    });

    it('GET /api/suspicious-users - lists with pagination', () => {
      return request(app.getHttpServer())
        .get(`/api/suspicious-users?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.meta.totalItems).toBeGreaterThanOrEqual(1);
        });
    });

    it('GET /api/suspicious-users/:id - gets detail', () => {
      return request(app.getHttpServer())
        .get(`/api/suspicious-users/${suspiciousUserId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.riskScores).toBeDefined();
        });
    });
  });

  describe('Risk Scores', () => {
    it('POST /api/risk-scores - creates risk score', () => {
      return request(app.getHttpServer())
        .post('/api/risk-scores')
        .set('Authorization', 'Bearer test-token')
        .send({
          suspiciousUserId,
          score: 85,
          reason: 'Yüksek mesaj frekansı',
          algorithmVersion: 'v1.0.0',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.score).toBe(85);
        });
    });

    it('GET /api/risk-scores/:suspiciousUserId - gets history', () => {
      return request(app.getHttpServer())
        .get(`/api/risk-scores/${suspiciousUserId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('Alerts', () => {
    beforeAll(async () => {
      await prisma.alert.create({
        data: {
          type: 'SPAM_ATTACK',
          severity: 'HIGH',
          message: 'E2E test alert',
          channelId,
          suspiciousUserId,
        },
      });
    });

    it('GET /api/alerts - requires channelId', () => {
      return request(app.getHttpServer())
        .get('/api/alerts')
        .set('Authorization', 'Bearer test-token')
        .expect(400);
    });

    it('GET /api/alerts - lists alerts', () => {
      return request(app.getHttpServer())
        .get(`/api/alerts?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    it('PATCH /api/alerts/:id/read - marks as read', async () => {
      const alerts = await prisma.alert.findMany({ where: { channelId }, take: 1 });
      return request(app.getHttpServer())
        .patch(`/api/alerts/${alerts[0].id}/read`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.isRead).toBe(true);
        });
    });
  });

  describe('Dashboard & Reports', () => {
    beforeAll(async () => {
      await prisma.report.create({
        data: {
          period: 'DAILY',
          startDate: new Date(),
          endDate: new Date(),
          summaryData: { totalBots: 1, totalAlerts: 1 },
          channelId,
        },
      });
    });

    it('GET /api/dashboard/summary - returns dashboard data', () => {
      return request(app.getHttpServer())
        .get(`/api/dashboard/summary?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.activeAlertsCount).toBeDefined();
          expect(res.body.data.todayStats).toBeDefined();
        });
    });

    it('GET /api/reports - lists reports', () => {
      return request(app.getHttpServer())
        .get(`/api/reports?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('Activity Logs', () => {
    it('GET /api/activity-logs - returns unified log feed', () => {
      return request(app.getHttpServer())
        .get(`/api/activity-logs?channelId=${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.meta).toBeDefined();
          expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });
  });

  describe('Authorization', () => {
    it('GET /api/channels - rejects without token', async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const unauthApp = moduleFixture.createNestApplication();
      unauthApp.useGlobalFilters(new HttpExceptionFilter());
      unauthApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      await unauthApp.init();

      await request(unauthApp.getHttpServer())
        .get('/api/channels')
        .expect(401)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.error.statusCode).toBe(401);
        });

      await unauthApp.close();
    });
  });

  describe('Cleanup', () => {
    it('DELETE /api/channels/:id - deletes channel', () => {
      return request(app.getHttpServer())
        .delete(`/api/channels/${channelId}`)
        .set('Authorization', 'Bearer test-token')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});
