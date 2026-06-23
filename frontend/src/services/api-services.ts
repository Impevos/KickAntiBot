import {
  apiRequest,
  apiRequestWithMeta,
  clearTokens,
  setTokens,
  USE_MOCK,
  ApiError,
} from '../lib/api';
import {
  MOCK_ACTIVITY_LOGS,
  MOCK_DASHBOARD,
  MOCK_PROTECTION_SETTINGS,
  MOCK_REPORTS,
  MOCK_RISK_SCORES,
  MOCK_SUSPICIOUS_USERS,
  MOCK_USER,
  MOCK_CHANNEL,
} from '../lib/mock-data';
import { paginateArray } from '../lib/pagination';
import type {
  ActivityLog,
  ActivityLogType,
  Alert,
  Channel,
  DashboardSummary,
  LoginResponse,
  PaginatedResult,
  ProtectionSettings,
  Report,
  ReportPeriod,
  RiskScore,
  SuspiciousUser,
  SuspiciousUserDetail,
  SuspiciousUserStatus,
  AlertSeverity,
  User,
} from '../types/api';

function shouldUseMock(err: unknown): boolean {
  return USE_MOCK || (err instanceof ApiError && err.statusCode === 0);
}

async function withMockFallback<T>(
  request: () => Promise<T>,
  mockValue: T,
): Promise<T> {
  try {
    return await request();
  } catch (err: unknown) {
    if (shouldUseMock(err)) {
      return mockValue;
    }
    throw err;
  }
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    if (USE_MOCK) {
      const mockResponse: LoginResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: 3600,
        user: { ...MOCK_USER, email },
      };
      setTokens(mockResponse.accessToken, mockResponse.refreshToken);
      return mockResponse;
    }

    try {
      const data = await apiRequest<LoginResponse>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
        false,
      );
      setTokens(data.accessToken, data.refreshToken);
      return data;
    } catch (err: unknown) {
      if (!shouldUseMock(err)) throw err;
      const mockResponse: LoginResponse = {
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh',
        expiresIn: 3600,
        user: MOCK_USER,
      };
      setTokens(mockResponse.accessToken, mockResponse.refreshToken);
      return mockResponse;
    }
  },

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ user: User }> {
    if (USE_MOCK) {
      return { user: { ...MOCK_USER, email, displayName } };
    }

    return withMockFallback(
      () =>
        apiRequest<{ user: User }>(
          '/api/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({ email, password, displayName }),
          },
          false,
        ),
      { user: { ...MOCK_USER, email, displayName } },
    );
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<void>('/api/auth/logout', { method: 'POST' });
    } catch {
      // Çıkışta API hatası olsa bile oturumu temizle
    } finally {
      clearTokens();
    }
  },

  async getMe(): Promise<User> {
    return withMockFallback(
      () => apiRequest<User>('/api/auth/me'),
      MOCK_USER,
    );
  },

  async updateProfile(data: {
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return withMockFallback(
      () =>
        apiRequest<User>('/api/auth/me', {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      { ...MOCK_USER, ...data },
    );
  },
};

export const channelService = {
  async getChannels(): Promise<Channel[]> {
    return withMockFallback(
      () => apiRequest<Channel[]>('/api/channels'),
      [MOCK_CHANNEL],
    );
  },

  async getChannel(id: string): Promise<Channel> {
    return withMockFallback(
      () => apiRequest<Channel>(`/api/channels/${id}`),
      MOCK_CHANNEL,
    );
  },

  async createChannel(data: {
    kickChannelId: string;
    channelName: string;
  }): Promise<Channel> {
    return withMockFallback(
      () =>
        apiRequest<Channel>('/api/channels', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      { ...MOCK_CHANNEL, ...data },
    );
  },

  async updateChannel(
    id: string,
    data: { channelName?: string; isActive?: boolean },
  ): Promise<Channel> {
    return withMockFallback(
      () =>
        apiRequest<Channel>(`/api/channels/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
      { ...MOCK_CHANNEL, id, ...data },
    );
  },

  async deleteChannel(id: string): Promise<void> {
    return withMockFallback(
      () => apiRequest<void>(`/api/channels/${id}`, { method: 'DELETE' }),
      undefined,
    );
  },
};

export const dashboardService = {
  async getSummary(channelId: string): Promise<DashboardSummary> {
    return withMockFallback(
      () =>
        apiRequest<DashboardSummary>(
          `/api/dashboard/summary?channelId=${channelId}`,
        ),
      MOCK_DASHBOARD,
    );
  },
};

export const suspiciousUsersService = {
  async getList(params: {
    channelId: string;
    status?: SuspiciousUserStatus;
    severity?: AlertSeverity;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<SuspiciousUser>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const query = new URLSearchParams({ channelId: params.channelId });
    if (params.status) query.set('status', params.status);
    if (params.severity) query.set('severity', params.severity);
    if (params.search) query.set('search', params.search);
    query.set('page', String(page));
    query.set('limit', String(limit));

    return withMockFallback(async () => {
      const result = await apiRequestWithMeta<SuspiciousUser[]>(
        `/api/suspicious-users?${query}`,
      );
      const meta = result.meta;
      return {
        data: result.data,
        totalItems: meta?.totalItems ?? result.data.length,
        totalPages: meta?.totalPages ?? 1,
        currentPage: meta?.currentPage ?? page,
        itemsPerPage: meta?.itemsPerPage ?? limit,
      };
    }, (() => {
      let filtered = [...MOCK_SUSPICIOUS_USERS];
      if (params.status) {
        filtered = filtered.filter((u) => u.status === params.status);
      }
      if (params.severity) {
        filtered = filtered.filter((u) => u.severity === params.severity);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter((u) =>
          u.username.toLowerCase().includes(q),
        );
      }
      return paginateArray(filtered, page, limit);
    })());
  },

  async getById(id: string): Promise<SuspiciousUserDetail> {
    return withMockFallback(
      () => apiRequest<SuspiciousUserDetail>(`/api/suspicious-users/${id}`),
      { ...MOCK_SUSPICIOUS_USERS[0], riskScores: MOCK_RISK_SCORES },
    );
  },
};

export const protectionService = {
  async getSettings(channelId: string): Promise<ProtectionSettings> {
    return withMockFallback(
      () =>
        apiRequest<ProtectionSettings>(
          `/api/protection-settings?channelId=${channelId}`,
        ),
      MOCK_PROTECTION_SETTINGS,
    );
  },

  async updateSettings(
    channelId: string,
    data: Partial<ProtectionSettings>,
  ): Promise<ProtectionSettings> {
    return withMockFallback(
      () =>
        apiRequest<ProtectionSettings>(
          `/api/protection-settings?channelId=${channelId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(data),
          },
        ),
      { ...MOCK_PROTECTION_SETTINGS, ...data, channelId },
    );
  },
};

export const activityLogsService = {
  async getLogs(params: {
    channelId: string;
    type?: ActivityLogType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<ActivityLog>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const query = new URLSearchParams({ channelId: params.channelId });
    if (params.type) query.set('type', params.type);
    query.set('page', String(page));
    query.set('limit', String(limit));

    return withMockFallback(async () => {
      const result = await apiRequestWithMeta<ActivityLog[]>(
        `/api/activity-logs?${query}`,
      );
      const meta = result.meta;
      return {
        data: result.data,
        totalItems: meta?.totalItems ?? result.data.length,
        totalPages: meta?.totalPages ?? 1,
        currentPage: meta?.currentPage ?? page,
        itemsPerPage: meta?.itemsPerPage ?? limit,
      };
    }, (() => {
      let filtered = [...MOCK_ACTIVITY_LOGS];
      if (params.type) {
        filtered = filtered.filter((l) => l.type === params.type);
      }
      return paginateArray(filtered, page, limit);
    })());
  },
};

export const alertsService = {
  async getAlerts(params: {
    channelId: string;
    isRead?: boolean;
    limit?: number;
  }): Promise<Alert[]> {
    const query = new URLSearchParams({ channelId: params.channelId });
    if (params.isRead !== undefined) {
      query.set('isRead', String(params.isRead));
    }
    if (params.limit) query.set('limit', String(params.limit));

    return withMockFallback(
      () => apiRequest<Alert[]>(`/api/alerts?${query}`),
      MOCK_DASHBOARD.recentAlerts,
    );
  },

  async markAsRead(id: string): Promise<void> {
    return withMockFallback(
      () =>
        apiRequest<void>(`/api/alerts/${id}/read`, { method: 'PATCH' }),
      undefined,
    );
  },
};

export const riskScoresService = {
  async getHistory(suspiciousUserId: string): Promise<RiskScore[]> {
    return withMockFallback(
      () =>
        apiRequest<RiskScore[]>(`/api/risk-scores/${suspiciousUserId}`),
      MOCK_RISK_SCORES,
    );
  },
};

export const reportsService = {
  async getReports(params: {
    channelId: string;
    period?: ReportPeriod;
  }): Promise<Report[]> {
    const query = new URLSearchParams({ channelId: params.channelId });
    if (params.period) query.set('period', params.period);

    return withMockFallback(
      () => apiRequest<Report[]>(`/api/reports?${query}`),
      MOCK_REPORTS,
    );
  },

  async getReportById(id: string): Promise<Report> {
    return withMockFallback(
      () => apiRequest<Report>(`/api/reports/${id}`),
      MOCK_REPORTS[0],
    );
  },
};
