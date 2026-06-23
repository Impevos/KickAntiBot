import type {
  ActivityLog,
  Channel,
  DashboardSummary,
  ProtectionSettings,
  SuspiciousUser,
  User,
} from '../types/api';

export const MOCK_CHANNEL: Channel = {
  id: 'mock-channel-1',
  kickChannelId: 'kickstreamer',
  channelName: 'Demo Kick Kanalı',
  kickAvatarUrl: null,
  isActive: true,
};

export const MOCK_USER: User = {
  id: 'mock-user-1',
  email: 'demo@kickantibot.com',
  displayName: 'Demo Yayıncı',
  avatarUrl: null,
  role: 'STREAMER',
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-20T10:00:00.000Z',
  channelCount: 1,
  channels: [MOCK_CHANNEL],
};

export const MOCK_DASHBOARD: DashboardSummary = {
  activeAlertsCount: 3,
  totalSuspiciousUsersCount: 15,
  averageRiskScore: 62.5,
  recentAlerts: [
    {
      id: 'alert-1',
      type: 'SPAM_ATTACK',
      severity: 'HIGH',
      message: 'Kanalınızda yoğun spam saldırısı tespit edildi.',
      isRead: false,
      createdAt: '2026-06-23T14:30:00.000Z',
    },
    {
      id: 'alert-2',
      type: 'BOT_DETECTED',
      severity: 'CRITICAL',
      message: 'Yüksek risk skorlu bot hesabı tespit edildi.',
      isRead: false,
      createdAt: '2026-06-23T12:15:00.000Z',
    },
    {
      id: 'alert-3',
      type: 'RATE_LIMIT',
      severity: 'MEDIUM',
      message: 'Anormal mesaj hızı algılandı.',
      isRead: true,
      createdAt: '2026-06-22T20:00:00.000Z',
    },
  ],
  todayStats: {
    alertsCreated: 2,
    newBotsDetected: 1,
  },
};

export const MOCK_SUSPICIOUS_USERS: SuspiciousUser[] = [
  {
    id: 'su-1',
    kickUserId: 'kick-user-123',
    username: 'suspicious_bot',
    reason: 'Aşırı hızlı mesaj gönderimi',
    tags: ['spam', 'bot'],
    status: 'DETECTED',
    severity: 'HIGH',
    channelId: MOCK_CHANNEL.id,
    firstSeen: '2026-06-19T08:00:00.000Z',
    lastSeen: '2026-06-23T10:00:00.000Z',
  },
  {
    id: 'su-2',
    kickUserId: 'kick-user-456',
    username: 'spam_master99',
    reason: 'Tekrarlayan spam mesajları',
    tags: ['spam'],
    status: 'INVESTIGATING',
    severity: 'MEDIUM',
    channelId: MOCK_CHANNEL.id,
    firstSeen: '2026-06-20T15:00:00.000Z',
    lastSeen: '2026-06-23T09:30:00.000Z',
  },
  {
    id: 'su-3',
    kickUserId: 'kick-user-789',
    username: 'bot_account_x',
    reason: 'Şüpheli hesap davranışı',
    tags: ['bot', 'new_account'],
    status: 'BANNED',
    severity: 'CRITICAL',
    channelId: MOCK_CHANNEL.id,
    firstSeen: '2026-06-18T10:00:00.000Z',
    lastSeen: '2026-06-21T18:00:00.000Z',
  },
  {
    id: 'su-4',
    kickUserId: 'kick-user-101',
    username: 'normal_viewer',
    reason: 'Yanlış pozitif — incelendi',
    tags: [],
    status: 'SAFE',
    severity: 'LOW',
    channelId: MOCK_CHANNEL.id,
    firstSeen: '2026-06-22T08:00:00.000Z',
    lastSeen: '2026-06-22T12:00:00.000Z',
  },
];

export const MOCK_PROTECTION_SETTINGS: ProtectionSettings = {
  id: 'ps-1',
  channelId: MOCK_CHANNEL.id,
  autoBlockEnabled: false,
  autoBanEnabled: false,
  alertOnDetection: true,
  riskScoreThreshold: 70,
  maxMessagesPerMinute: 10,
  createdAt: '2026-06-01T10:00:00.000Z',
  updatedAt: '2026-06-20T10:00:00.000Z',
};

export const MOCK_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    type: 'ALERT',
    title: 'SPAM_ATTACK',
    description: 'Kanalınızda yoğun spam saldırısı tespit edildi.',
    severity: 'HIGH',
    createdAt: '2026-06-23T14:30:00.000Z',
    metadata: { isRead: false, suspiciousUsername: 'suspicious_bot' },
  },
  {
    id: 'log-2',
    type: 'SUSPICIOUS_USER',
    title: 'Şüpheli kullanıcı: bot_account_x',
    description: 'Şüpheli hesap davranışı',
    severity: 'CRITICAL',
    createdAt: '2026-06-21T18:00:00.000Z',
    metadata: {
      kickUserId: 'kick-user-789',
      username: 'bot_account_x',
      status: 'BANNED',
      tags: ['bot', 'new_account'],
    },
  },
  {
    id: 'log-3',
    type: 'RISK_SCORE',
    title: 'Risk skoru güncellendi',
    description: 'suspicious_bot için risk skoru 85 olarak hesaplandı',
    severity: 'HIGH',
    createdAt: '2026-06-23T10:00:00.000Z',
    metadata: { score: 85, username: 'suspicious_bot' },
  },
  {
    id: 'log-4',
    type: 'REPORT',
    title: 'Haftalık rapor oluşturuldu',
    description: '12 bot tespit edildi, 8 alarm oluşturuldu',
    severity: 'LOW',
    createdAt: '2026-06-20T00:00:00.000Z',
    metadata: { period: 'WEEKLY', totalBotsDetected: 12 },
  },
];
