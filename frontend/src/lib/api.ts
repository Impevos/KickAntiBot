import axios, {
  isAxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiResponse } from '../types/api';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || '';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

interface ApiRequestConfig extends AxiosRequestConfig {
  skipAuth?: boolean;
}

function getToken(): string | null {
  return localStorage.getItem('accessToken');
}

export function setTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('accessToken', accessToken);
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
}

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

function parseErrorPayload(
  payload: unknown,
  fallbackStatus: number,
): ApiError {
  const json = payload as ApiResponse<unknown>;
  return new ApiError(
    json.error?.message || 'Bir hata oluştu.',
    json.error?.statusCode || fallbackStatus,
  );
}

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
    if (!config.skipAuth) {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
);

apiClient.interceptors.response.use(
  (response) => {
    const json = response.data as ApiResponse<unknown>;
    if (!json.success) {
      throw parseErrorPayload(json, response.status);
    }
    return response;
  },
  (error: unknown) => {
    if (isAxiosError(error) && error.response?.data) {
      throw parseErrorPayload(error.response.data, error.response.status);
    }

    if (isAxiosError(error)) {
      throw new ApiError(
        error.message || 'Ağ hatası oluştu.',
        error.response?.status ?? 0,
      );
    }

    throw error;
  },
);

function toAxiosConfig(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): ApiRequestConfig {
  const method = (options.method?.toUpperCase() || 'GET') as AxiosRequestConfig['method'];

  let data: unknown;
  if (options.body) {
    data =
      typeof options.body === 'string'
        ? JSON.parse(options.body)
        : options.body;
  }

  const config: ApiRequestConfig = {
    url: path,
    method,
    data,
    skipAuth: !requireAuth,
  };

  if (options.headers) {
    config.headers = {
      ...(options.headers as Record<string, string>),
    };
  }

  return config;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  if (USE_MOCK) {
    throw new ApiError('Mock mode enabled', 0);
  }

  const response = await apiClient.request<ApiResponse<T>>(
    toAxiosConfig(path, options, requireAuth),
  );

  return response.data.data as T;
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: ApiResponse<T>['meta'] }> {
  if (USE_MOCK) {
    throw new ApiError('Mock mode enabled', 0);
  }

  const response = await apiClient.request<ApiResponse<T>>(
    toAxiosConfig(path, options, true),
  );

  return {
    data: response.data.data as T,
    meta: response.data.meta,
  };
}

export { USE_MOCK };
