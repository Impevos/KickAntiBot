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
  MOCK_SUSPICIOUS_USERS,
  MOCK_USER,
  MOCK_CHANNEL,
} from '../lib/mock-data';
import type {
  ActivityLog,
  ActivityLogType,
  Channel,
  DashboardSummary,
  LoginResponse,
  ProtectionSettings,
  SuspiciousUser,
  SuspiciousUserStatus,
  AlertSeverity,
  User,
} from '../types/api';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
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
      if (USE_MOCK || (err instanceof ApiError && err.statusCode === 0)) {
        const mockResponse: LoginResponse = {
          accessToken: 'mock-token',
          refreshToken: 'mock-refresh',
          expiresIn: 3600,
          user: MOCK_USER,
        };
        setTokens(mockResponse.accessToken, mockResponse.refreshToken);
        return mockResponse;
      }
      throw err;
    }
  },

  async register(
    email: string,
    password: string,
    displayName: string,
  ): Promise<{ user: User }> {
    try {
      return await apiRequest<{ user: User }>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, displayName }),
        },
        false,
      );
    } catch (err: unknown) {
      if (USE_MOCK || (err instanceof ApiError && err.statusCode === 0)) {
        return { user: { ...MOCK_USER, email, displayName } };
      }
      throw err;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<void>('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout errors
    } finally {
      clearTokens();
    }
  },

  async getMe(): Promise<User> {
    try {
      return await apiRequest<User>('/api/auth/me');
    } catch {
      return MOCK_USER;
    }
  },

  async updateProfile(data: {
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    try {
      return await apiRequest<User>('/api/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    } catch {
      return { ...MOCK_USER, ...data };
    }
  },
};

export const channelService = {
  async getChannels(): Promise<Channel[]> {
    try {
      return await apiRequest<Channel[]>('/api/channels');
    } catch {
      return [MOCK_CHANNEL];
    }
  },
};

export const dashboardService = {
  async getSummary(channelId: string): Promise<DashboardSummary> {
    try {
      return await apiRequest<DashboardSummary>(
        `/api/dashboard/summary?channelId=${channelId}`,
      );
    } catch {
      return MOCK_DASHBOARD;
    }
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
  }): Promise<{ data: SuspiciousUser[]; totalItems: number }> {
    const query = new URLSearchParams({ channelId: params.channelId });
    if (params.status) query.set('status', params.status);
    if (params.severity) query.set('severity', params.severity);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    try {
      const result = await apiRequestWithMeta<SuspiciousUser[]>(
        `/api/suspicious-users?${query}`,
      );
      return {
        data: result.data,
        totalItems: result.meta?.totalItems ?? result.data.length,
      };
    } catch {
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
      return { data: filtered, totalItems: filtered.length };
    }
  },
};

export const protectionService = {
  async getSettings(channelId: string): Promise<ProtectionSettings> {
    try {
      return await apiRequest<ProtectionSettings>(
        `/api/protection-settings?channelId=${channelId}`,
      );
    } catch {
      return MOCK_PROTECTION_SETTINGS;
    }
  },

  async updateSettings(
    channelId: string,
    data: Partial<ProtectionSettings>,
  ): Promise<ProtectionSettings> {
    try {
      return await apiRequest<ProtectionSettings>(
        `/api/protection-settings?channelId=${channelId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      );
    } catch {
      return { ...MOCK_PROTECTION_SETTINGS, ...data, channelId };
    }
  },
};

export const activityLogsService = {
  async getLogs(params: {
    channelId: string;
    type?: ActivityLogType;
    page?: number;
    limit?: number;
  }): Promise<{ data: ActivityLog[]; totalItems: number }> {
    const query = new URLSearchParams({ channelId: params.channelId });
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    try {
      const result = await apiRequestWithMeta<ActivityLog[]>(
        `/api/activity-logs?${query}`,
      );
      return {
        data: result.data,
        totalItems: result.meta?.totalItems ?? result.data.length,
      };
    } catch {
      let filtered = [...MOCK_ACTIVITY_LOGS];
      if (params.type) {
        filtered = filtered.filter((l) => l.type === params.type);
      }
      return { data: filtered, totalItems: filtered.length };
    }
  },
};
