import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/api-services';
import type { ReportPeriod } from '../types/api';

export function useReports(
  channelId: string | undefined,
  period?: ReportPeriod,
) {
  return useQuery({
    queryKey: ['reports', channelId, period],
    queryFn: () =>
      reportsService.getReports({
        channelId: channelId!,
        period,
      }),
    enabled: !!channelId,
  });
}
