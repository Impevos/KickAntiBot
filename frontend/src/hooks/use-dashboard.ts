import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../lib/api';
import type { DashboardSummary } from '../types/api';

export function useDashboardSummary(channelId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'summary', channelId],
    queryFn: () =>
      apiRequest<DashboardSummary>(
        `/api/dashboard/summary?channelId=${channelId}`,
      ),
    enabled: !!channelId,
    retry: 1,
  });
}
