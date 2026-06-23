import { useQuery } from '@tanstack/react-query';
import { suspiciousUsersService } from '../services/api-services';
import type { AlertSeverity, SuspiciousUserStatus } from '../types/api';

interface UseSuspiciousUsersParams {
  channelId: string | undefined;
  search?: string;
  status?: SuspiciousUserStatus;
  severity?: AlertSeverity;
  page?: number;
  limit?: number;
}

export function useSuspiciousUsers({
  channelId,
  search,
  status,
  severity,
  page = 1,
  limit = 10,
}: UseSuspiciousUsersParams) {
  return useQuery({
    queryKey: [
      'suspicious-users',
      channelId,
      search,
      status,
      severity,
      page,
      limit,
    ],
    queryFn: () =>
      suspiciousUsersService.getList({
        channelId: channelId!,
        search,
        status,
        severity,
        page,
        limit,
      }),
    enabled: !!channelId,
  });
}
