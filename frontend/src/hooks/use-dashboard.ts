import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/api-services';

export function useDashboardSummary(channelId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'summary', channelId],
    queryFn: () => dashboardService.getSummary(channelId!),
    enabled: !!channelId,
  });
}
