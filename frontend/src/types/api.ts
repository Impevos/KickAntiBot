export type UserRole = 'STREAMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  channelCount?: number;
  channels?: Channel[];
}

export interface Channel {
  id: string;
  kickChannelId: string;
  channelName: string;
  kickAvatarUrl?: string | null;
  isActive: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
  error?: {
    statusCode: number;
    message: string;
  };
}

export interface PaginationMeta {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertType = 'SPAM_ATTACK' | 'BOT_DETECTED' | 'RATE_LIMIT' | string;

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  isRead: boolean;
  createdAt: string;
  suspiciousUser?: {
    id: string;
    username: string;
    severity: AlertSeverity;
  };
}

export interface DashboardSummary {
  activeAlertsCount: number;
  totalSuspiciousUsersCount: number;
  averageRiskScore: number;
  recentAlerts: Alert[];
  todayStats: {
    alertsCreated: number;
    newBotsDetected: number;
  };
}

export type SuspiciousUserStatus =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'SAFE'
  | 'BANNED';

export interface SuspiciousUser {
  id: string;
  kickUserId: string;
  username: string;
  reason: string;
  tags: string[];
  status: SuspiciousUserStatus;
  severity: AlertSeverity;
  channelId: string;
  firstSeen: string;
  lastSeen: string;
}

export interface ProtectionSettings {
  id: string;
  channelId: string;
  autoBlockEnabled: boolean;
  autoBanEnabled: boolean;
  alertOnDetection: boolean;
  riskScoreThreshold: number;
  maxMessagesPerMinute: number;
  createdAt: string;
  updatedAt: string;
}

export type ActivityLogType =
  | 'ALERT'
  | 'SUSPICIOUS_USER'
  | 'RISK_SCORE'
  | 'REPORT';

export interface ActivityLog {
  id: string;
  type: ActivityLogType;
  title: string;
  description: string;
  severity: AlertSeverity;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export type ProtectionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export const PROTECTION_PRESETS: Record<
  ProtectionLevel,
  Pick<
    ProtectionSettings,
    | 'autoBlockEnabled'
    | 'autoBanEnabled'
    | 'alertOnDetection'
    | 'riskScoreThreshold'
    | 'maxMessagesPerMinute'
  >
> = {
  LOW: {
    autoBlockEnabled: false,
    autoBanEnabled: false,
    alertOnDetection: true,
    riskScoreThreshold: 85,
    maxMessagesPerMinute: 20,
  },
  MEDIUM: {
    autoBlockEnabled: true,
    autoBanEnabled: false,
    alertOnDetection: true,
    riskScoreThreshold: 70,
    maxMessagesPerMinute: 12,
  },
  HIGH: {
    autoBlockEnabled: true,
    autoBanEnabled: true,
    alertOnDetection: true,
    riskScoreThreshold: 55,
    maxMessagesPerMinute: 8,
  },
};
