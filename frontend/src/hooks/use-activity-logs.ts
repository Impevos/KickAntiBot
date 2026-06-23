import { useQuery } from '@tanstack/react-query';
import { activityLogsService } from '../services/api-services';
import type { ActivityLogType } from '../types/api';

interface UseActivityLogsParams {
  channelId: string | undefined;
  type?: ActivityLogType;
  page?: number;
  limit?: number;
}

export function useActivityLogs({
  channelId,
  type,
  page = 1,
  limit = 20,
}: UseActivityLogsParams) {
  return useQuery({
    queryKey: ['activity-logs', channelId, type, page, limit],
    queryFn: () =>
      activityLogsService.getLogs({
        channelId: channelId!,
        type,
        page,
        limit,
      }),
    enabled: !!channelId,
  });
}
