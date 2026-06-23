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

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  requireAuth = true,
): Promise<T> {
  if (USE_MOCK) {
    throw new ApiError('Mock mode enabled', 0);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requireAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.message || 'Bir hata oluştu.',
      json.error?.statusCode || response.status,
    );
  }

  return json.data as T;
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta?: ApiResponse<T>['meta'] }> {
  if (USE_MOCK) {
    throw new ApiError('Mock mode enabled', 0);
  }

  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const response = await fetch(url, { ...options, headers });
  const json = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.error?.message || 'Bir hata oluştu.',
      json.error?.statusCode || response.status,
    );
  }

  return { data: json.data as T, meta: json.meta };
}

export { USE_MOCK };
